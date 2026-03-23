from __future__ import annotations

import os
from pathlib import Path


APP_NAME = "OpticaPrintAgent"


def get_base_dir() -> Path:
    override = os.getenv("OPTICA_PRINT_AGENT_HOME")
    if override:
        return Path(override).expanduser().resolve()

    program_data = os.getenv("PROGRAMDATA")
    if program_data:
        return Path(program_data) / APP_NAME

    return Path(__file__).resolve().parents[1] / "runtime"


BASE_DIR = get_base_dir()
DATA_DIR = BASE_DIR / "data"
LOGS_DIR = BASE_DIR / "logs"
GENERATED_DIR = BASE_DIR / "generated"
DB_PATH = DATA_DIR / "agent.db"


def ensure_runtime_dirs() -> None:
    for directory in (BASE_DIR, DATA_DIR, LOGS_DIR, GENERATED_DIR):
        directory.mkdir(parents=True, exist_ok=True)
