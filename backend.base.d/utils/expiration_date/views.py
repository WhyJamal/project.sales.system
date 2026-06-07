from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status

from organizations.models import OrganizationProduct

from decouple import config


class ExpirationDateView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        base_url = request.data.get("base_url")
        
        product_url = config("HOST_URL", default="http://localhost:8000") + "/" + base_url + "/"

        print(product_url)

        if not base_url:
            return Response(
                {"success": False, "detail": "base_url is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            product = OrganizationProduct.objects.get(
                product_url=product_url
            )

            return Response({
                "success": True,
                "expiration_date":product.subscription_end_date.strftime("%Y-%m-%dT%H:%M:%S"),
                "product_url": product.product_url,
            })

        except OrganizationProduct.DoesNotExist:
            return Response(
                {"success": False, "detail": "Product not found"},
                status=status.HTTP_404_NOT_FOUND
            )