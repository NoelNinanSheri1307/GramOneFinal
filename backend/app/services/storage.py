"""Storage abstraction for file uploads (e.g. photo evidence).

Provides LocalStorageProvider for development/MVP and an interface ready for
cloud storage (S3/GCS) in future without rewriting the evidence domain.
"""
from abc import ABC, abstractmethod
import os
from pathlib import Path
import uuid
from fastapi import UploadFile

from app.core.errors import GramOneError

# Allowed MIME types and max size (10 MB)
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024


class StorageProvider(ABC):
    @abstractmethod
    def save_file(self, file: UploadFile, folder: str = "evidence") -> str:
        """Save file and return relative storage path or URL reference."""
        pass

    @abstractmethod
    def get_file_path(self, relative_path: str) -> Path:
        """Resolve full filesystem path for local file retrieval."""
        pass


class LocalStorageProvider(StorageProvider):
    def __init__(self, base_dir: Path | None = None) -> None:
        if base_dir is None:
            # Default to uploads directory in backend root
            base_dir = Path(__file__).resolve().parent.parent.parent / "uploads"
        self.base_dir = base_dir
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def save_file(self, file: UploadFile, folder: str = "evidence") -> str:
        if file.content_type not in ALLOWED_MIME_TYPES:
            raise GramOneError(
                code="unsupported_file_type",
                message=f"Unsupported file type '{file.content_type}'. Only JPEG, PNG, and WEBP images are allowed.",
                status_code=400,
            )

        target_dir = self.base_dir / folder
        target_dir.mkdir(parents=True, exist_ok=True)

        ext = Path(file.filename or "upload.jpg").suffix.lower()
        if not ext or ext not in [".jpg", ".jpeg", ".png", ".webp"]:
            ext = ".jpg"

        filename = f"{uuid.uuid4().hex}{ext}"
        filepath = target_dir / filename

        size = 0
        with open(filepath, "wb") as out_file:
            while chunk := file.file.read(8192):
                size += len(chunk)
                if size > MAX_FILE_SIZE_BYTES:
                    out_file.close()
                    if filepath.exists():
                        filepath.unlink()
                    raise GramOneError(
                        code="file_too_large",
                        message="Uploaded file exceeds the maximum size limit of 10 MB.",
                        status_code=400,
                    )
                out_file.write(chunk)

        # Return relative reference: folder/filename
        return f"{folder}/{filename}"

    def get_file_path(self, relative_path: str) -> Path:
        # Sanitize against path traversal
        clean_path = os.path.normpath(relative_path).lstrip("/")
        full_path = (self.base_dir / clean_path).resolve()
        if not str(full_path).startswith(str(self.base_dir.resolve())):
            raise GramOneError(
                code="unauthorized_file_access",
                message="Invalid file path.",
                status_code=403,
            )
        if not full_path.exists() or not full_path.is_file():
            raise GramOneError(
                code="file_not_found",
                message="Requested evidence file not found.",
                status_code=404,
            )
        return full_path


class StorageService:
    def __init__(self, provider: StorageProvider | None = None) -> None:
        self.provider = provider or LocalStorageProvider()

    def upload_file(self, file: UploadFile, folder: str = "evidence") -> str:
        return self.provider.save_file(file, folder)

    def get_file_path(self, relative_path: str) -> Path:
        return self.provider.get_file_path(relative_path)
