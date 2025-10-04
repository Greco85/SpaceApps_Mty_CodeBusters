from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Dict, Any, Optional
import pandas as pd
import numpy as np
import joblib
import json
import io
from pydantic import BaseModel

router = APIRouter()

class AnalysisRequest(BaseModel):
    orbital_period: float
    transit_duration: float
    transit_depth: float
    stellar_radius: float
    stellar_mass: Optional[float] = None
    stellar_temperature: Optional[float] = None

class AnalysisResponse(BaseModel):
    prediction: str
    confidence: float
    probability_distribution: Dict[str, float]
    features_analyzed: Dict[str, float]
    interpretation: str

# Cargar modelo (esto se haría al inicializar la app en producción)
try:
    model = joblib.load("ml_models/trained_models/exoplanet_classifier.pkl")
except FileNotFoundError:
    # Modelo dummy para desarrollo
    model = None

@router.post("/predict", response_model=AnalysisResponse)
async def predict_exoplanet(request: AnalysisRequest):
    """
    Analiza características de un posible exoplaneta y devuelve una predicción.
    """
    try:
        # Preparar datos para el modelo
        features = np.array([
            request.orbital_period,
            request.transit_duration,
            request.transit_depth,
            request.stellar_radius,
            request.stellar_mass or 1.0,
            request.stellar_temperature or 5778.0
        ]).reshape(1, -1)
        
        # Si no hay modelo entrenado, usar lógica dummy
        if model is None:
            # Lógica dummy basada en reglas simples
            prediction, confidence, prob_dist = dummy_prediction(features[0])
        else:
            prediction = model.predict(features)[0]
            probabilities = model.predict_proba(features)[0]
            confidence = max(probabilities)
            
            prob_dist = {
                "exoplanet": float(probabilities[0]),
                "candidate": float(probabilities[1]),
                "false_positive": float(probabilities[2])
            }
        
        # Interpretación
        interpretation = get_interpretation(prediction, confidence, features[0])
        
        return AnalysisResponse(
            prediction=prediction,
            confidence=confidence,
            probability_distribution=prob_dist,
            features_analyzed={
                "orbital_period": float(request.orbital_period),
                "transit_duration": float(request.transit_duration),
                "transit_depth": float(request.transit_depth),
                "stellar_radius": float(request.stellar_radius),
                "stellar_mass": float(request.stellar_mass or 1.0),
                "stellar_temperature": float(request.stellar_temperature or 5778.0)
            },
            interpretation=interpretation
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en el análisis: {str(e)}")

@router.post("/upload", response_model=AnalysisResponse)
async def analyze_uploaded_file(file: UploadFile = File(...)):
    """
    Analiza un archivo CSV con datos de exoplanetas.
    """
    try:
        # Validar tipo de archivo
        if not file.filename.endswith('.csv'):
            raise HTTPException(status_code=400, detail="Solo se permiten archivos CSV")
        
        # Leer archivo
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        
        # Validar columnas requeridas
        required_columns = ['orbital_period', 'transit_duration', 'transit_depth', 'stellar_radius']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise HTTPException(
                status_code=400, 
                detail=f"Faltan columnas requeridas: {missing_columns}"
            )
        
        # Analizar primera fila (en producción se analizarían todas)
        row = df.iloc[0]
        request = AnalysisRequest(
            orbital_period=float(row['orbital_period']),
            transit_duration=float(row['transit_duration']),
            transit_depth=float(row['transit_depth']),
            stellar_radius=float(row['stellar_radius']),
            stellar_mass=float(row.get('stellar_mass', 1.0)),
            stellar_temperature=float(row.get('stellar_temperature', 5778.0))
        )
        
        return await predict_exoplanet(request)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error procesando archivo: {str(e)}")

def dummy_prediction(features):
    """
    Función dummy para predicciones cuando no hay modelo entrenado.
    """
    orbital_period, transit_duration, transit_depth, stellar_radius, stellar_mass, stellar_temp = features
    
    # Lógica simple basada en reglas
    if transit_depth > 0.01 and orbital_period < 50:
        prediction = "exoplanet"
        confidence = 0.85
        prob_dist = {"exoplanet": 0.85, "candidate": 0.10, "false_positive": 0.05}
    elif transit_depth > 0.005:
        prediction = "candidate"
        confidence = 0.70
        prob_dist = {"exoplanet": 0.20, "candidate": 0.70, "false_positive": 0.10}
    else:
        prediction = "false_positive"
        confidence = 0.80
        prob_dist = {"exoplanet": 0.05, "candidate": 0.15, "false_positive": 0.80}
    
    return prediction, confidence, prob_dist

def get_interpretation(prediction, confidence, features):
    """
    Genera una interpretación humana de la predicción.
    """
    interpretations = {
        "exoplanet": "Los datos muestran patrones consistentes con un tránsito planetario real. El período orbital y la profundidad del tránsito sugieren la presencia de un exoplaneta confirmado.",
        "candidate": "Los datos presentan características prometedoras pero requieren observaciones adicionales para confirmación definitiva. Se recomienda seguimiento con instrumentos de mayor resolución.",
        "false_positive": "Los patrones observados probablemente se deben a variabilidad estelar, binarias eclipsantes, o artefactos instrumentales. No se detectan señales planetarias significativas."
    }
    
    base_interpretation = interpretations.get(prediction, "Análisis no disponible.")
    
    if confidence < 0.6:
        base_interpretation += " La confianza baja sugiere que se requieren más datos para una clasificación definitiva."
    elif confidence > 0.9:
        base_interpretation += " La alta confianza respalda fuertemente esta clasificación."
    
    return base_interpretation
