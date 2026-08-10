from __future__ import annotations

from collections.abc import AsyncIterator

from psycopg.rows import dict_row
from psycopg_pool import AsyncConnectionPool

from app.config import get_settings


settings = get_settings()
pool: AsyncConnectionPool | None = None


async def open_pool() -> None:
    global pool
    if not settings.database_url:
        raise RuntimeError("DATABASE_URL is required")
    pool = AsyncConnectionPool(
        conninfo=settings.database_url,
        min_size=settings.pool_min_size,
        max_size=settings.pool_max_size,
        open=False,
        kwargs={"row_factory": dict_row, "autocommit": True},
        check=AsyncConnectionPool.check_connection,
    )
    await pool.open(wait=True, timeout=20)


async def close_pool() -> None:
    global pool
    if pool is not None:
        await pool.close()
        pool = None


async def connection() -> AsyncIterator:
    if pool is None:
        raise RuntimeError("Database pool is not ready")
    async with pool.connection() as conn:
        yield conn


def get_pool() -> AsyncConnectionPool:
    if pool is None:
        raise RuntimeError("Database pool is not ready")
    return pool
