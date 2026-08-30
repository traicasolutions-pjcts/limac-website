from functools import lru_cache
from typing import Literal

from pydantic import AnyHttpUrl, Field, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=("../.env.local", "../.env", ".env.local", ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "Limac Warranty API"
    environment: Literal["development", "staging", "production", "test"] = "development"
    api_v1_prefix: str = "/api/v1"
    mongodb_uri: str = Field(default="mongodb://localhost:27017")
    mongodb_database: str = "limac"
    mongodb_server_selection_timeout_ms: int = 5000
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://www.limac.in",
        "https://limac.in",
    ]

    jwt_secret_key: str = Field(default="change-me-in-production")
    jwt_algorithm: str = "HS256"
    access_token_minutes: int = 15
    refresh_token_days: int = 14

    turnstile_secret_key: str | None = None
    turnstile_required: bool = True

    max_upload_bytes: int = 2 * 1024 * 1024
    submission_ip_hour_limit: int = 5
    submission_ip_day_limit: int = 15
    submission_mobile_day_limit: int = 3

    bill_storage_provider: Literal["cloudinary", "r2"] = "cloudinary"

    cloudinary_cloud_name: str | None = None
    cloudinary_api_key: str | None = None
    cloudinary_api_secret: str | None = None
    cloudinary_bill_folder_root: str = "limac/warranty-bills"

    r2_account_id: str | None = None
    r2_access_key_id: str | None = None
    r2_secret_access_key: str | None = None
    r2_bucket_name: str | None = None
    r2_bill_key_prefix: str = "limac/warranty-bills"

    initial_admin_email: str | None = None
    initial_admin_password: str | None = None

    integration_tally_enabled: bool = False
    integration_bearer_token: str | None = None
    integration_max_batch_items: int = 500

    sentry_dsn: AnyHttpUrl | None = None

    @computed_field  # type: ignore[prop-decorator]
    @property
    def is_production(self) -> bool:
        return self.environment == "production"

    @computed_field  # type: ignore[prop-decorator]
    @property
    def cloudinary_configured(self) -> bool:
        return bool(
            self.cloudinary_cloud_name
            and self.cloudinary_api_key
            and self.cloudinary_api_secret
        )

    @computed_field  # type: ignore[prop-decorator]
    @property
    def r2_configured(self) -> bool:
        return bool(
            self.r2_account_id
            and self.r2_access_key_id
            and self.r2_secret_access_key
            and self.r2_bucket_name
        )

    @computed_field  # type: ignore[prop-decorator]
    @property
    def r2_endpoint_url(self) -> str | None:
        if not self.r2_account_id:
            return None
        return f"https://{self.r2_account_id}.r2.cloudflarestorage.com"


@lru_cache
def get_settings() -> Settings:
    return Settings()
