from fastapi import APIRouter
from .sponsors import router as sponsors_router

router = APIRouter()

router.include_router(sponsors_router, prefix="/sponsors", tags=["Sponsors"])

__all__ = ["router"]