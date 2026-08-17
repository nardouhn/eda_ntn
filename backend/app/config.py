from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    database_url: str
    cors_origins: tuple[str, ...]
    pool_min_size: int
    pool_max_size: int
    forecast_import_token: str
    forecast_upload_max_bytes: int


def get_settings() -> Settings:
    database_url = os.getenv("DATABASE_URL", "").strip()
    origins = tuple(
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:3000,http://127.0.0.1:3000",
        ).split(",")
        if origin.strip()
    )
    return Settings(
        database_url=database_url,
        cors_origins=origins,
        pool_min_size=int(os.getenv("DB_POOL_MIN_SIZE", "1")),
        pool_max_size=int(os.getenv("DB_POOL_MAX_SIZE", "5")),
        forecast_import_token=os.getenv("FORECAST_IMPORT_TOKEN", "").strip(),
        forecast_upload_max_bytes=int(os.getenv("FORECAST_UPLOAD_MAX_BYTES", str(25 * 1024 * 1024))),
    )
