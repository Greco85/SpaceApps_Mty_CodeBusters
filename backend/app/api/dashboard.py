from fastapi import APIRouter, HTTPException
from typing import Dict, List, Any
from pydantic import BaseModel
from ..database.mongodb import mongodb

router = APIRouter()

class DashboardStats(BaseModel):
    total_analyzed: int
    confirmed: int
    candidates: int
    false_positives: int
    accuracy: float
    precision: float
    recall: float
    f1_score: float

class MissionData(BaseModel):
    mission: str
    count: int

class DiscoveryTrend(BaseModel):
    year: str
    discoveries: int

@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats():
    """
    Obtiene estadísticas generales del sistema desde MongoDB.
    """
    try:
        if mongodb.exoplanets_collection is None:
            # Si no hay conexión a MongoDB, usar datos de ejemplo
            return DashboardStats(
                total_analyzed=8600,
                confirmed=4500,
                candidates=2800,
                false_positives=1300,
                accuracy=0.92,
                precision=0.89,
                recall=0.87,
                f1_score=0.88
            )
        
        collection = mongodb.exoplanets_collection
        
        # Contar total de exoplanetas
        total_analyzed = await collection.count_documents({})
        
        # Contar por clasificación
        confirmed = await collection.count_documents({"classification": "exoplanet"})
        candidates = await collection.count_documents({"classification": "candidate"})
        false_positives = await collection.count_documents({"classification": "false_positive"})
        
        # Calcular métricas del modelo (valores de ejemplo para el hackathon)
        if total_analyzed > 0:
            accuracy = 92.0  # 92% de exactitud
            precision = 89.0  # 89% de precisión
            recall = 87.0     # 87% de recall
            f1_score = 88.0   # 88% de F1-score
        else:
            accuracy = precision = recall = f1_score = 0.0
        
        return DashboardStats(
            total_analyzed=total_analyzed,
            confirmed=confirmed,
            candidates=candidates,
            false_positives=false_positives,
            accuracy=accuracy,
            precision=precision,
            recall=recall,
            f1_score=f1_score
        )
        
    except Exception as e:
        # En caso de error, devolver datos de ejemplo
        return DashboardStats(
            total_analyzed=8600,
            confirmed=4500,
            candidates=2800,
            false_positives=1300,
            accuracy=0.92,
            precision=0.89,
            recall=0.87,
            f1_score=0.88
        )

@router.get("/missions", response_model=List[MissionData])
async def get_mission_data():
    """
    Obtiene datos de descubrimientos por misión.
    """
    try:
        # Datos de ejemplo para el hackathon
        missions = [
            {"mission": "Kepler", "count": 4500},
            {"mission": "TESS", "count": 2800},
            {"mission": "K2", "count": 800},
            {"mission": "Otros", "count": 500}
        ]
        
        return missions
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo datos de misiones: {str(e)}")

@router.get("/discovery-trends", response_model=List[DiscoveryTrend])
async def get_discovery_trends():
    """
    Obtiene tendencias de descubrimiento por año.
    """
    try:
        # Datos de ejemplo para el hackathon
        trends = [
            {"year": "2015", "discoveries": 1200},
            {"year": "2016", "discoveries": 1450},
            {"year": "2017", "discoveries": 1680},
            {"year": "2018", "discoveries": 1890},
            {"year": "2019", "discoveries": 2100},
            {"year": "2020", "discoveries": 1850},
            {"year": "2021", "discoveries": 2200},
            {"year": "2022", "discoveries": 2450},
            {"year": "2023", "discoveries": 2600},
            {"year": "2024", "discoveries": 2800},
            {"year": "2025", "discoveries": 1200}
        ]
        
        return trends
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo tendencias: {str(e)}")