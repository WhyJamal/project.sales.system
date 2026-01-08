from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import ContactMessage

@api_view(['POST'])
def contact_view(request):
    data = request.data
    ContactMessage.objects.create(
        user=request.user if request.user.is_authenticated else None,
        name=data.get('name', ''),
        email=data.get('email', ''),
        subject=data.get('subject', ''),
        message=data.get('message', ''),
    )
    
    # send_mail(subject, message, from_email, [to_email])
    return Response({"message": "Contact message received"}, status=status.HTTP_201_CREATED)
