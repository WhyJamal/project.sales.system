import time
from datetime import timedelta
from decimal import Decimal
from unittest import mock

from django.core.cache import cache
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from organizations.models import Organization, OrganizationProduct
from plans.models import OrganizationSubscription, SubscriptionPlan
from products.models import Product
from users.models import CustomUser
from wallet.models import Wallet

from . import totp
from .models import StaffAuditLog, StaffLoginAttempt, StaffProfile, StaffSession

PROXY = {"HTTP_X_STAFF_PROXY_SECRET": "proxy-secret-for-tests-0123456789abcdef"}


def make_staff(email="ali@firma.uz", role="manager", password="Str0ng-Pass-123!"):
    user = CustomUser.objects.create_user(username=email.split("@")[0], email=email, password=password)
    profile = StaffProfile(user=user, role=role)
    secret = totp.generate_secret()
    profile.set_totp_secret(secret)
    profile.save()
    return user, secret


def code(secret, offset=0):
    return totp._code_for_step(secret, int(time.time() // 30) + offset)


class StaffBase(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()

    def post(self, path, data=None, token=None, proxy=True, **extra):
        headers = dict(PROXY) if proxy else {}
        if token:
            headers["HTTP_AUTHORIZATION"] = f"Bearer {token}"
        headers.update(extra)
        return self.client.post(f"/api/staff/{path}", data or {}, format="json", **headers)

    def get(self, path, token=None, proxy=True):
        headers = dict(PROXY) if proxy else {}
        if token:
            headers["HTTP_AUTHORIZATION"] = f"Bearer {token}"
        return self.client.get(f"/api/staff/{path}", **headers)

    def patch(self, path, data, token):
        return self.client.patch(
            f"/api/staff/{path}", data, format="json", HTTP_AUTHORIZATION=f"Bearer {token}", **PROXY
        )

    def login(self, user, secret, password="Str0ng-Pass-123!", offset=0):
        r = self.post("auth/login/", {"identifier": user.email, "password": password, "otp": code(secret, offset)})
        self.assertEqual(r.status_code, 200, r.content)
        return r.json()["token"]


class LoginSecurityTests(StaffBase):
    def test_requests_without_proxy_secret_are_rejected(self):
        user, secret = make_staff()
        r = self.post("auth/login/", {"identifier": user.email, "password": "x", "otp": "000000"}, proxy=False)
        self.assertEqual(r.status_code, 403)
        self.assertEqual(self.get("dashboard/", proxy=False).status_code, 403)

    def test_wrong_proxy_secret_rejected(self):
        r = self.client.get("/api/staff/dashboard/", HTTP_X_STAFF_PROXY_SECRET="nope")
        self.assertEqual(r.status_code, 403)

    def test_login_success_and_me(self):
        user, secret = make_staff()
        token = self.login(user, secret)
        me = self.get("auth/me/", token).json()
        self.assertEqual(me["user"]["role"], "manager")
        # the token itself is never stored
        self.assertFalse(StaffSession.objects.filter(token_hash=token).exists())

    def test_failures_are_indistinguishable(self):
        user, secret = make_staff()
        bad_pw = self.post("auth/login/", {"identifier": user.email, "password": "wrong", "otp": code(secret)})
        bad_otp = self.post("auth/login/", {"identifier": user.email, "password": "Str0ng-Pass-123!", "otp": "123456"})
        unknown = self.post("auth/login/", {"identifier": "nobody@x.uz", "password": "x", "otp": "123456"})
        self.assertEqual({bad_pw.status_code, bad_otp.status_code, unknown.status_code}, {400})
        self.assertEqual(bad_pw.json(), bad_otp.json())
        self.assertEqual(bad_pw.json(), unknown.json())

    def test_non_staff_customer_cannot_login(self):
        CustomUser.objects.create_user(username="cust", email="cust@x.uz", password="Str0ng-Pass-123!")
        r = self.post("auth/login/", {"identifier": "cust@x.uz", "password": "Str0ng-Pass-123!", "otp": "123456"})
        self.assertEqual(r.status_code, 400)

    def test_lockout_after_repeated_failures_even_for_unknown_account(self):
        for _ in range(5):
            self.assertEqual(self.post("auth/login/", {"identifier": "ghost@x.uz", "password": "x", "otp": "111111"}).status_code, 400)
        r = self.post("auth/login/", {"identifier": "ghost@x.uz", "password": "x", "otp": "111111"})
        self.assertEqual(r.status_code, 429)

    def test_lockout_blocks_correct_credentials_too(self):
        user, secret = make_staff()
        for _ in range(5):
            self.post("auth/login/", {"identifier": user.email, "password": "bad", "otp": "000000"})
        r = self.post("auth/login/", {"identifier": user.email, "password": "Str0ng-Pass-123!", "otp": code(secret)})
        self.assertEqual(r.status_code, 429)

    def test_otp_cannot_be_replayed(self):
        user, secret = make_staff()
        otp = code(secret)
        ok = self.post("auth/login/", {"identifier": user.email, "password": "Str0ng-Pass-123!", "otp": otp})
        again = self.post("auth/login/", {"identifier": user.email, "password": "Str0ng-Pass-123!", "otp": otp})
        self.assertEqual(ok.status_code, 200)
        self.assertEqual(again.status_code, 400)

    def test_totp_known_vector(self):
        # RFC 6238 test secret "12345678901234567890", T=59s -> 94287082 (8 digits) => last 6 = 287082
        import base64

        secret = base64.b32encode(b"12345678901234567890").decode()
        self.assertEqual(totp._code_for_step(secret, 59 // 30), "287082")

    def test_disabled_profile_cannot_login_or_use_session(self):
        user, secret = make_staff()
        token = self.login(user, secret)
        StaffProfile.objects.filter(user=user).update(is_active=False)
        self.assertEqual(self.get("dashboard/", token).status_code, 401)

    def test_logout_revokes_session(self):
        user, secret = make_staff()
        token = self.login(user, secret)
        self.assertEqual(self.post("auth/logout/", token=token).status_code, 200)
        self.assertEqual(self.get("auth/me/", token).status_code, 401)

    def test_idle_and_absolute_expiry(self):
        user, secret = make_staff()
        token = self.login(user, secret)
        s = StaffSession.objects.get()
        StaffSession.objects.filter(pk=s.pk).update(last_seen_at=timezone.now() - timedelta(minutes=31))
        self.assertEqual(self.get("auth/me/", token).status_code, 401)
        StaffSession.objects.filter(pk=s.pk).update(last_seen_at=timezone.now(), expires_at=timezone.now() - timedelta(seconds=1))
        self.assertEqual(self.get("auth/me/", token).status_code, 401)

    def test_customer_jwt_is_not_accepted(self):
        from rest_framework_simplejwt.tokens import RefreshToken

        user, _ = make_staff()
        jwt = str(RefreshToken.for_user(user).access_token)
        self.assertEqual(self.get("dashboard/", jwt).status_code, 401)

    def test_garbage_tokens(self):
        for t in ("", "abc", "Bearer", "x" * 500):
            self.assertIn(self.get("dashboard/", t or None).status_code, (401, 403))

    @override_settings(STAFF_IP_ALLOWLIST=["10.0.0.0/24"])
    def test_global_ip_allowlist(self):
        user, secret = make_staff()
        r = self.post("auth/login/", {"identifier": user.email, "password": "Str0ng-Pass-123!", "otp": code(secret)}, HTTP_X_STAFF_CLIENT_IP="8.8.8.8")
        self.assertEqual(r.status_code, 403)
        r = self.post("auth/login/", {"identifier": user.email, "password": "Str0ng-Pass-123!", "otp": code(secret)}, HTTP_X_STAFF_CLIENT_IP="10.0.0.5")
        self.assertEqual(r.status_code, 200)

    def test_per_user_ip_allowlist(self):
        user, secret = make_staff()
        StaffProfile.objects.filter(user=user).update(allowed_ips="1.2.3.4")
        r = self.post("auth/login/", {"identifier": user.email, "password": "Str0ng-Pass-123!", "otp": code(secret)}, HTTP_X_STAFF_CLIENT_IP="9.9.9.9")
        self.assertEqual(r.status_code, 400)

    def test_change_password_revokes_other_sessions(self):
        user, secret = make_staff()
        t1 = self.login(user, secret, offset=-1)
        t2 = self.login(user, secret, offset=0)
        r = self.post("auth/change-password/", {"current_password": "Str0ng-Pass-123!", "new_password": "An0ther-Long-Pass-77!"}, token=t2)
        self.assertEqual(r.status_code, 200, r.content)
        self.assertEqual(self.get("auth/me/", t1).status_code, 401)
        self.assertEqual(self.get("auth/me/", t2).status_code, 200)
        weak = self.post("auth/change-password/", {"current_password": "An0ther-Long-Pass-77!", "new_password": "12345678"}, token=t2)
        self.assertEqual(weak.status_code, 400)

    def test_secret_is_encrypted_at_rest(self):
        user, secret = make_staff()
        raw = StaffProfile.objects.get(user=user).totp_secret_enc
        self.assertNotIn(secret, raw)


class Fixtures(StaffBase):
    def setUp(self):
        super().setUp()
        self.manager, self.m_secret = make_staff("mgr@firma.uz", "manager")
        self.viewer, self.v_secret = make_staff("view@firma.uz", "viewer")
        self.mtoken = self.login(self.manager, self.m_secret)
        self.vtoken = self.login(self.viewer, self.v_secret)

        self.product = Product.objects.create(name="trade", title="Trade", included_users=1, extra_user_price=Decimal("50000"))
        self.plan = SubscriptionPlan.objects.create(product=self.product, code="starter", name="Starter", price=Decimal("100000"), duration_days=30)
        self.owner = CustomUser.objects.create_user(username="own", email="own@x.uz", password="Str0ng-Pass-123!")
        self.org = Organization.objects.create(name="Acme", inn="123456789", owner=self.owner)
        Wallet.objects.get_or_create(organization=self.org)

    def make_base(self, org=None, days=10, url="http://host.local/acme-1/", title="Acme base"):
        org = org or self.org
        end = timezone.now() + timedelta(days=days)
        sub = OrganizationSubscription.objects.create(organization=org, plan=self.plan, end_date=end)
        return OrganizationProduct.objects.create(
            organization=org, product=self.product, title=title, product_url=url,
            product_price=self.plan.price, subscription=sub, subscription_end_date=end,
        )


class BaseManagementTests(Fixtures):
    def test_viewer_can_read_but_not_write(self):
        base = self.make_base()
        self.assertEqual(self.get("bases/", self.vtoken).status_code, 200)
        r = self.patch(f"bases/{base.id}/", {"title": "x"}, self.vtoken)
        self.assertEqual(r.status_code, 403)
        r = self.post("bases/", {}, token=self.vtoken)
        self.assertEqual(r.status_code, 403)

    def test_no_delete_endpoint(self):
        base = self.make_base()
        r = self.client.delete(f"/api/staff/bases/{base.id}/", HTTP_AUTHORIZATION=f"Bearer {self.mtoken}", **PROXY)
        self.assertEqual(r.status_code, 405)
        r = self.client.delete(f"/api/staff/organizations/{self.org.id}/", HTTP_AUTHORIZATION=f"Bearer {self.mtoken}", **PROXY)
        self.assertEqual(r.status_code, 405)

    def test_change_end_date_syncs_subscription_and_is_audited(self):
        base = self.make_base()
        new_end = (timezone.now() + timedelta(days=200)).replace(microsecond=0)
        r = self.patch(f"bases/{base.id}/", {"subscription_end_date": new_end.isoformat()}, self.mtoken)
        self.assertEqual(r.status_code, 200, r.content)
        base.refresh_from_db()
        base.subscription.refresh_from_db()
        self.assertEqual(base.subscription_end_date, new_end)
        self.assertEqual(base.subscription.end_date, new_end)   # what 1C reads
        log = StaffAuditLog.objects.get(action="base_updated")
        self.assertEqual(log.actor, self.manager)
        self.assertIn("subscription_end_date", log.changes)

    def test_edit_never_charges_wallet_or_provisions_even_without_url(self):
        base = self.make_base()
        OrganizationProduct.objects.filter(pk=base.pk).update(product_url=None)  # legacy row without a URL
        wallet = Wallet.objects.get(organization=self.org)
        before = wallet.balance
        with mock.patch("organizations.models.initialize_1c_database") as prov:
            r = self.patch(f"bases/{base.id}/", {"title": "Renamed"}, self.mtoken)
        self.assertEqual(r.status_code, 200)
        prov.assert_not_called()
        wallet.refresh_from_db()
        self.assertEqual(wallet.balance, before)

    def test_expire_a_base_by_past_date(self):
        base = self.make_base()
        past = (timezone.now() - timedelta(days=1)).isoformat()
        r = self.patch(f"bases/{base.id}/", {"subscription_end_date": past}, self.mtoken)
        self.assertEqual(r.json()["status"], "expired")

    def test_extend_from_end_date_or_from_today_when_expired(self):
        base = self.make_base(days=10)
        r = self.post(f"bases/{base.id}/extend/", {"days": 5}, token=self.mtoken).json()
        self.assertEqual(r["days_left"], 15)
        base2 = self.make_base(days=-20, title="old")
        r = self.post(f"bases/{base2.id}/extend/", {"months": 1}, token=self.mtoken).json()
        self.assertIn(r["days_left"], (29, 30))
        bad = self.post(f"bases/{base.id}/extend/", {"days": 5, "months": 1}, token=self.mtoken)
        self.assertEqual(bad.status_code, 400)

    def test_foreign_product_url_rejected(self):
        base = self.make_base()
        r = self.patch(f"bases/{base.id}/", {"product_url": "https://evil.example/hs"}, self.mtoken)
        self.assertEqual(r.status_code, 400)
        ok = self.patch(f"bases/{base.id}/", {"product_url": "http://host.local/other/"}, self.mtoken)
        self.assertEqual(ok.status_code, 200)
        # look-alike host must not pass
        r = self.patch(f"bases/{base.id}/", {"product_url": "http://host.local.evil.com/x/"}, self.mtoken)
        self.assertEqual(r.status_code, 400)

    def test_create_base_free_with_provisioning(self):
        with mock.patch("staff.services.initialize_1c_database", return_value="http://host.local/acme-new/") as prov:
            r = self.post("bases/", {"organization": self.org.id, "product": self.product.id, "plan": self.plan.id, "months": 3, "charge_wallet": False}, token=self.mtoken)
        self.assertEqual(r.status_code, 201, r.content)
        prov.assert_called_once()
        body = r.json()
        self.assertEqual(body["product_url"], "http://host.local/acme-new/")
        self.assertIn(body["days_left"], (89, 90))
        self.assertEqual(Wallet.objects.get(organization=self.org).balance, Decimal("0"))
        self.assertEqual(OrganizationProduct.objects.filter(organization=self.org).count(), 1)

    def test_create_base_with_explicit_end_date(self):
        end = (timezone.now() + timedelta(days=400)).isoformat()
        with mock.patch("staff.services.initialize_1c_database", return_value="http://host.local/b/"):
            r = self.post("bases/", {"organization": self.org.id, "product": self.product.id, "plan": self.plan.id, "end_date": end}, token=self.mtoken)
        self.assertEqual(r.status_code, 201)
        self.assertIn(r.json()["days_left"], (399, 400))

    def test_create_base_charging_wallet(self):
        wallet = Wallet.objects.get(organization=self.org)
        wallet.deposit(Decimal("1000000"))
        with mock.patch("staff.services.initialize_1c_database", return_value="http://host.local/c/"):
            r = self.post("bases/", {"organization": self.org.id, "product": self.product.id, "plan": self.plan.id, "months": 3, "user_count": 3, "charge_wallet": True}, token=self.mtoken)
        self.assertEqual(r.status_code, 201, r.content)
        wallet.refresh_from_db()
        # (100000 + 2 extra users * 50000) * 3 months = 600000
        self.assertEqual(wallet.balance, Decimal("400000"))

    def test_create_base_insufficient_wallet_creates_nothing(self):
        with mock.patch("staff.services.initialize_1c_database", return_value="http://host.local/c/") as prov:
            r = self.post("bases/", {"organization": self.org.id, "product": self.product.id, "plan": self.plan.id, "charge_wallet": True}, token=self.mtoken)
        self.assertEqual(r.status_code, 400)
        prov.assert_not_called()
        self.assertEqual(OrganizationProduct.objects.count(), 0)

    def test_provisioning_failure_rolls_back(self):
        wallet = Wallet.objects.get(organization=self.org)
        wallet.deposit(Decimal("500000"))
        with mock.patch("staff.services.initialize_1c_database", side_effect=RuntimeError("iis down")):
            r = self.post("bases/", {"organization": self.org.id, "product": self.product.id, "plan": self.plan.id, "charge_wallet": True}, token=self.mtoken)
        self.assertEqual(r.status_code, 400)
        wallet.refresh_from_db()
        self.assertEqual(wallet.balance, Decimal("500000"))
        self.assertEqual(OrganizationSubscription.objects.count(), 0)

    def test_plan_must_match_product(self):
        other = Product.objects.create(name="hr", title="HR")
        r = self.post("bases/", {"organization": self.org.id, "product": other.id, "plan": self.plan.id}, token=self.mtoken)
        self.assertEqual(r.status_code, 400)

    def test_list_filters_and_ordering(self):
        self.make_base(days=3, title="soon")
        self.make_base(days=100, title="later")
        self.make_base(days=-5, title="gone")
        titles = lambda q: [b["title"] for b in self.get(f"bases/?{q}", self.vtoken).json()["results"]]
        self.assertEqual(titles("status=expiring"), ["soon"])
        self.assertEqual(titles("status=expired"), ["gone"])
        self.assertEqual(titles("status=active"), ["soon", "later"])
        self.assertEqual(titles("ordering=-end_date"), ["later", "soon", "gone"])
        self.assertEqual(titles("search=lat"), ["later"])
        self.assertEqual(self.get("bases/?status=hack", self.vtoken).status_code, 400)
        self.assertEqual(self.get("bases/?organization=abc", self.vtoken).status_code, 400)

    def test_sql_injection_like_search_is_harmless(self):
        self.make_base()
        r = self.get("bases/?search=%27%20OR%201%3D1%3B--", self.vtoken)
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()["count"], 0)


class OrganizationTests(Fixtures):
    def test_create_update_and_validation(self):
        r = self.post("organizations/", {"name": "Beta LLC", "inn": "987654321", "address": "Tashkent"}, token=self.mtoken)
        self.assertEqual(r.status_code, 201, r.content)
        org_id = r.json()["id"]
        self.assertTrue(Wallet.objects.filter(organization_id=org_id).exists())

        dup = self.post("organizations/", {"name": "Dup", "inn": "987654321"}, token=self.mtoken)
        self.assertEqual(dup.status_code, 400)
        bad = self.post("organizations/", {"name": "X1", "inn": "12ab"}, token=self.mtoken)
        self.assertEqual(bad.status_code, 400)

        u = self.patch(f"organizations/{org_id}/", {"name": "Beta Group", "address": "Samarkand"}, self.mtoken)
        self.assertEqual(u.status_code, 200)
        self.assertEqual(u.json()["name"], "Beta Group")
        self.assertTrue(StaffAuditLog.objects.filter(action="organization_updated", target_id=str(org_id)).exists())

    def test_owner_linking_and_double_membership_guard(self):
        newbie = CustomUser.objects.create_user(username="nb", email="nb@x.uz", password="Str0ng-Pass-123!")
        r = self.post("organizations/", {"name": "Gamma", "inn": "111222333", "owner": newbie.id}, token=self.mtoken)
        self.assertEqual(r.status_code, 201, r.content)
        newbie.refresh_from_db()
        self.assertEqual(newbie.organization_id, r.json()["id"])
        # `self.owner` already belongs to Acme
        r2 = self.post("organizations/", {"name": "Delta", "inn": "444555666", "owner": self.owner.id}, token=self.mtoken)
        self.assertEqual(r2.status_code, 400)

    def test_detail_contains_bases(self):
        self.make_base()
        d = self.get(f"organizations/{self.org.id}/", self.vtoken).json()
        self.assertEqual(len(d["bases"]), 1)
        self.assertEqual(d["bases_total"], 1)


class ReportTests(Fixtures):
    def test_bases_report_json_and_csv(self):
        self.make_base(days=3, title="=HYPERLINK(\"http://evil\")")
        self.make_base(days=-2, title="old")
        j = self.get("reports/bases/?status=all", self.vtoken).json()
        self.assertEqual(j["summary"]["total"], 2)
        self.assertEqual(j["summary"]["by_status"]["expired"], 1)
        r = self.get("reports/bases/?export=csv", self.vtoken)
        self.assertEqual(r.status_code, 200)
        self.assertTrue(r["Content-Type"].startswith("text/csv"))
        body = r.content.decode("utf-8-sig")
        self.assertIn("'=HYPERLINK", body)           # formula neutralised
        self.assertNotIn(";=HYPERLINK", body)
        self.assertTrue(StaffAuditLog.objects.filter(action="report_export").exists())

    def test_finance_and_transactions(self):
        wallet = Wallet.objects.get(organization=self.org)
        wallet.deposit(Decimal("1000"), "topup")
        wallet.withdraw(Decimal("300"), "base")
        fin = self.get("reports/finance/?group=day", self.vtoken).json()
        self.assertEqual(fin["summary"], {"deposits": "1000.00", "withdrawals": "300.00", "net": "700.00"})
        tx = self.get("reports/transactions/?type=deposit", self.vtoken).json()
        self.assertEqual(tx["summary"]["count"], 1)
        self.assertEqual(self.get("reports/transactions/?date_from=garbage", self.vtoken).status_code, 400)
        self.assertEqual(self.get("reports/unknown/", self.vtoken).status_code, 404)

    def test_organizations_report(self):
        self.make_base()
        j = self.get("reports/organizations/", self.vtoken).json()
        self.assertEqual(j["rows"][0]["bases_active"], 1)

    def test_dashboard(self):
        self.make_base(days=3)
        self.make_base(days=-1, title="gone")
        d = self.get("dashboard/", self.vtoken).json()
        self.assertEqual(d["bases"]["expiring"], 1)
        self.assertEqual(d["bases"]["expired"], 1)
        # chart data
        self.assertEqual(len(d["expiry_weeks"]), 8)
        self.assertEqual(d["expiry_weeks"][0]["count"], 1)      # the base ending in 3 days
        self.assertEqual(sum(w["count"] for w in d["expiry_weeks"]), 1)
        self.assertEqual(len(d["finance_months"]), 6)
        self.assertEqual(d["finance_months"][-1]["deposits"], "0.00")

    def test_dashboard_finance_months_counts_this_month(self):
        wallet = Wallet.objects.get(organization=self.org)
        wallet.deposit(Decimal("2500"), "topup")
        wallet.withdraw(Decimal("500"), "base")
        d = self.get("dashboard/", self.vtoken).json()
        current = d["finance_months"][-1]
        self.assertEqual((current["deposits"], current["withdrawals"]), ("2500.00", "500.00"))


class CustomerSideHardeningTests(StaffBase):
    """Regression tests for holes in the existing public API that would undermine the panel."""

    def setUp(self):
        super().setUp()
        self.c = APIClient()
        self.alice = CustomUser.objects.create_user(username="alice", email="alice@x.uz", password="Str0ng-Pass-123!")
        self.bob = CustomUser.objects.create_user(username="bob", email="bob@x.uz", password="Str0ng-Pass-123!")
        self.org_a = Organization.objects.create(name="A", inn="100000001", owner=self.alice)
        self.org_b = Organization.objects.create(name="B", inn="100000002", owner=self.bob)
        self.product = Product.objects.create(name="trade", title="Trade")
        self.plan = SubscriptionPlan.objects.create(product=self.product, code="starter", name="S", price=Decimal("1000"), duration_days=30)

    def auth(self, user):
        from rest_framework_simplejwt.tokens import RefreshToken

        self.c.credentials(HTTP_AUTHORIZATION=f"Bearer {RefreshToken.for_user(user).access_token}")

    def test_anonymous_cannot_list_or_modify_users_via_register_endpoint(self):
        self.assertEqual(self.c.get("/api/users/auth/register/").status_code, 405)
        self.assertEqual(self.c.get(f"/api/users/auth/register/{self.alice.id}/").status_code, 404)
        r = self.c.patch(f"/api/users/auth/register/{self.alice.id}/", {"password": "hacked"}, format="json")
        self.assertIn(r.status_code, (404, 405))
        self.alice.refresh_from_db()
        self.assertTrue(self.alice.check_password("Str0ng-Pass-123!"))

    def test_registration_still_works(self):
        r = self.c.post("/api/users/auth/register/", {"username": "new", "email": "new@x.uz", "password": "Str0ng-Pass-123!"}, format="json")
        self.assertEqual(r.status_code, 201, r.content)

    def test_customer_cannot_touch_other_users(self):
        self.auth(self.alice)
        r = self.c.get("/api/users/users/")
        self.assertEqual(r.status_code, 200)
        data = r.json()
        rows = data["results"] if isinstance(data, dict) else data
        self.assertEqual([u["id"] for u in rows], [self.alice.id])
        self.assertEqual(self.c.patch(f"/api/users/users/{self.bob.id}/", {"email": "x@x.uz"}, format="json").status_code, 405)
        self.assertEqual(self.c.delete(f"/api/users/users/{self.bob.id}/").status_code, 405)

    def test_customer_cannot_read_or_edit_other_organization(self):
        self.auth(self.alice)
        self.assertEqual(self.c.get(f"/api/organizations/{self.org_b.id}/").status_code, 404)
        self.assertEqual(self.c.patch(f"/api/organizations/{self.org_b.id}/", {"name": "pwn"}, format="json").status_code, 404)
        self.assertEqual(self.c.delete(f"/api/organizations/{self.org_a.id}/").status_code, 405)

    def test_customer_cannot_forge_billing_fields_or_target_other_org(self):
        self.auth(self.alice)
        stolen = "https://evil.example/"
        far = (timezone.now() + timedelta(days=9999)).isoformat()
        # other org -> forbidden
        r = self.c.post("/api/organizations/product/add/", {"organization": self.org_b.id, "product": self.product.id, "plan": self.plan.id, "title": "x", "months": 1}, format="json")
        self.assertEqual(r.status_code, 403)
        # own org, but with forged url / price / end date: wallet is empty so it must fail on payment
        r = self.c.post("/api/organizations/product/add/", {"organization": self.org_a.id, "product": self.product.id, "plan": self.plan.id, "title": "x", "product_url": stolen, "product_price": "0", "subscription_end_date": far}, format="json")
        self.assertNotEqual(r.status_code, 201, r.content)
        self.assertFalse(OrganizationProduct.objects.exists())

    def test_customer_edit_whitelist(self):
        end = timezone.now() + timedelta(days=5)
        sub = OrganizationSubscription.objects.create(organization=self.org_a, plan=self.plan, end_date=end)
        base = OrganizationProduct.objects.create(organization=self.org_a, product=self.product, title="t", product_url="http://host.local/a/", product_price=Decimal("1000"), subscription=sub, subscription_end_date=end)
        self.auth(self.alice)
        far = (timezone.now() + timedelta(days=9999)).isoformat()
        r = self.c.put(f"/api/organizations/product/add/{base.id}/", {"title": "renamed", "subscription_end_date": far, "product_url": "http://evil/", "organization": self.org_b.id, "product_price": "0"}, format="json")
        self.assertEqual(r.status_code, 200, r.content)
        base.refresh_from_db()
        self.assertEqual(base.title, "renamed")
        self.assertEqual(base.subscription_end_date, end)
        self.assertEqual(base.product_url, "http://host.local/a/")
        self.assertEqual(base.organization_id, self.org_a.id)
        self.assertEqual(base.product_price, Decimal("1000"))

    def test_reorder_only_own_bases(self):
        end = timezone.now() + timedelta(days=5)
        sub = OrganizationSubscription.objects.create(organization=self.org_b, plan=self.plan, end_date=end)
        theirs = OrganizationProduct.objects.create(organization=self.org_b, product=self.product, title="t", product_url="http://host.local/b/", subscription=sub, subscription_end_date=end, order=1)
        self.auth(self.alice)
        self.c.post("/api/organizations/product/add/reorder/", {"items": [{"id": theirs.id, "order": 99}]}, format="json")
        theirs.refresh_from_db()
        self.assertEqual(theirs.order, 1)

    def test_companies_are_read_only_publicly(self):
        self.assertEqual(self.c.post("/api/organizations/companies/", {"name": "x"}, format="json").status_code, 405)
        self.assertEqual(self.c.delete("/api/organizations/companies/1/").status_code, 405)

    def test_login_is_throttled_per_account(self):
        codes = [self.c.post("/api/users/auth/login/", {"identifier": "alice@x.uz", "password": "wrong"}, format="json").status_code for _ in range(12)]
        self.assertIn(429, codes)
        # another account is unaffected
        self.assertEqual(self.c.post("/api/users/auth/login/", {"identifier": "bob@x.uz", "password": "Str0ng-Pass-123!"}, format="json").status_code, 200)

    def test_login_with_garbage_does_not_crash(self):
        self.assertEqual(self.c.post("/api/users/auth/login/", {}, format="json").status_code, 400)
        self.assertEqual(self.c.post("/api/users/auth/login/", {"identifier": ["a"], "password": 1}, format="json").status_code, 400)


class CreateStaffCommandTests(StaffBase):
    def run_cmd(self, *args, passwords=("Very-Long-Pass-2026!", "Very-Long-Pass-2026!")):
        from io import StringIO

        from django.core.management import call_command

        out = StringIO()
        with mock.patch("getpass.getpass", side_effect=list(passwords)):
            call_command("create_staff", *args, stdout=out)
        return out.getvalue()

    def test_creates_non_django_staff_user_with_2fa_and_can_login(self):
        out = self.run_cmd("--email", "New@Firma.uz", "--username", "newbie", "--role", "viewer")
        self.assertIn("Kalit", out)
        user = CustomUser.objects.get(email="new@firma.uz")
        self.assertFalse(user.is_staff)       # cannot open Django /admin/
        self.assertFalse(user.is_superuser)
        secret = user.staff_profile.get_totp_secret()
        self.assertTrue(secret)
        token = self.login(user, secret, password="Very-Long-Pass-2026!")
        self.assertTrue(token)

    def test_short_password_rejected(self):
        from django.core.management.base import CommandError

        with self.assertRaises(CommandError):
            self.run_cmd("--email", "a@b.uz", passwords=("short", "short"))

    def test_reset_2fa_and_disable(self):
        self.run_cmd("--email", "x@firma.uz", "--username", "x", "--role", "manager")
        user = CustomUser.objects.get(email="x@firma.uz")
        old = user.staff_profile.totp_secret_enc
        self.run_cmd("--email", "x@firma.uz", "--reset-2fa")
        user.staff_profile.refresh_from_db()
        self.assertNotEqual(old, user.staff_profile.totp_secret_enc)
        self.assertEqual(user.staff_profile.role, "manager")   # untouched by --reset-2fa
        self.run_cmd("--email", "x@firma.uz", "--disable")
        user.staff_profile.refresh_from_db()
        self.assertFalse(user.staff_profile.is_active)
