from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    # API Settings
    api_title: str = "Exoplanet Hunter API"
    api_version: str = "1.0.0"
    debug: bool = False
    
    # Database
    database_url: Optional[str] = None
    
    # ML Models
    model_path: str = "ml_models/trained_models/"
    data_path: str = "data/processed/"
    # Gemini / Generative AI
    gemini_api_key: Optional[str] = "AIzaSyANxRWtZKccr4BmCO-TBFcEbmCnykiweSM"
    gemini_api_url: Optional[str] = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"
    # If GEMINI_API_URL is not provided, GEMINI_MODEL can be used to build a default v1beta URL
    gemini_model: Optional[str] = None
    
    # CORS
    allowed_origins: list = ["http://localhost:3000", "http://127.0.0.1:3000"]
    
    # File Upload
    max_file_size: int = 10 * 1024 * 1024  # 10MB
    allowed_file_types: list = ["csv", "json"]
    
    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()
