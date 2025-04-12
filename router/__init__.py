from utils.api import Router
from .sponsors import router as sponsors_router

router = Router()

router.include_router(sponsors_router, prefix="/sponsors", tags=["Sponsors"])

__all__ = ["router"]