from decouple import config
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .models import CustomUser
from .serializers import UserSerializer
from google.oauth2 import id_token
from google.auth.transport import requests

def get_org_products(org):
    if not org:
        return []
    return [
        {
            "id": p.id,
            "title": p.title
        }
        for p in org.products.all()
    ]

class UserViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

class RegisterUserViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        refresh = RefreshToken.for_user(user)
        
        response_data = {
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                "bio": user.bio,
                'phone_number': user.phone_number,
                
                "organization": {
                    "id": user.organization.id if user.organization else None,
                    "name": user.organization.name if user.organization else None,
                    "url": user.organization.url if user.organization else None,
                    "products": get_org_products(user.organization),
                }  
            },
            'access': str(refresh.access_token),
            'refresh': str(refresh)
        }
        
        return Response(response_data, status=status.HTTP_201_CREATED)

class LoginUserView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        identifier = request.data.get("identifier")
        password = request.data.get("password")

        user = None
        
        if '@' in identifier:
            user = CustomUser.objects.filter(email=identifier).first()
        else:
            user = CustomUser.objects.filter(username=identifier).first()

        if user and user.check_password(password):
            refresh = RefreshToken.for_user(user)
            return Response({
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "phone_number": user.phone_number,
                    "bio": user.bio,
                    
                    "organization": {
                        "id": user.organization.id if user.organization else None,
                        "name": user.organization.name if user.organization else None,
                        "url": user.organization.url if user.organization else None,
                        "products": get_org_products(user.organization),
                    }  
                },
                "access": str(refresh.access_token),
                "refresh": str(refresh)
            })
        
        return Response(
            {"error": "Invalid credentials"}, 
            status=status.HTTP_400_BAD_REQUEST
        )

# Google
class GoogleAuthView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get("token")

        if not token:
            return Response(
                {"error": "Token is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            idinfo = id_token.verify_oauth2_token(
                token,
                requests.Request(),
                config("GOOGLE_CLIENT_ID")
            )

            email = idinfo.get("email")
            username = idinfo.get("name") or email.split("@")[0]

            user, created = CustomUser.objects.get_or_create(
                email=email,
                defaults={"username": username}
            )

            refresh = RefreshToken.for_user(user)

            return Response({
                "message": "Успешный вход через Google",
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "phone_number": user.phone_number,
                    "bio": user.bio,
                    
                    "organization": {
                        "id": user.organization.id if user.organization else None,
                        "name": user.organization.name if user.organization else None,
                        "url": user.organization.url if user.organization else None,
                        "products": get_org_products(user.organization),
                    }  
                },
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            })

        except ValueError:
            return Response(
                {"error": "Invalid Google token"},
                status=status.HTTP_400_BAD_REQUEST
            )


# Current user
class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "phone_number": user.phone_number,
            
            "organization": {
                "id": user.organization.id if user.organization else None,
                "name": user.organization.name if user.organization else None,
                "url": user.organization.url if user.organization else None,
                "products": get_org_products(user.organization),
            }  
        })    

    def patch(self, request):
        user = request.user
        data = request.data

        user.username = data.get("username", user.username)
        user.email = data.get("email", user.email)
        user.phone_number = data.get("phone_number", user.phone_number)
        if hasattr(user, "bio"):
            user.bio = data.get("bio", user.bio)

        new_password = data.get("password", None)
        if new_password:
            user.set_password(new_password)

        user.save()

        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "phone_number": user.phone_number,
            "bio": getattr(user, "bio", ""),
            
            "organization": {
                "id": user.organization.id if user.organization else None,
                "name": user.organization.name if user.organization else None,
                "url": user.organization.url if user.organization else None,
                "products": get_org_products(user.organization),
            }  
        }, status=status.HTTP_200_OK)                