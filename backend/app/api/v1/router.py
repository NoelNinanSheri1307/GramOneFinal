"""API v1 router. Aggregates all v1 endpoint routers."""
from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth,
    community,
    csr,
    hardware,
    health,
    impact_cases,
    issues,
    notifications,
    projects,
    rbac_demo,
    translations,
    users,
)

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(users.router)

from app.api.v1.endpoints.users import list_panchayat_employees
api_router.add_api_route("/employees", list_panchayat_employees, methods=["GET"], tags=["employees"])

api_router.include_router(issues.router)
api_router.include_router(impact_cases.router)
api_router.include_router(projects.router)
api_router.include_router(csr.router)
api_router.include_router(hardware.router)

from app.api.v1.endpoints.hardware import list_devices
api_router.add_api_route("/telemetry/devices", list_devices, methods=["GET"], tags=["hardware"])

api_router.include_router(community.router)
api_router.include_router(notifications.router)
api_router.include_router(translations.router)
api_router.include_router(rbac_demo.router)