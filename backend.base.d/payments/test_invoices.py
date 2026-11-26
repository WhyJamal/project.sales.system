from decimal import Decimal
from unittest import mock

from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from organizations.models import Organization
from users.models import CustomUser
from wallet.models import Wallet

from .invoices import InvoiceError, change_status, create_invoice, expire_stale
from .models import InvoiceEvent, InvoiceTopUp

S = InvoiceTopUp


class InvoiceFlowTests(TestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(username="client", email="c@x.uz", password="pw12345678")
        self.org = Organization.objects.create(name="Org", inn="123456789", owner=self.user)
        self.user.organization = self.org
        self.user.save()
        patcher = mock.patch("payments.telegram.notify_new")
        patcher2 = mock.patch("payments.telegram.refresh")
        patcher.start(); patcher2.start()
        self.addCleanup(patcher.stop); self.addCleanup(patcher2.stop)

    def make(self, **kw):
        data = dict(organization=self.org, user=self.user, amount="100000", inn="987654321", name="Client LLC")
        data.update(kw)
        return create_invoice(**data)

    def balance(self):
        return Wallet.objects.get(organization=self.org).balance

    def test_full_flow_credits_wallet_once(self):
        Wallet.objects.get_or_create(organization=self.org)
        inv = self.make()
        self.assertEqual(inv.status, S.STATUS_CREATED)
        change_status(inv.pk, S.STATUS_SENT, actor="panel:a", channel="panel")
        change_status(inv.pk, S.STATUS_SIGNED, actor="panel:a", channel="panel")
        self.assertEqual(self.balance(), Decimal("0"))  # signed is NOT money
        inv = change_status(inv.pk, S.STATUS_CONFIRMED, actor="panel:a", channel="panel")
        self.assertEqual(self.balance(), Decimal("100000"))
        self.assertIsNotNone(inv.wallet_transaction_id)
        with self.assertRaises(InvoiceError):  # a second confirm (double click) must not pay again
            change_status(inv.pk, S.STATUS_CONFIRMED, actor="panel:a", channel="panel")
        self.assertEqual(self.balance(), Decimal("100000"))
        self.assertEqual(InvoiceEvent.objects.filter(invoice=inv).count(), 4)

    def test_cannot_confirm_before_signed(self):
        inv = self.make()
        for target in (S.STATUS_CONFIRMED,):
            with self.assertRaises(InvoiceError):
                change_status(inv.pk, target, actor="x", channel="panel")
        change_status(inv.pk, S.STATUS_SENT, actor="x", channel="panel")
        with self.assertRaises(InvoiceError):
            change_status(inv.pk, S.STATUS_CONFIRMED, actor="x", channel="panel")
        self.assertFalse(Wallet.objects.filter(organization=self.org, balance__gt=0).exists())

    def test_rejected_never_pays(self):
        inv = self.make()
        change_status(inv.pk, S.STATUS_REJECTED, actor="x", channel="panel")
        with self.assertRaises(InvoiceError):
            change_status(inv.pk, S.STATUS_SENT, actor="x", channel="panel")
        self.assertFalse(Wallet.objects.filter(organization=self.org, balance__gt=0).exists())

    def test_validation(self):
        for bad in (dict(inn="123"), dict(inn="12345678a"), dict(amount="500"), dict(amount="abc"), dict(amount="1000.5"), dict(name="")):
            with self.assertRaises(InvoiceError, msg=str(bad)):
                self.make(**bad)

    def test_open_limit(self):
        for _ in range(3):
            self.make()
        with self.assertRaises(InvoiceError):
            self.make()

    def test_requisites_whitelist(self):
        inv = self.make(requisites={"bank_account": "2020", "evil": "x", "mfo": "00014"})
        self.assertEqual(inv.requisites, {"bank_account": "2020", "mfo": "00014"})

    def test_expire_only_unsigned(self):
        a, b = self.make(), self.make()
        change_status(b.pk, S.STATUS_SENT, actor="x", channel="panel")
        c = self.make()
        change_status(c.pk, S.STATUS_SENT, actor="x", channel="panel")
        change_status(c.pk, S.STATUS_SIGNED, actor="x", channel="panel")
        InvoiceTopUp.objects.update(created_at="2000-01-01T00:00:00Z")
        self.assertEqual(expire_stale(7), 2)
        c.refresh_from_db()
        self.assertEqual(c.status, S.STATUS_SIGNED)


class InvoiceApiTests(TestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(username="client", email="c@x.uz", password="pw12345678")
        self.org = Organization.objects.create(name="Org", inn="123456789", owner=self.user)
        self.user.organization = self.org
        self.user.save()
        self.other = CustomUser.objects.create_user(username="other", email="o@x.uz", password="pw12345678")
        self.other_org = Organization.objects.create(name="Other", inn="555555555", owner=self.other)
        self.other.organization = self.other_org
        self.other.save()
        for name in ("notify_new", "refresh"):
            p = mock.patch(f"payments.telegram.{name}"); p.start(); self.addCleanup(p.stop)
        self.api = APIClient()
        self.api.force_authenticate(self.user)

    def test_create_list_cancel(self):
        r = self.api.post("/api/payments/invoice/create/", {"inn": "987654321", "name": "Client LLC", "amount": 50000}, format="json")
        self.assertEqual(r.status_code, 201, r.content)
        self.assertEqual(r.json()["status"], "created")
        self.assertEqual(InvoiceTopUp.objects.get().organization, self.org)
        self.assertEqual(len(self.api.get("/api/payments/invoice/").json()), 1)
        r = self.api.post(f"/api/payments/invoice/{r.json()['id']}/cancel/")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()["status"], "cancelled")

    def test_org_in_request_is_ignored_and_foreign_invoice_hidden(self):
        r = self.api.post("/api/payments/invoice/create/", {"inn": "987654321", "name": "X Y", "amount": 50000, "organization": self.other_org.pk}, format="json")
        self.assertEqual(InvoiceTopUp.objects.get().organization, self.org)
        theirs = InvoiceTopUp.objects.create(organization=self.other_org, amount=1000, inn="111111111", name="T")
        self.assertEqual(self.api.post(f"/api/payments/invoice/{theirs.pk}/cancel/").status_code, 404)
        self.assertEqual(len(self.api.get("/api/payments/invoice/").json()), 1)

    def test_requires_login(self):
        anon = APIClient()
        self.assertEqual(anon.post("/api/payments/invoice/create/", {}, format="json").status_code, 401)

    def test_cannot_cancel_once_sent(self):
        r = self.api.post("/api/payments/invoice/create/", {"inn": "987654321", "name": "Client LLC", "amount": 50000}, format="json")
        change_status(r.json()["id"], S.STATUS_SENT, actor="x", channel="panel")
        self.assertEqual(self.api.post(f"/api/payments/invoice/{r.json()['id']}/cancel/").status_code, 400)


@override_settings(TELEGRAM_BOT_TOKEN="t", TELEGRAM_CHAT_IDS="1", TELEGRAM_OPERATOR_IDS="777", TELEGRAM_CONFIRM_MAX_AMOUNT=0)
class TelegramCallbackTests(TestCase):
    def setUp(self):
        user = CustomUser.objects.create_user(username="client", email="c@x.uz", password="pw12345678")
        self.org = Organization.objects.create(name="Org", inn="123456789", owner=user)
        for name in ("notify_new", "refresh"):
            p = mock.patch(f"payments.telegram.{name}"); p.start(); self.addCleanup(p.stop)
        self.inv = create_invoice(organization=self.org, user=user, amount="100000", inn="987654321", name="Client LLC")
        p = mock.patch("payments.telegram._call"); self.call = p.start(); self.addCleanup(p.stop)
        p = mock.patch("payments.telegram._refresh"); p.start(); self.addCleanup(p.stop)

    def press(self, act, uid=777):
        from . import telegram
        telegram.handle_callback({
            "id": "1", "from": {"id": uid, "username": "op"}, "data": f"inv:{self.inv.pk}:{act}",
            "message": {"chat": {"id": 1}, "message_id": 5},
        })
        self.inv.refresh_from_db()

    def test_stranger_cannot_press(self):
        self.press("sent", uid=999)
        self.assertEqual(self.inv.status, S.STATUS_CREATED)

    def test_operator_flow_and_two_step_confirm(self):
        self.press("sent"); self.press("signed")
        self.assertEqual(self.inv.status, S.STATUS_SIGNED)
        self.press("confirm")  # first press only asks again
        self.assertEqual(self.inv.status, S.STATUS_SIGNED)
        self.assertFalse(Wallet.objects.filter(organization=self.org, balance__gt=0).exists())
        self.press("confirm_yes")
        self.assertEqual(self.inv.status, S.STATUS_CONFIRMED)
        self.assertEqual(Wallet.objects.get(organization=self.org).balance, Decimal("100000"))
        self.press("confirm_yes")  # double press: no second credit
        self.assertEqual(Wallet.objects.get(organization=self.org).balance, Decimal("100000"))
        self.assertTrue(InvoiceEvent.objects.filter(invoice=self.inv, channel="telegram", actor__startswith="tg:777").exists())

    @override_settings(TELEGRAM_CONFIRM_MAX_AMOUNT=50000)
    def test_confirm_limit(self):
        self.press("sent"); self.press("signed"); self.press("confirm_yes")
        self.assertEqual(self.inv.status, S.STATUS_SIGNED)
