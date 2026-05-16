from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import Wallet
from .serializers import WalletSerializer


def get_or_create_wallet(organization):
    wallet, _ = Wallet.objects.get_or_create(organization=organization)
    return wallet


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def wallet_detail(request):
    org = request.user.organization
    if not org:
        return Response(
            {"error": "Sizning organizatsiyangiz topilmadi"},
            status=status.HTTP_404_NOT_FOUND
        )
    wallet = get_or_create_wallet(org)
    serializer = WalletSerializer(wallet)
    return Response(serializer.data)
