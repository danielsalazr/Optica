from __future__ import annotations

import os
import tempfile
from pathlib import Path


APP_NAME = "OpticaPrintAgent"


def _local_runtime_dir() -> Path:
    return Path(__file__).resolve().parents[1] / "runtime"


def _is_writable(directory: Path) -> bool:
    try:
        directory.mkdir(parents=True, exist_ok=True)
        with tempfile.NamedTemporaryFile(dir=directory, delete=True):
            pass
        return True
    except OSError:
        return False


def get_base_dir() -> Path:
    override = os.getenv("OPTICA_PRINT_AGENT_HOME")
    if override:
        return Path(override).expanduser().resolve()

    program_data = os.getenv("PROGRAMDATA")
    if program_data:
        candidate = Path(program_data) / APP_NAME
        if _is_writable(candidate):
            return candidate

    return _local_runtime_dir()


BASE_DIR = get_base_dir()
DATA_DIR = BASE_DIR / "data"
LOGS_DIR = BASE_DIR / "logs"
GENERATED_DIR = BASE_DIR / "generated"
CERTS_DIR = BASE_DIR / "certs"
DB_PATH = DATA_DIR / "agent.db"
TLS_CERT_PATH = CERTS_DIR / "localhost.crt"
TLS_KEY_PATH = CERTS_DIR / "localhost.key"


def ensure_runtime_dirs() -> None:
    for directory in (BASE_DIR, DATA_DIR, LOGS_DIR, GENERATED_DIR, CERTS_DIR):
        directory.mkdir(parents=True, exist_ok=True)
