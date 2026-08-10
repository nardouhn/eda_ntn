from fastapi import APIRouter, Depends
from app.db import get_pool

router = APIRouter(prefix="/eda/brand", tags=["EDA Brand"])

@router.get("/overview")
async def get_brand_overview():
    return {"message": "Brand EDA API"}
