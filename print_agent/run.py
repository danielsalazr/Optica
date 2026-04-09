from __future__ import annotations

import sys

import uvicorn

from app.main import app
from app.config_service import build_runtime_config, seed_defaults
from app.db import init_db
from app.tls_service import ensure_local_tls_assets


def prepare_runtime() -> tuple[str, str]:
    init_db()
    seed_defaults()
    return ensure_local_tls_assets()


def main() -> None:
    if "--prepare-runtime" in sys.argv:
        cert_path, key_path = prepare_runtime()
        print(f"TLS certificate ready: {cert_path}")
        print(f"TLS key ready: {key_path}")
        return

    cert_path, key_path = prepare_runtime()
    config = build_runtime_config()
    use_https = str(config.get("scheme", "https")).lower() == "https"

    uvicorn.run(
        app,
        host=str(config["host"]),
        port=int(config["port"]),
        reload=False,
        ssl_certfile=cert_path if use_https else None,
        ssl_keyfile=key_path if use_https else None,
    )


if __name__ == "__main__":
    main()
