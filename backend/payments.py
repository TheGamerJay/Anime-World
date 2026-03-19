
Payment and analytics stub endpoints (ready for future Stripe integration).

These endpoints are placeholders that will be fully implemented when Stripe is integrated.
"""

import logging
from fastapi import APIRouter, Depends

from backend.auth import get_current_user
from backend.database import get_db
from backend.exceptions import CreatorRequiredError
from backend.schemas import MessageResponse

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Payments & Analytics"])


# ============ EARNINGS ============

@router.get("/my/earnings", response_model=dict, status_code=200)
async def my_earnings(user=Depends(get_current_user), db=Depends(get_db)):
    """Get creator earnings (stub - ready for Stripe integration)."""
    return {
        "transactions": [],
        "total_earnings": user.get("total_earnings", 0.0),
        "balance": user.get("balance", 0.0),
    }


# ============ CREATOR ANALYTICS ============

@router.get("/analytics/creator", response_model=dict, status_code=200)
async def get_creator_analytics(user=Depends(get_current_user), db=Depends(get_db)):
    """Get creator analytics dashboard (stub - ready for Stripe integration)."""
    if not user.get("is_creator"):
        raise CreatorRequiredError()
    
    return {
        "summary": {
            "total_gross_revenue": 0.0,
            "total_platform_fee": 0.0,
            "total_net_revenue": 0.0,
            "tips_gross": 0.0,
            "channel_subs_gross": 0.0,
            "available_balance": user.get("balance", 0.0),
            "total_supporters": 0,
            "total_transactions": 0,
            "total_views": 0,
            "total_likes": 0,
            "follower_count": user.get("follower_count", 0),
            "series_count": 0,
            "platform_fee_percentage": 20,
        },
        "top_supporters": [],
        "recent_transactions": [],
        "monthly_breakdown": [],
        "series_performance": [],
    }


# ============ FAN ANALYTICS ============

@router.get("/analytics/fan", response_model=dict, status_code=200)
async def get_fan_analytics(user=Depends(get_current_user), db=Depends(get_db)):
    """Get fan spending analytics (stub - ready for Stripe integration)."""
    return {
        "summary": {
            "total_spent": 0.0,
            "tips_total": 0.0,
            "premium_total": 0.0,
            "channel_subs_total": 0.0,
            "creators_supported": 0,
            "total_transactions": 0,
            "following_count": user.get("following_count", 0),
            "is_premium": user.get("is_premium", False),
        },
        "supported_creators": [],
        "recent_transactions": [],
        "monthly_spending": [],
    }


# ============ PAYMENTS (STRIPE STUBS) ============

@router.post("/payments/tip", response_model=dict, status_code=200)
async def create_tip(
    tip_size: str,
    creator_id: str,
    origin_url: str,
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    """Create a tip payment (stub - ready for Stripe integration)."""
    return {
        "message": "Stripe integration coming soon!",
        "url": None,
        "session_id": None,
    }


@router.post("/payments/premium", response_model=dict, status_code=200)
async def create_premium_sub(
    origin_url: str,
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    """Create premium subscription (stub - ready for Stripe integration)."""
    return {
        "message": "Stripe integration coming soon!",
        "url": None,
        "session_id": None,
    }


@router.post("/payments/channel-sub", response_model=dict, status_code=200)
async def create_channel_sub(
    creator_id: str,
    origin_url: str,
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    """Create channel subscription (stub - ready for Stripe integration)."""
    return {
        "message": "Stripe integration coming soon!",
        "url": None,
        "session_id": None,
    }


@router.get("/payments/status/{session_id}", response_model=dict, status_code=200)
async def get_payment_status(session_id: str, db=Depends(get_db)):
    """Get payment status (stub - ready for Stripe integration)."""
    return {
        "session_id": session_id,
        "payment_status": "pending",
        "message": "Stripe integration coming soon!",
    }


@router.post("/webhook/stripe", response_model=dict, status_code=200)
async def stripe_webhook(db=Depends(get_db)):
    """Stripe webhook handler (stub - ready for Stripe integration)."""
    return {"status": "ok", "message": "Webhook handler ready for Stripe integration"}
