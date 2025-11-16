from django.contrib.auth.backends import ModelBackend
from .models import CustomUser

class EmailOrUsernameBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        user = CustomUser.objects.filter(username=username).first() or \
               CustomUser.objects.filter(email=username).first()
        if user and user.check_password(password):
            return user
        return None
