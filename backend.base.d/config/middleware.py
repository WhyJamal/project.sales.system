import ipaddress

from django.conf import settings
from django.http import HttpResponseNotFound


class AdminIPAllowlistMiddleware:
    """If ADMIN_ALLOWED_IPS is set, Django's /admin/ answers 404 to everyone else."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        allow = getattr(settings, "ADMIN_ALLOWED_IPS", [])
        if allow and request.path.startswith("/" + settings.ADMIN_URL):
            ip = request.META.get("REMOTE_ADDR", "")
            if not _allowed(ip, allow):
                return HttpResponseNotFound()
        return self.get_response(request)


def _allowed(ip, rules):
    try:
        addr = ipaddress.ip_address(ip)
    except ValueError:
        return False
    for r in rules:
        try:
            if ("/" in r and addr in ipaddress.ip_network(r, strict=False)) or addr == ipaddress.ip_address(r):
                return True
        except ValueError:
            continue
    return False
