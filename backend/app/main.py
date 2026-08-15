"""GramOne backend application entry point.

Creates and returns the FastAPI application. The app is a modular monolith:
all GramOne business logic lives here and is shared by the web app, the mobile
app and the hardware nodes.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import APP_NAME, APP_VERSION
from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.errors import register_exception_handlers
from app.core.logging import configure_logging

settings = get_settings()
configure_logging(settings)


def create_app() -> FastAPI:
    app = FastAPI(
        title=APP_NAME,
        version=APP_VERSION,
        description="GramOne: rural problem-to-impact platform backend.",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    register_exception_handlers(app)

    app.include_router(api_router, prefix=settings.api_prefix)

    return app


app = create_app()