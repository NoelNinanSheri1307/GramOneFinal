"""Temporary RBAC verification endpoints.

These exist only to prove the authorization dependencies work at the HTTP
layer. Remove before production; real role-scoped product endpoints replace
them in their respective milestones.
"""
from fastapi import APIRouter, Depends

from app.api.deps import require_any_role, require_role
from app.models import User
from app.models.enums import UserRole

router = APIRouter(prefix="/demo/rbac", tags=["demo"])


@router.get("/citizen")
def demo_citizen(user: User = Depends(require_role(UserRole.CITIZEN))) -> dict:
    return {"ok": True, "role": user.role.value}


@router.get("/panchayat")
def demo_panchayat(user: User = Depends(require_role(UserRole.PANCHAYAT))) -> dict:
    return {"ok": True, "role": user.role.value}


@router.get("/csr")
def demo_csr(user: User = Depends(require_role(UserRole.CSR))) -> dict:
    return {"ok": True, "role": user.role.value}


@router.get("/staff")
def demo_staff(
    user: User = Depends(require_any_role(UserRole.CITIZEN, UserRole.PANCHAYAT))
) -> dict:
    return {"ok": True, "role": user.role.value}