from __future__ import annotations

import uvicorn

from app.main import app
from app.config_service import build_runtime_config
from app.config_service import seed_defaults
from app.db import init_db


def main() -> None:
    init_db()
    seed_defaults()
    config = build_runtime_config()
    uvicorn.run(
        app,
        host=str(config["host"]),
        port=int(config["port"]),
        reload=False,
    )


if __name__ == "__main__":
    main()
