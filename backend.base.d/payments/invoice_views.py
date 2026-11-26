from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .invoices import InvoiceError, change_status, create_invoice
from .models import InvoiceTopUp


def _dict(i: InvoiceTopUp) -> dict:
    return {
        "id": i.id,
        "amount": str(i.amount),
        "inn": i.inn,
        "name": i.name,
        "status": i.status,
        "status_label": i.get_status_display(),
        "created_at": i.created_at.isoformat(),
        "sent_at": i.sent_at.isoformat() if i.sent_at else None,
        "signed_at": i.signed_at.isoformat() if i.signed_at else None,
        "confirmed_at": i.confirmed_at.isoformat() if i.confirmed_at else None,
    }


def _org(request):
    return getattr(request.user, "organization", None)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def invoice_list(request):
    org = _org(request)
    if not org:
        return Response({"error": "Организация не найдена"}, status=404)
    rows = InvoiceTopUp.objects.filter(organization=org)[:20]
    return Response([_dict(i) for i in rows])


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def invoice_create(request):
    # always for the signed-in user's own organization - never for an organization taken from the request
    org = _org(request)
    if not org:
        return Response({"error": "Организация не найдена"}, status=404)
    try:
        invoice = create_invoice(
            organization=org,
            user=request.user,
            amount=request.data.get("amount"),
            inn=request.data.get("inn"),
            name=request.data.get("name"),
            requisites=request.data.get("requisites"),
        )
    except InvoiceError as e:
        return Response({"error": str(e)}, status=400)
    return Response(_dict(invoice), status=201)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def invoice_cancel(request, pk):
    """A customer may withdraw a request only while the operator has not sent the invoice yet."""
    org = _org(request)
    invoice = InvoiceTopUp.objects.filter(pk=pk, organization=org).first() if org else None
    if not invoice:
        return Response({"error": "Не найдено"}, status=404)
    if invoice.status != InvoiceTopUp.STATUS_CREATED:
        return Response({"error": "Заявку уже обрабатывает оператор."}, status=400)
    try:
        invoice = change_status(invoice.pk, InvoiceTopUp.STATUS_CANCELLED, actor=f"user:{request.user.username}", channel="customer")
    except InvoiceError as e:
        return Response({"error": str(e)}, status=400)
    return Response(_dict(invoice))
