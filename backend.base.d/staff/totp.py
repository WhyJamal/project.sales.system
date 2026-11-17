"""
TOTP (RFC 6238) + secret encryption, standard library + `cryptography` only.
Compatible with Google Authenticator, Microsoft Authenticator, Authy, 1Password...
"""
import base64
import hashlib
import hmac
import os
import struct
import time
from urllib.parse import quote

from cryptography.fernet import Fernet, InvalidToken
from django.conf import settings

STEP_SECONDS = 30
DIGITS = 6


def generate_secret() -> str:
    return base64.b32encode(os.urandom(20)).decode("ascii").rstrip("=")


def _code_for_step(secret: str, step: int) -> str:
    key = base64.b32decode(secret + "=" * (-len(secret) % 8), casefold=True)
    digest = hmac.new(key, struct.pack(">Q", step), hashlib.sha1).digest()
    offset = digest[-1] & 0x0F
    number = (struct.unpack(">I", digest[offset : offset + 4])[0] & 0x7FFFFFFF) % (10**DIGITS)
    return str(number).zfill(DIGITS)


def verify(secret: str, code: str, last_used_step: int = 0, now: float | None = None):
    """
    Returns the matched time-step, or None. Accepts ±1 step of clock drift and refuses
    any step <= last_used_step, so a code (even one shoulder-surfed) works only once.
    """
    code = (code or "").strip().replace(" ", "")
    if len(code) != DIGITS or not code.isdigit() or not secret:
        return None
    current = int((now if now is not None else time.time()) // STEP_SECONDS)
    matched = None
    for step in (current - 1, current, current + 1):  # no early exit: constant work
        if hmac.compare_digest(_code_for_step(secret, step), code) and step > last_used_step:
            matched = step
    return matched


def provisioning_uri(secret: str, account: str, issuer: str) -> str:
    label = quote(f"{issuer}:{account}")
    return (
        f"otpauth://totp/{label}?secret={secret}&issuer={quote(issuer)}"
        f"&algorithm=SHA1&digits={DIGITS}&period={STEP_SECONDS}"
    )


# --- secret encryption -------------------------------------------------------
def _fernet() -> Fernet:
    key = getattr(settings, "STAFF_ENCRYPTION_KEY", "") or ""
    if key:
        return Fernet(key.encode())
    # Fallback: derived from SECRET_KEY. Set STAFF_ENCRYPTION_KEY in production.
    derived = base64.urlsafe_b64encode(hashlib.sha256(("staff-totp:" + settings.SECRET_KEY).encode()).digest())
    return Fernet(derived)


def encrypt(plain: str) -> str:
    return _fernet().encrypt(plain.encode()).decode()


def decrypt(token: str) -> str:
    try:
        return _fernet().decrypt(token.encode()).decode()
    except InvalidToken:
        return ""
