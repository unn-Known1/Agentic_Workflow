from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    # API Settings
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    
    # NVIDIA API Settings
    nvidia_api_key: Optional[str] = os.getenv("NVIDIA_API_KEY")
    nvidia_base_url: str = "https://integrate.api.nvidia.com/v1"
    nvidia_model: str = "moonshotai/kimi-k2-thinking"
    
    # Database Settings
    database_url: str = "sqlite:///./agentic_workflow.db"
    
    # Vector Store Settings
    vector_store_path: str = "./vector_store"
    embedding_model: str = "all-MiniLM-L6-v2"
    
    # Redis Settings
    redis_url: str = "redis://localhost:6379"
    
    # Security
    secret_key: str = os.getenv("SECRET_KEY", "your-secret-key-here")
    access_token_expire_minutes: int = 30
    
    # File Storage
    upload_dir: str = "./uploads"
    max_file_size: int = 100 * 1024 * 1024  # 100MB
    
    # Execution Settings
    max_concurrent_tasks: int = 5
    default_timeout: int = 300  # 5 minutes
    
    # Logging
    log_level: str = "INFO"
    
    class Config:
        env_file = ".env"

settings = Settings()