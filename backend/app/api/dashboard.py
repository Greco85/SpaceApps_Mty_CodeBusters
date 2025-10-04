from fastapi import APIRouter, HTTPException
from typing import Dict, List, Any
from pydantic import BaseModel
import json
import os

router = APIRouter()

class DashboardStats(BaseModel):
    total_exoplanets: int
    total_candidates: int
    total_false_positives: int
    model_accuracy: float
    model_precision: float
    model_recall: float
    model_f1_score: float

class MissionData(BaseModel):
    mission: str
    exoplanets: int
    candidates: int
    false_positives: int
    total_discoveries: int

class DiscoveryTrend(BaseModel):
    year: str
    discoveries: int

@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats():
    """
    Obtiene estadísticas generales del sistema.
    """
    try:
        # En producción, estos datos vendrían de la base de datos
        # Por ahora, datos de ejemplo
        stats = {
            "total_exoplanets": 365,
            "total_candidates": 144,
            "total_false_positives": 50,
            "model_accuracy": 0.942,
            "model_precision": 0.938,
            "model_recall": 0.918,
            "model_f1_score": 0.930
        }
        
        return DashboardStats(**stats)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo estadísticas: {str(e)}")

@router.get("/missions", response_model=List[MissionData])
async def get_mission_data():
    """
    Obtiene datos de descubrimientos por misión.
    """
    try:
        missions_data = [
            {
                "mission": "Kepler",
                "exoplanets": 120,
                "candidates": 45,
                "false_positives": 15,
                "total_discoveries": 180
            },
            {
                "mission": "K2",
                "exoplanets": 89,
                "candidates": 32,
                "false_positives": 12,
                "total_discoveries": 133
            },
            {
                "mission": "TESS",
                "exoplanets": 156,
                "candidates": 67,
                "false_positives": 23,
                "total_discoveries": 246
            }
        ]
        
        return [MissionData(**mission) for mission in missions_data]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo datos de misiones: {str(e)}")

@router.get("/trends", response_model=List[DiscoveryTrend])
async def get_discovery_trends():
    """
    Obtiene tendencias de descubrimientos por año.
    """
    try:
        trends_data = [
            {"year": "2019", "discoveries": 45},
            {"year": "2020", "discoveries": 67},
            {"year": "2021", "discoveries": 89},
            {"year": "2022", "discoveries": 112},
            {"year": "2023", "discoveries": 134},
            {"year": "2024", "discoveries": 156}
        ]
        
        return [DiscoveryTrend(**trend) for trend in trends_data]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo tendencias: {str(e)}")

@router.get("/model-performance")
async def get_model_performance():
    """
    Obtiene métricas de rendimiento del modelo.
    """
    try:
        performance_data = {
            "accuracy": 0.942,
            "precision": 0.938,
            "recall": 0.918,
            "f1_score": 0.930,
            "auc_roc": 0.965,
            "confusion_matrix": {
                "true_positives": 342,
                "false_positives": 23,
                "true_negatives": 48,
                "false_negatives": 27
            },
            "feature_importance": {
                "transit_depth": 0.35,
                "orbital_period": 0.28,
                "transit_duration": 0.22,
                "stellar_radius": 0.15
            }
        }
        
        return performance_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo rendimiento del modelo: {str(e)}")

@router.get("/recent-discoveries")
async def get_recent_discoveries(limit: int = 10):
    """
    Obtiene los descubrimientos más recientes.
    """
    try:
        # Datos de ejemplo - en producción vendrían de la base de datos
        recent_discoveries = [
            {
                "id": "TOI-1234b",
                "mission": "TESS",
                "discovery_date": "2024-12-15",
                "classification": "exoplanet",
                "confidence": 0.94,
                "orbital_period": 12.5,
                "stellar_name": "TOI-1234"
            },
            {
                "id": "K2-567c",
                "mission": "K2",
                "discovery_date": "2024-12-10",
                "classification": "candidate",
                "confidence": 0.78,
                "orbital_period": 28.3,
                "stellar_name": "K2-567"
            },
            {
                "id": "Kepler-890d",
                "mission": "Kepler",
                "discovery_date": "2024-12-05",
                "classification": "exoplanet",
                "confidence": 0.89,
                "orbital_period": 45.7,
                "stellar_name": "Kepler-890"
            }
        ]
        
        return recent_discoveries[:limit]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo descubrimientos recientes: {str(e)}")
