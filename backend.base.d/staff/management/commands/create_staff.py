import getpass

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from staff import totp
from staff.models import StaffProfile

User = get_user_model()


class Command(BaseCommand):
    help = (
        "Admin-panel foydalanuvchisini oldindan yaratadi (yoki mavjudini staff qiladi) va 2FA kalitini chiqaradi.\n"
        "  python manage.py create_staff --email ali@firma.uz --username ali --role manager\n"
        "  python manage.py create_staff --email ali@firma.uz --reset-2fa      (telefon yo'qolsa)\n"
        "  python manage.py create_staff --email ali@firma.uz --disable        (kirishni o'chirish)"
    )

    def add_arguments(self, parser):
        parser.add_argument("--email", required=True)
        parser.add_argument("--username")
        parser.add_argument("--role", choices=["admin", "manager", "viewer"], help="Standart: viewer (yangi), mavjudiniki o'zgarmaydi")
        parser.add_argument("--reset-2fa", action="store_true", help="Yangi 2FA kalit berish")
        parser.add_argument("--disable", action="store_true", help="Panelga kirishni o'chirish")
        parser.add_argument("--allowed-ips", help="Vergul bilan: 1.2.3.4,10.0.0.0/24")

    @transaction.atomic
    def handle(self, *args, **o):
        email = o["email"].strip().lower()
        user = User.objects.filter(email__iexact=email).first()

        if o["disable"]:
            if not user or not hasattr(user, "staff_profile"):
                raise CommandError("Bunday staff topilmadi.")
            user.staff_profile.is_active = False
            user.staff_profile.save(update_fields=["is_active"])
            user.staff_sessions.filter(revoked_at__isnull=True).update(revoked_at=timezone.now())
            self.stdout.write(self.style.SUCCESS(f"{email}: panelga kirish o'chirildi, sessiyalar tugatildi."))
            return

        created = False
        if user is None:
            username = o["username"] or email.split("@")[0]
            if User.objects.filter(username=username).exists():
                raise CommandError(f"'{username}' username band. --username bilan boshqasini bering.")
            password = getpass.getpass("Parol (kamida 12 belgi): ")
            if password != getpass.getpass("Parolni takrorlang: "):
                raise CommandError("Parollar mos kelmadi.")
            if len(password) < 12:
                raise CommandError("Parol kamida 12 belgidan iborat bo'lishi kerak.")
            try:
                validate_password(password)
            except ValidationError as e:
                raise CommandError("; ".join(e.messages))
            # is_staff=False: panel users must NOT be able to open Django's /admin/
            user = User.objects.create_user(username=username, email=email, password=password, is_staff=False, is_superuser=False)
            created = True

        profile, p_created = StaffProfile.objects.get_or_create(user=user, defaults={"role": o["role"] or StaffProfile.ROLE_VIEWER})
        if not p_created:
            if o["role"]:
                profile.role = o["role"]
            profile.is_active = True
        if o.get("allowed_ips"):
            profile.allowed_ips = "\n".join(x.strip() for x in o["allowed_ips"].split(",") if x.strip())

        secret = None
        if p_created or o["reset_2fa"] or not profile.totp_secret_enc:
            secret = totp.generate_secret()
            profile.set_totp_secret(secret)
            user.staff_sessions.filter(revoked_at__isnull=True).update(revoked_at=timezone.now())
        profile.save()

        self.stdout.write(self.style.SUCCESS(f"{'Yaratildi' if created else 'Mavjud foydalanuvchi'}: {user.email} — rol: {profile.role}"))
        if secret:
            issuer = getattr(settings, "STAFF_TOTP_ISSUER", "Admin")
            self.stdout.write("\n2FA kaliti (Google Authenticator / Authy / 1Password ga qo'shing).")
            self.stdout.write("Bu kalit FAQAT BIR MARTA ko'rsatiladi — egasiga xavfsiz kanal orqali bering:\n")
            self.stdout.write(f"  Kalit : {secret}")
            self.stdout.write(f"  URI   : {totp.provisioning_uri(secret, user.email, issuer)}\n")
            try:  # optional: QR in the terminal if the `qrcode` package happens to be installed
                import qrcode

                qr = qrcode.QRCode(border=1)
                qr.add_data(totp.provisioning_uri(secret, user.email, issuer))
                qr.print_ascii(invert=True)
            except Exception:
                pass
