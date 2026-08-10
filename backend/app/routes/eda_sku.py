from fastapi import APIRouter, Depends
from app.db import get_pool

router = APIRouter(prefix="/eda/sku", tags=["EDA SKU"])

@router.get("/overview")
async def get_sku_overview():
    return {"message": "SKU EDA API"}
