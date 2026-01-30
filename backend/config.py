"""
Configuration settings for NeuroNest backend
"""

import os
from typing import List
from dotenv import load_dotenv

# Load .env file before Settings class instantiation
load_dotenv()

class Settings:
    # Environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    
    # Server
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8080"))
    
    # Supabase
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    
    # OpenAI
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    
    # CORS - Update these with your actual domains
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8080",
        "https://neuronest-3bc25.web.app",
        "https://neuronest-3bc25.firebaseapp.com",
        "https://neuronest-app.web.app",
        "https://neuronest-app.firebaseapp.com",
        "https://neuronest-v2-prod.web.app",
        "https://neuronest-v2-prod.firebaseapp.com",
        # Add your custom domain here
        # "https://yourdomain.com"
    ]
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    
    # API Settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "NeuroNest API"
    VERSION: str = "1.0.0"
    
    # Rate limiting
    RATE_LIMIT_PER_MINUTE: int = int(os.getenv("RATE_LIMIT_PER_MINUTE", "60"))
    
    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    
    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"
    
    @property
    def is_development(self) -> bool:
        return self.ENVIRONMENT == "development"

# Global settings instance
settings = Settings()

# Validation
def validate_settings():
    """Validate required settings"""
    required_vars = [
        "SUPABASE_URL",
        "SUPABASE_SERVICE_ROLE_KEY", 
        "OPENAI_API_KEY"
    ]
    
    missing_vars = []
    for var in required_vars:
        if not getattr(settings, var):
            missing_vars.append(var)
    
    if missing_vars:
        raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")

# Validate on import in production
if settings.is_production:
    validate_settings()