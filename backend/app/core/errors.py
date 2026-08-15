"""Central error handling for the GramOne API.

All domain errors derive from :class:`GramOneError`, which carries a machine
readable ``code`` that the UI can rely on. Validation failures from FastAPI
are normalized into the same error envelope.
"""
from typing import Any

from fastapi import FastAPI, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


class GramOneError(Exception):
    """Base class for all GramOne application errors."""

    def __init__(
        self,
        code: str,
        message: str,
        status_code: int = 500,
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details or {}


def error_payload(code: str, message: str, details: dict[str, Any] | None = None) -> dict[str, Any]:
    return {"detail": {"code": code, "message": message, "details": details or {}}}


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(GramOneError)
    async def gramone_error_handler(request: Request, exc: GramOneError) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content=error_payload(exc.code, exc.message, exc.details),
        )

    @app.exception_handler(RequestValidationError)
    async def validation_error_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=422,
            content=error_payload(
                code="validation_error",
                message="Request validation failed.",
                details={"errors": jsonable_encoder(exc.errors())},
            ),
        )