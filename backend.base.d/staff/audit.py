from .models import StaffAuditLog
from .security import client_ip


def _jsonable(value):
    if value is None or isinstance(value, (bool, int, float, str)):
        return value
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return str(value)


def diff(old: dict, new: dict) -> dict:
    """{field: {"old": ..., "new": ...}} for fields that really changed."""
    out = {}
    for key, new_value in new.items():
        old_value = old.get(key)
        if _jsonable(old_value) != _jsonable(new_value):
            out[key] = {"old": _jsonable(old_value), "new": _jsonable(new_value)}
    return out


def log(request, action, target_type="", target_id="", summary="", changes=None, actor=None):
    user = actor or (request.user if getattr(request, "user", None) and request.user.is_authenticated else None)
    StaffAuditLog.objects.create(
        actor=user,
        actor_label=(user.username if user else "")[:150],
        action=action,
        target_type=target_type,
        target_id=str(target_id),
        summary=summary[:255],
        changes={k: v for k, v in (changes or {}).items()},
        ip=client_ip(request) or None,
        user_agent=request.META.get("HTTP_USER_AGENT", "")[:255],
    )
