from fastapi import APIRouter, Depends
from app.db import get_pool

router = APIRouter(prefix="/eda/branch", tags=["EDA Branch"])

@router.get("/overview")
async def get_branch_overview():
    return {"message": "Branch EDA API"}
