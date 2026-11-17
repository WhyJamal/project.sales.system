import hashlib

from rest_framework.throttling import SimpleRateThrottle


class LoginIdentifierThrottle(SimpleRateThrottle):
    """
    Limits password guessing per account (login / e-mail), not per IP: the Next.js server
    makes every login call, so all customers share one IP and an IP limit would lock out everybody.
    """

    scope = "auth_identifier"

    def get_cache_key(self, request, view):
        identifier = str(request.data.get("identifier") or request.data.get("email") or "").strip().lower()
        if not identifier:
            return None
        return self.cache_format % {"scope": self.scope, "ident": hashlib.sha256(identifier.encode()).hexdigest()}
