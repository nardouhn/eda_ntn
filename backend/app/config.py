from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    database_url: str
    cors_origins: tuple[str, ...]
    pool_min_size: int
    pool_max_size: int


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
    )
