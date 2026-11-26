from decimal import Decimal
from unittest import mock

from django.test import override_settings

from organizations.models import Organization
from payments.invoices import create_invoice
from payments.models import InvoiceTopUp
from users.models import CustomUser
from wallet.models import Wallet

from .tests import StaffBase, make_staff

S = InvoiceTopUp
SETTINGS = dict(
    STAFF_PROXY_SECRET="proxy-secret-for-tests-0123456789abcdef",
    STAFF_ENCRYPTION_KEY="1ekSqI-RyD6GcvFj5k4kRNAZeG0b0o3E3rBeYV9u9lE=",
)


@override_settings(**SETTINGS)
class StaffInvoiceTests(StaffBase):
    def setUp(self):
        super().setUp()
        for name in ("notify_new", "refresh"):
            p = mock.patch(f"payments.telegram.{name}"); p.start(); self.addCleanup(p.stop)
        owner = CustomUser.objects.create_user(username="client", email="c@x.uz", password="pw12345678")
        self.org = Organization.objects.create(name="Org", inn="123456789", owner=owner)
        self.inv = create_invoice(organization=self.org, user=owner, amount="100000", inn="987654321", name="Client LLC")
        self.manager, ms = make_staff("mgr@firma.uz", "manager")
        self.admin, as_ = make_staff("adm@firma.uz", "admin")
        self.viewer, vs = make_staff("view@firma.uz", "viewer")
        self.mt, self.at, self.vt = self.login(self.manager, ms), self.login(self.admin, as_), self.login(self.viewer, vs)

    def test_viewer_can_look_but_not_change(self):
        self.assertEqual(self.get("invoices/", self.vt).status_code, 200)
        self.assertEqual(self.post(f"invoices/{self.inv.pk}/mark-sent/", token=self.vt).status_code, 403)

    def test_manager_moves_but_cannot_confirm_money(self):
        self.assertEqual(self.post(f"invoices/{self.inv.pk}/mark-sent/", token=self.mt).status_code, 200)
        self.assertEqual(self.post(f"invoices/{self.inv.pk}/mark-signed/", token=self.mt).status_code, 200)
        r = self.post(f"invoices/{self.inv.pk}/confirm/", {"bank_checked": True}, token=self.mt)
        self.assertEqual(r.status_code, 403)
        self.assertFalse(Wallet.objects.filter(organization=self.org, balance__gt=0).exists())

    def test_admin_confirm_needs_bank_flag_and_signed_status(self):
        self.assertEqual(self.post(f"invoices/{self.inv.pk}/confirm/", {"bank_checked": True}, token=self.at).status_code, 400)  # not signed
        self.post(f"invoices/{self.inv.pk}/mark-sent/", token=self.at)
        self.post(f"invoices/{self.inv.pk}/mark-signed/", token=self.at)
        self.assertEqual(self.post(f"invoices/{self.inv.pk}/confirm/", {}, token=self.at).status_code, 400)  # no flag
        self.assertEqual(self.post(f"invoices/{self.inv.pk}/confirm/", {"bank_checked": "yes"}, token=self.at).status_code, 400)
        r = self.post(f"invoices/{self.inv.pk}/confirm/", {"bank_checked": True, "note": "bank 26.11"}, token=self.at)
        self.assertEqual(r.status_code, 200, r.content)
        self.assertEqual(Wallet.objects.get(organization=self.org).balance, Decimal("100000"))
        self.assertEqual(self.post(f"invoices/{self.inv.pk}/confirm/", {"bank_checked": True}, token=self.at).status_code, 400)  # again
        self.assertEqual(Wallet.objects.get(organization=self.org).balance, Decimal("100000"))
        self.assertEqual(r.json()["events"][-1]["channel"], "panel")

    def test_list_filter_summary(self):
        self.assertEqual(self.get("invoices/?status=open", self.vt).json()["count"], 1)
        self.assertEqual(self.get("invoices/?status=confirmed", self.vt).json()["count"], 0)
        self.assertEqual(self.get("invoices/summary/", self.vt).json()["created"]["count"], 1)
