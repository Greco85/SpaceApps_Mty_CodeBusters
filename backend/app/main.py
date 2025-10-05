from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import pandas as pd
import numpy as np
from typing import Dict, Any
import joblib
import os

from app.api import analysis, dashboard, chat, exoplanets
from app.core.config import settings
from app.database.mongodb import mongodb

app = FastAPI(
    title="Exoplanet Hunter API",
    description="API para detección automática de exoplanetas usando IA",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "https://*.godaddy.com", "https://*.netlify.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(analysis.router, prefix="/api/v1/analysis", tags=["analysis"])
app.include_router(dashboard.router, prefix="/api/v1/dashboard", tags=["dashboard"])
app.include_router(chat.router, prefix="/api/v1/chat", tags=["chat"])
app.include_router(exoplanets.router, prefix="/api/v1", tags=["exoplanets"])

@app.get("/")
async def root():
    return {
        "message": "Exoplanet Hunter API",
        "version": "1.0.0",
        "status": "active",
        "endpoints": {
            "analysis": "/api/v1/analysis",
            "dashboard": "/api/v1/dashboard",
            "docs": "/docs"
        }
    }

@app.on_event("startup")
async def startup_event():
    """Inicializar MongoDB al arrancar la aplicación"""
    await mongodb.connect()
    # Insertar datos de muestra si la base de datos está vacía
    exoplanets = await mongodb.get_all_exoplanets(limit=1)
    if not exoplanets:
        await mongodb.insert_sample_data()

@app.on_event("shutdown")
async def shutdown_event():
    """Cerrar conexión a MongoDB al apagar la aplicación"""
    await mongodb.disconnect()

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "exoplanet-hunter-api"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

