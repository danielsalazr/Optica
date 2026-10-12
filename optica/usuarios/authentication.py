from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import AuthenticationFailed
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken


class SessionJWTAuthentication(JWTAuthentication):
    def get_user(self, validated_token):
        user = super().get_user(validated_token)
        session_jti = validated_token.get('session_jti')
        if not session_jti or BlacklistedToken.objects.filter(token__jti=session_jti).exists():
            raise AuthenticationFailed('La sesion ha expirado.', code='session_revoked')
        return user
