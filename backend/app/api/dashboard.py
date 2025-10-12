from fastapi import APIRouter, HTTPException
from typing import Dict, List, Any
from pydantic import BaseModel
import json
import os
import pandas as pd
# Importa settings de tu core para obtener la ruta de datos
# Asegúrate de que tienes un archivo app/core/config.py con una clase settings que define data_path
from app.core.config import settings 
import pandas as pd
# Importa settings de tu core para obtener la ruta de datos
# Asegúrate de que tienes un archivo app/core/config.py con una clase settings que define data_path
from app.core.config import settings 

router = APIRouter()

# --- Configuración de Archivos y Rutas ---
# Asume que 'settings.data_path' apunta a tu carpeta de datos (ej. 'backend/data/processed/')
DATA_PATH = settings.data_path 
METRICS_FILE = os.path.join(DATA_PATH, "metrics.json") 
KOI_FILE = os.path.join(DATA_PATH, "koi_processed.csv") 
TOI_FILE = os.path.join(DATA_PATH, "toi_processed.csv")
K2_FILE = os.path.join(DATA_PATH, "k2_processed.csv")


# --- Modelos Pydantic ---

# --- Configuración de Archivos y Rutas ---
# Asume que 'settings.data_path' apunta a tu carpeta de datos (ej. 'backend/data/processed/')
DATA_PATH = settings.data_path 
METRICS_FILE = os.path.join(DATA_PATH, "metrics.json") 
KOI_FILE = os.path.join(DATA_PATH, "koi_processed.csv") 
TOI_FILE = os.path.join(DATA_PATH, "toi_processed.csv")
K2_FILE = os.path.join(DATA_PATH, "k2_processed.csv")


# --- Modelos Pydantic ---

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
    
# --- Funciones de Lógica de Datos ---

def load_data_and_get_counts():
    """Carga los datasets de exoplanetas y calcula los totales por misión."""
    
    datasets = [
        (KOI_FILE, 'koi_disposition', 'Kepler'),
        (TOI_FILE, 'toi_disposition', 'TESS'), 
        (K2_FILE, 'k2_disposition', 'K2')
    ]
    
    all_data = []
    mission_counts = []
    
    # Valores de clasificación estandarizados (AJUSTAR ESTOS VALORES A TUS CSVs REALES)
    # Por ejemplo, si usas la columna 'disposition', los valores podrían ser:
    CONFIRMED_VALUES = ['CONFIRMED', 'KEPLER CONFIRMED', 'KNOWN PLANET', 'CANDIDATE'] # Si quieres que los candidatos se cuenten como 'descubrimientos' generales
    CANDIDATE_VALUES = ['CANDIDATE', 'KEPLER CANDIDATE', 'TESS CANDIDATE']
    FP_VALUES = ['FALSE POSITIVE', 'NOT DISPOSITIONED']
    
    for file_path, disposition_col, mission_name in datasets:
        try:
            # Selecciona solo las columnas necesarias para optimizar
            df = pd.read_csv(file_path, low_memory=False)
            
            # Asegúrate de que las columnas críticas existan antes de continuar
            required_cols = [disposition_col, 'ra', 'dec', 'st_dist']
            if not all(col in df.columns for col in required_cols):
                 print(f"Error: Faltan columnas críticas en el archivo {mission_name}.")
                 continue
                 
            df = df.dropna(subset=[disposition_col])
            
            # Cálculo de estadísticas
            df['Classification'] = df[disposition_col].astype(str).str.upper().str.strip()

            exoplanets_count = len(df[df['Classification'].isin(CONFIRMED_VALUES)])
            candidates_count = len(df[df['Classification'].isin(CANDIDATE_VALUES)])
            fp_count = len(df[df['Classification'].isin(FP_VALUES)])
            total_discoveries = len(df)
            
            mission_counts.append({
                "mission": mission_name,
                "exoplanets": exoplanets_count,
                "candidates": candidates_count,
                "false_positives": fp_count,
                "total_discoveries": total_discoveries
            })
            
            all_data.append(df.drop(columns=['Classification'])) # Elimina la columna temporal
            
        except FileNotFoundError:
            print(f"Advertencia: Archivo no encontrado para {mission_name}: {file_path}")
            
    if all_data:
        combined_df = pd.concat(all_data, ignore_index=True)
        return combined_df, mission_counts
    
    return pd.DataFrame(), []

def load_model_metrics() -> Dict[str, Any]:
    """Carga las métricas del modelo desde metrics.json."""
    try:
        with open(METRICS_FILE, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        # Fallback si el archivo no existe
        return {
            "accuracy": 0.0, "precision": 0.0, "recall": 0.0, "f1_score": 0.0, 
            "auc_roc": 0.0, 
            "confusion_matrix": {
                "true_positives": 0, "false_positives": 0,
                "true_negatives": 0, "false_negatives": 0
            },
            "feature_importance": {}
        }


# --- Endpoints Actualizados (Usan datos reales de CSV/JSON) ---
    
# --- Funciones de Lógica de Datos ---

def load_data_and_get_counts():
    """Carga los datasets de exoplanetas y calcula los totales por misión."""
    
    datasets = [
        (KOI_FILE, 'koi_disposition', 'Kepler'),
        (TOI_FILE, 'toi_disposition', 'TESS'), 
        (K2_FILE, 'k2_disposition', 'K2')
    ]
    
    all_data = []
    mission_counts = []
    
    # Valores de clasificación estandarizados (AJUSTAR ESTOS VALORES A TUS CSVs REALES)
    # Por ejemplo, si usas la columna 'disposition', los valores podrían ser:
    CONFIRMED_VALUES = ['CONFIRMED', 'KEPLER CONFIRMED', 'KNOWN PLANET', 'CANDIDATE'] # Si quieres que los candidatos se cuenten como 'descubrimientos' generales
    CANDIDATE_VALUES = ['CANDIDATE', 'KEPLER CANDIDATE', 'TESS CANDIDATE']
    FP_VALUES = ['FALSE POSITIVE', 'NOT DISPOSITIONED']
    
    for file_path, disposition_col, mission_name in datasets:
        try:
            # Selecciona solo las columnas necesarias para optimizar
            df = pd.read_csv(file_path, low_memory=False)
            
            # Asegúrate de que las columnas críticas existan antes de continuar
            required_cols = [disposition_col, 'ra', 'dec', 'st_dist']
            if not all(col in df.columns for col in required_cols):
                 print(f"Error: Faltan columnas críticas en el archivo {mission_name}.")
                 continue
                 
            df = df.dropna(subset=[disposition_col])
            
            # Cálculo de estadísticas
            df['Classification'] = df[disposition_col].astype(str).str.upper().str.strip()

            exoplanets_count = len(df[df['Classification'].isin(CONFIRMED_VALUES)])
            candidates_count = len(df[df['Classification'].isin(CANDIDATE_VALUES)])
            fp_count = len(df[df['Classification'].isin(FP_VALUES)])
            total_discoveries = len(df)
            
            mission_counts.append({
                "mission": mission_name,
                "exoplanets": exoplanets_count,
                "candidates": candidates_count,
                "false_positives": fp_count,
                "total_discoveries": total_discoveries
            })
            
            all_data.append(df.drop(columns=['Classification'])) # Elimina la columna temporal
            
        except FileNotFoundError:
            print(f"Advertencia: Archivo no encontrado para {mission_name}: {file_path}")
            
    if all_data:
        combined_df = pd.concat(all_data, ignore_index=True)
        return combined_df, mission_counts
    
    return pd.DataFrame(), []

def load_model_metrics() -> Dict[str, Any]:
    """Carga las métricas del modelo desde metrics.json."""
    try:
        with open(METRICS_FILE, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        # Fallback si el archivo no existe
        return {
            "accuracy": 0.0, "precision": 0.0, "recall": 0.0, "f1_score": 0.0, 
            "auc_roc": 0.0, 
            "confusion_matrix": {
                "true_positives": 0, "false_positives": 0,
                "true_negatives": 0, "false_negatives": 0
            },
            "feature_importance": {}
        }


# --- Endpoints Actualizados (Usan datos reales de CSV/JSON) ---

@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats():
    """
    Obtiene estadísticas generales del sistema usando datos de los CSVs y métricas del modelo.
    Obtiene estadísticas generales del sistema usando datos de los CSVs y métricas del modelo.
    """
    try:
        _, mission_counts = load_data_and_get_counts()
        metrics = load_model_metrics()
        
        # Calcular totales consolidados
        total_exoplanets = sum(m.get('exoplanets', 0) for m in mission_counts)
        total_candidates = sum(m.get('candidates', 0) for m in mission_counts)
        total_false_positives = sum(m.get('false_positives', 0) for m in mission_counts)
        
        _, mission_counts = load_data_and_get_counts()
        metrics = load_model_metrics()
        
        # Calcular totales consolidados
        total_exoplanets = sum(m.get('exoplanets', 0) for m in mission_counts)
        total_candidates = sum(m.get('candidates', 0) for m in mission_counts)
        total_false_positives = sum(m.get('false_positives', 0) for m in mission_counts)
        
        stats = {
            "total_exoplanets": total_exoplanets,
            "total_candidates": total_candidates,
            "total_false_positives": total_false_positives,
            "model_accuracy": metrics.get("accuracy", 0.0),
            "model_precision": metrics.get("precision", 0.0),
            "model_recall": metrics.get("recall", 0.0),
            "model_f1_score": metrics.get("f1_score", 0.0)
            "total_exoplanets": total_exoplanets,
            "total_candidates": total_candidates,
            "total_false_positives": total_false_positives,
            "model_accuracy": metrics.get("accuracy", 0.0),
            "model_precision": metrics.get("precision", 0.0),
            "model_recall": metrics.get("recall", 0.0),
            "model_f1_score": metrics.get("f1_score", 0.0)
        }
        
        return DashboardStats(**stats)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al procesar los datos del dashboard: {e}")

# ---
@router.get("/missions", response_model=List[MissionData])
async def get_mission_data():
    """
    Obtiene datos de descubrimientos por misión usando los CSVs.
    """
    try:
        _, missions_data = load_data_and_get_counts()
        return [MissionData(**mission) for mission in missions_data]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener datos de misiones: {e}")

# ---
@router.get("/trends", response_model=List[DiscoveryTrend])
async def get_discovery_trends():
    """
    Obtiene tendencias de descubrimientos por año (usa datos de ejemplo simplificados).
    """
    # Mantenemos los datos de ejemplo por simplicidad (extraer tendencias por año del CSV es más complejo)
    trends_data = [
        {"year": "2019", "discoveries": 45},
        {"year": "2020", "discoveries": 67},
        {"year": "2021", "discoveries": 89},
        {"year": "2022", "discoveries": 112},
        {"year": "2023", "discoveries": 134},
        {"year": "2024", "discoveries": 156}
    ]
    return [DiscoveryTrend(**trend) for trend in trends_data]

# ---
@router.get("/model-performance")
async def get_model_performance():
    """
    Obtiene métricas de rendimiento del modelo desde metrics.json.
    """
    try:
        performance_data = load_model_metrics()
        return performance_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener rendimiento del modelo: {e}")

# --- Nuevo Endpoint para Visualización 3D ---
@router.get("/coords-3d", response_model=List[Dict[str, float]])
async def get_3d_coordinates_data(limit: int = 1000):
    """
    Obtiene las coordenadas (RA, Dec, Distancia) de exoplanetas para visualización 3D.
    """
    try:
        combined_df, _ = load_data_and_get_counts()
        
        # Filtra por las columnas de coordenadas requeridas
        coords_cols = ['ra', 'dec', 'st_dist']
        
        # Asegúrate de que todas las columnas existan y extrae los datos
        available_cols = [col for col in coords_cols if col in combined_df.columns]
        
        if len(available_cols) < 3:
             # Si faltan datos clave, devuelve un array vacío
             return []

        # Asegúrate de trabajar solo con los confirmados y candidatos que tienen datos 3D
        coords = combined_df[available_cols].dropna()
        
        # Limita la muestra para el rendimiento del Frontend
        if len(coords) > limit:
            coords = coords.sample(limit, random_state=42) # Usamos un random_state para consistencia
            
        # Renombra y convierte a formato JSON
        coords = coords.rename(columns={'st_dist': 'distance'}).to_dict('records')
        
        return coords

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener coordenadas 3D: {e}")

# ---
@router.get("/recent-discoveries")
async def get_recent_discoveries(limit: int = 10):
    """
    Obtiene los descubrimientos más recientes (mantiene datos de ejemplo).
    """
    try:
        # Mantenemos los datos de ejemplo fijos, ya que la columna de fecha puede variar entre misiones
        # y la lógica para obtener los "últimos 10" sería más compleja de implementar solo con Pandas.
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