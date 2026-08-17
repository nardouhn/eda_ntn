from __future__ import annotations

import asyncio
import sys
from contextlib import asynccontextmanager

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.db import close_pool, get_pool, open_pool
from app.routes import eda, eda_sku, eda_branch, eda_branch_forecast, eda_branch_sku, eda_external_features, eda_forecast_segments, eda_region, eda_pattern_set, forecast, items, meta


@asynccontextmanager
async def lifespan(_: FastAPI):
    try:
        await open_pool()
        yield
    finally:
        await close_pool()


settings = get_settings()
app = FastAPI(title="SKU Analytics API", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.cors_origins),
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.include_router(meta.router, prefix="/api/v1")
app.include_router(items.router, prefix="/api/v1")
app.include_router(eda.router, prefix="/api/v1")
app.include_router(eda_sku.router, prefix="/api/v1")
app.include_router(eda_branch.router, prefix="/api/v1")
app.include_router(eda_branch_forecast.router, prefix="/api/v1")
app.include_router(eda_branch_sku.router, prefix="/api/v1")
app.include_router(eda_external_features.router, prefix="/api/v1")
app.include_router(eda_forecast_segments.router, prefix="/api/v1")
app.include_router(eda_region.router, prefix="/api/v1")
app.include_router(eda_pattern_set.router, prefix="/api/v1")
app.include_router(forecast.router, prefix="/api/v1")


@app.get("/health/live")
async def live() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/health/ready")
async def ready() -> dict:
    async with get_pool().connection() as conn:
        row = await (await conn.execute("select 1 ok")).fetchone()
    return {"status": "ok", "database": row["ok"] == 1}
