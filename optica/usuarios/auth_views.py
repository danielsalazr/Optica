from django.contrib.auth import get_user_model
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import SimpleRateThrottle
from hashlib import sha256
from collections.abc import Mapping
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from .permissions import effective_permissions


class LoginThrottle(SimpleRateThrottle):
    scope = 'login'

    def get_cache_key(self, request, view):
        # The frontend proxy is shared by all users: do not rate-limit its IP as one account.
        data = request.data if isinstance(request.data, Mapping) else {}
        username = str(data.get('username', '')).strip().casefold()
        return self.cache_format % {'scope': self.scope, 'ident': sha256(username.encode()).hexdigest()}


class LoginSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['session_jti'] = token['jti']
        return token


class LoginView(TokenObtainPairView):
    serializer_class = LoginSerializer
    throttle_classes = [LoginThrottle]


class RefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        if not isinstance(request.data, Mapping) or not isinstance(request.data.get('refresh'), str):
            return Response({'detail': 'Token invalido.'}, status=401)
        try:
            token = RefreshToken(request.data.get('refresh', ''))
            if token.get('session_jti') != token['jti']:
                return Response({'detail': 'La sesion ha expirado.'}, status=401)
            user = get_user_model().objects.get(pk=token['user_id'], is_active=True)
            # Apply the password-revocation check to refresh as well as access tokens.
            from rest_framework_simplejwt.utils import get_md5_hash_password
            if token.get('hash_password') != get_md5_hash_password(user.password):
                return Response({'detail': 'La sesion ha expirado.'}, status=401)
        except (TokenError, KeyError, get_user_model().DoesNotExist):
            return Response({'detail': 'La sesion ha expirado.'}, status=401)
        return super().post(request, *args, **kwargs)


class SessionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            'id': user.pk, 'username': user.get_username(),
            'name': user.get_full_name() or user.get_username(),
            'is_superuser': user.is_superuser, 'is_staff': user.is_staff,
            'groups': list(user.groups.values_list('name', flat=True)),
            'permissions': sorted(effective_permissions(user)),
        })


class LogoutView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        if not isinstance(request.data, Mapping) or not isinstance(request.data.get('refresh'), str):
            return Response(status=204)
        try:
            RefreshToken(request.data.get('refresh', '')).blacklist()
        except TokenError:
            pass
        return Response(status=204)
