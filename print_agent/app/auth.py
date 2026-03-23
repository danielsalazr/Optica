from __future__ import annotations

from fastapi import Header, HTTPException, status

from .config_service import get_value


def require_token(authorization: str | None = Header(default=None)) -> None:
    configured_token = get_value("server.api_token")
    if not configured_token:
        return

    expected = f"Bearer {configured_token}"
    if authorization != expected:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalido o ausente.",
        )
