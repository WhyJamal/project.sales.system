from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.core.mail import EmailMessage
from django.conf import settings
from .models import ContactMessage

@api_view(['POST'])
def contact_view(request):
    data = request.data
    contact = ContactMessage.objects.create(
        user=request.user if request.user.is_authenticated else None,
        name=data.get('name', ''),
        email=data.get('email', ''),
        subject=data.get('subject', ''),
        message=data.get('message', ''),
    )

    # send email with Reply-To
    try:
        email = EmailMessage(
            subject=f"New Contact Message: {contact.subject}",
            body=f"From: {contact.name} <{contact.email}>\n\n{contact.message}",
            from_email=settings.DEFAULT_FROM_EMAIL,      
            to=[settings.CONTACT_EMAIL],                 
            headers={'Reply-To': contact.email}         
        )
        email.send(fail_silently=False)
    
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    return Response({"message": "Contact message received"}, status=status.HTTP_201_CREATED)
