from fastapi import APIRouter, HTTPException
from typing import Dict, List, Any
from pydantic import BaseModel
import json
import os
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

@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats():
    """
    Obtiene estadísticas generales del sistema usando datos de los CSVs y métricas del modelo.
    """
    try:
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
        }
        
        return DashboardStats(**stats)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al procesar los datos del dashboard: {e}")