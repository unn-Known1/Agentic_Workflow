from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    # API Settings
    api_host: str = os.getenv("API_HOST", "127.0.0.1")  # Default to localhost for security
    api_port: int = int(os.getenv("API_PORT", "8000"))

    # NVIDIA API Settings
    nvidia_api_key: Optional[str] = os.getenv("NVIDIA_API_KEY")
    nvidia_base_url: str = "https://integrate.api.nvidia.io/v1"
    nvidia_model: str = "moonshotai/kimi-k2-thinking"

    # Database Settings
    database_url: str = "sqlite:///./agentic_workflow.db"

    # Vector Store Settings
    vector_store_path: str = "./vector_store"
    embedding_model: str = "all-MiniLM-L6-v2"

    # Redis Settings
    redis_url: str = os.getenv("REDIS_URL", "redis://127.0.0.1:6379")

    # Security - Generate a secure key if not provided
    _secret_key_fallback: str = os.urandom(32).hex()  # Generate random key as fallback
    secret_key: str = os.getenv("SECRET_KEY", _secret_key_fallback)
    access_token_expire_minutes: int = 30

    # File Storage
    upload_dir: str = "./uploads"
    max_file_size: int = 100 * 1024 * 1024  # 100MB

    # Execution Settings
    max_concurrent_tasks: int = 5
    default_timeout: int = 300  # 5 minutes

    # Logging
    log_level: str = "INFO"

    # CORS Settings - Restrictive by default
    cors_origins: str = os.getenv("CORS_ORIGINS", "http://localhost:3000")

    class Config:
        env_file = ".env"

    def get_cors_origins(self) -> list[str]:
        """Parse CORS_ORIGINS from environment variable into a list."""
        if not self.cors_origins:
            return ["http://localhost:3000"]  # Safe default
        return [origin.strip() for origin in self.cors_origins.split(",")]

settings = Settings()
