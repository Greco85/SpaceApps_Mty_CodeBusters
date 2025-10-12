from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Dict, Any, Optional
import pandas as pd
import numpy as np
import joblib
import json
import io
import math
from pydantic import BaseModel
import os

router = APIRouter()

class AnalysisRequest(BaseModel):
    orbital_period: float
    transit_duration: Optional[float] = None
    transit_depth: Optional[float] = None
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
            request.transit_duration or 0.0,
            request.transit_depth or 0.0,
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
        
        # Leer archivo (robusto a CSVs mal formados)
        contents = await file.read()
        text = contents.decode('utf-8', errors='replace')

        # Preprocesado: eliminar líneas de comentario iniciales (p. ej. archivos NASA que comienzan con '#')
        lines = text.splitlines()
        # Skip initial blank/comment lines
        start = 0
        while start < len(lines) and (lines[start].strip() == '' or lines[start].lstrip().startswith('#')):
            start += 1

        # Try to locate a header line within the following window that contains one of the required column names
        header_idx = None
        # Allow searching a larger window for the header because some files
        # include many comment lines and metadata before the CSV header
        window_end = min(len(lines), start + 200)
        lower_lines = [l.lower() for l in lines]
        for j in range(start, window_end):
            l = lower_lines[j]
            # If line contains a comma or tab, or any required column name, treat it as header
            if ',' in l or '\t' in l or any(col in l for col in ["orbital_period", "transit_duration", "transit_depth", "stellar_radius"]):
                header_idx = j
                break

        if header_idx is None:
            # fallback: start from first non-comment line
            header_idx = start

        cleaned_text = '\n'.join(lines[header_idx:])

        try:
            df = pd.read_csv(io.StringIO(cleaned_text))
        except Exception:
            # Fallback: let pandas try to guess separator and skip bad lines
            df = pd.read_csv(io.StringIO(cleaned_text), sep=None, engine='python', on_bad_lines='skip')
        
        # Map common aliases to expected canonical names so CSVs from different sources are accepted
        alias_map = {
            # orbital period aliases (Kepler, K2, TESS, generic)
            'orbital_period': [
                'orbital_period', 'koi_period', 'period', 'kep_period', 'kepoi_period',
                'pl_orbper', 'pl_orbper', 'orbper', 'pl_orbper'
            ],
            # transit duration aliases (hours/day variants present across catalogs)
            'transit_duration': [
                'transit_duration', 'koi_duration', 'duration', 'koi_time0bk',
                'pl_trandurh', 'pl_trandur', 'trandur', 'pl_trandurh', 'tranduration'
            ],
            # transit depth aliases (ppm or fraction)
            'transit_depth': [
                'transit_depth', 'koi_depth', 'depth', 'koi_depth',
                'pl_trandep', 'pl_trande', 'pl_trandep'
            ],
            # stellar radius aliases
            'stellar_radius': [
                'stellar_radius', 'koi_srad', 'srad', 'koi_srad_err1', 'stellar_radius_rsun',
                'st_rad'
            ]
        }

        # Build a rename map from actual df columns to canonical names (case-insensitive)
        rename_map = {}
        lower_to_col = {c.lower(): c for c in df.columns}
        for canonical, aliases in alias_map.items():
            found = None
            for a in aliases:
                if a.lower() in lower_to_col:
                    found = lower_to_col[a.lower()]
                    break
            if found:
                rename_map[found] = canonical

        if rename_map:
            df = df.rename(columns=rename_map)

        # If some required canonical columns still missing, try a more permissive substring match
        lower_to_col = {c.lower(): c for c in df.columns}
        keyword_map = {
            'orbital_period': ['orbper', 'orb', 'period', 'per'],
            'transit_duration': ['trandur', 'duration', 'dur', 'trandurh', 'tran'],
            'transit_depth': ['trandep', 'depth', 'dep'],
            # Note: do NOT use 'pl_rade' here (planet radius) — it is NOT the stellar radius.
            'stellar_radius': ['srad', 'rad', 'st_rad', 'prad']
        }

        for canonical, keywords in keyword_map.items():
            if canonical in df.columns:
                continue
            # look for any column that contains one of the keywords
            found_col = None
            for lower_name, orig in lower_to_col.items():
                if any(k in lower_name for k in keywords):
                    found_col = orig
                    break
            if found_col:
                # rename this column to canonical
                df = df.rename(columns={found_col: canonical})

        # Validar columnas requeridas
        # If transit_depth or transit_duration are missing we can try to compute
        # conservative estimates from other available columns (planet radius, stellar radius, semi-major axis).

        # Helper: find the first existing column from a list of candidates
        def _find_col(*candidates):
            for c in candidates:
                if c in df.columns:
                    return c
            return None

        # Helper: safely coerce a present column to numeric
        def _to_numeric_if_exists(colname):
            if colname and colname in df.columns:
                df[colname] = pd.to_numeric(df[colname], errors='coerce')

        col_pl_rade = _find_col('pl_rade', 'pl_radj', 'pl_rade')
        col_st_rad = _find_col('stellar_radius', 'st_rad', 'koi_srad')
        col_pl_orbsmax = _find_col('pl_orbsmax', 'pl_orbsmax')
        col_pl_orbper = _find_col('pl_orbper', 'pl_orbper')
        col_orbital_period = _find_col('orbital_period', 'period', 'pl_orbper')

        _to_numeric_if_exists(col_pl_rade)
        _to_numeric_if_exists('pl_radj')
        _to_numeric_if_exists(col_st_rad)
        _to_numeric_if_exists(col_pl_orbsmax)
        _to_numeric_if_exists('pl_orbsmaxerr1')
        _to_numeric_if_exists(col_pl_orbper)
        _to_numeric_if_exists(col_orbital_period)

        # Constants for unit conversions
        R_EARTH_TO_R_SUN = 0.009155  # approx Earth radius in Solar radii
        R_SUN_TO_AU = 0.00465047     # approx Solar radius in AU

        # Compute transit_depth if missing and we have planet radius and stellar radius
        if 'transit_depth' not in df.columns:
            if col_pl_rade and col_st_rad and col_pl_rade in df.columns and col_st_rad in df.columns:
                try:
                    # depth (fraction) ~= (Rp/Rs)^2
                    depth_series = ((df[col_pl_rade] * R_EARTH_TO_R_SUN) / df[col_st_rad]) ** 2
                    depth_series = depth_series.replace([np.inf, -np.inf], np.nan)
                    df['transit_depth'] = depth_series
                except Exception:
                    pass

        # Compute transit_duration (hours) if missing and we have orbital period + stellar radius.
        # We try to use pl_orbsmax (AU) if present; otherwise estimate 'a' from period assuming M_star ~ 1 Msun:
        #   a(AU) ≈ (P_days / 365.25)^(2/3)
        if 'transit_duration' not in df.columns:
            # choose period column
            if 'orbital_period' in df.columns:
                period_col = 'orbital_period'
            elif 'pl_orbper' in df.columns:
                period_col = 'pl_orbper'
            elif 'pl_orbper' in df.columns:
                period_col = 'pl_orbper'
            else:
                period_col = None

            if period_col and col_st_rad and col_st_rad in df.columns:
                try:
                    P = pd.to_numeric(df[period_col], errors='coerce')  # days
                    Rs = pd.to_numeric(df[col_st_rad], errors='coerce')
                    Rs_AU = Rs * R_SUN_TO_AU

                    # prefer provided semi-major axis column if available
                    if col_pl_orbsmax and col_pl_orbsmax in df.columns:
                        a = pd.to_numeric(df[col_pl_orbsmax], errors='coerce')
                    else:
                        # estimate a from period (Kepler's third law, assuming M_star~1 Msun)
                        a = (P / 365.25) ** (2.0/3.0)

                    with np.errstate(invalid='ignore', divide='ignore'):
                        duration_days = (P / math.pi) * (Rs_AU / a)
                        duration_hours = duration_days * 24.0
                        duration_hours = duration_hours.replace([np.inf, -np.inf], np.nan)
                        df['transit_duration'] = duration_hours
                except Exception:
                    pass

        # Validar columnas requeridas basado en el tipo de modelo detectado
        model_type = detect_model_type(df)
        print(f"🔍 Modelo detectado: {model_type}")
        
        # Mapear columnas genéricas a específicas del modelo
        if model_type == 'k2':
            # Mapear columnas genéricas a específicas de K2
            column_mapping = {
                'orbital_period': 'period',
                'stellar_radius': 'star_radius',
                'planet_radius': 'radius',  # Radio del planeta
                'pl_radius': 'radius',      # Alias común para radio del planeta
                'pl_rade': 'radius'         # Alias NASA para radio del planeta
            }
            for generic_col, specific_col in column_mapping.items():
                if generic_col in df.columns and specific_col not in df.columns:
                    df[specific_col] = df[generic_col]
                    print(f"📋 Mapeado {generic_col} -> {specific_col}")
            
            # Si no hay radio del planeta, usar un valor por defecto
            if 'radius' not in df.columns:
                df['radius'] = 1.0  # 1 radio terrestre por defecto
                print("📋 Agregado 'radius' con valor por defecto: 1.0")
            
            required_columns = ['period', 'radius', 'teq', 'star_radius', 'star_mass', 'logg', 'insolation', 'star_teff', 'v_mag', 'radius_ratio']
        elif model_type == 'tess':
            # Mapear columnas genéricas a específicas de TESS
            column_mapping = {
                'orbital_period': 'period',
                'transit_duration': 'duration',
                'transit_depth': 'depth',
                'stellar_radius': 'star_radius',
                'planet_radius': 'radius',  # Radio del planeta
                'pl_radius': 'radius',      # Alias común para radio del planeta
                'pl_rade': 'radius'         # Alias NASA para radio del planeta
            }
            for generic_col, specific_col in column_mapping.items():
                if generic_col in df.columns and specific_col not in df.columns:
                    df[specific_col] = df[generic_col]
                    print(f"📋 Mapeado {generic_col} -> {specific_col}")
            
            # Si no hay radio del planeta, usar un valor por defecto
            if 'radius' not in df.columns:
                df['radius'] = 1.0  # 1 radio terrestre por defecto
                print("📋 Agregado 'radius' con valor por defecto: 1.0")
            
            required_columns = ['period', 'duration', 'depth', 'radius', 'teq', 'star_radius', 'logg', 'insolation', 'star_teff', 'tess_mag', 'period_duration_ratio', 'transit_snr', 'depth_duration_ratio', 'radius_ratio']
        elif model_type == 'kepler':
            # Mapear columnas genéricas a específicas de Kepler
            column_mapping = {
                'orbital_period': 'period',
                'transit_duration': 'duration',
                'transit_depth': 'depth',
                'stellar_radius': 'star_radius',
                'planet_radius': 'radius',  # Radio del planeta
                'pl_radius': 'radius',      # Alias común para radio del planeta
                'pl_rade': 'radius'         # Alias NASA para radio del planeta
            }
            for generic_col, specific_col in column_mapping.items():
                if generic_col in df.columns and specific_col not in df.columns:
                    df[specific_col] = df[generic_col]
                    print(f"📋 Mapeado {generic_col} -> {specific_col}")
            
            # Si no hay radio del planeta, usar un valor por defecto
            if 'radius' not in df.columns:
                df['radius'] = 1.0  # 1 radio terrestre por defecto
                print("📋 Agregado 'radius' con valor por defecto: 1.0")
            
            required_columns = ['period', 'duration', 'depth', 'radius', 'teq', 'star_radius', 'logg', 'impact_parameter', 'insolation', 'snr', 'period_duration_ratio', 'transit_snr', 'depth_duration_ratio', 'radius_ratio']
        else:
            # Fallback para modelos genéricos
            required_columns = ['orbital_period', 'transit_duration', 'transit_depth', 'stellar_radius']
        
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            # Provide a structured JSON detail for easier parsing on client side
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "missing_columns",
                    "missing": missing_columns,
                    "available_columns": list(df.columns[:50]),
                    "model_type": model_type,
                    "required_columns": required_columns
                }
            )
        # Analizar primera fila (en producción se analizarían todas)
        row = df.iloc[0]

        def compute_transit_depth_from_row(r):
            # Try pl_rade (Earth radii) and stellar radius (R_sun) to estimate depth fraction
            try:
                pr = None
                if 'pl_rade' in r and pd.notna(r['pl_rade']):
                    pr = pd.to_numeric(r['pl_rade'], errors='coerce')
                elif 'pl_radj' in r and pd.notna(r['pl_radj']):
                    pr = pd.to_numeric(r['pl_radj'], errors='coerce') * 11.209  # Jupiter->Earth rough if needed

                sr = None
                if 'stellar_radius' in r and pd.notna(r['stellar_radius']):
                    sr = pd.to_numeric(r['stellar_radius'], errors='coerce')
                elif 'st_rad' in r and pd.notna(r['st_rad']):
                    sr = pd.to_numeric(r['st_rad'], errors='coerce')

                if pr is None or sr is None or pd.isna(pr) or pd.isna(sr) or sr == 0:
                    return None

                # Rp in Earth radii -> convert to solar radii
                depth = ((pr * R_EARTH_TO_R_SUN) / sr) ** 2
                if not np.isfinite(depth):
                    return None
                return float(depth)
            except Exception:
                return None

        def compute_transit_duration_from_row(r):
            # Use orbital period (days) and stellar radius to estimate transit duration (hours)
            try:
                # find period
                P = None
                for k in ['orbital_period', 'pl_orbper', 'period', 'kep_period', 'koi_period']:
                    if k in r and pd.notna(r[k]):
                        P = pd.to_numeric(r[k], errors='coerce')
                        break
                if P is None or pd.isna(P):
                    return None

                # stellar radius
                Rs = None
                for k in ['stellar_radius', 'st_rad', 'koi_srad']:
                    if k in r and pd.notna(r[k]):
                        Rs = pd.to_numeric(r[k], errors='coerce')
                        break
                if Rs is None or pd.isna(Rs) or Rs == 0:
                    return None

                Rs_AU = Rs * R_SUN_TO_AU

                # prefer semi-major axis if present
                a = None
                for k in ['pl_orbsmax', 'pl_orbsmax', 'a']:
                    if k in r and pd.notna(r[k]):
                        a = pd.to_numeric(r[k], errors='coerce')
                        break
                if a is None or pd.isna(a) or a == 0:
                    # estimate from period assuming M~1 Msun
                    a = (P / 365.25) ** (2.0/3.0)

                if a is None or pd.isna(a) or a == 0:
                    return None

                with np.errstate(invalid='ignore', divide='ignore'):
                    duration_days = (P / math.pi) * (Rs_AU / a)
                    duration_hours = duration_days * 24.0
                    if not np.isfinite(duration_hours):
                        return None
                    return float(duration_hours)
            except Exception:
                return None

        def safe_float(val, field_name, default=None):
            # Helper to convert pandas/numpy values and NaN/inf into JSON-friendly types
            def make_json_safe(o):
                # dicts and lists: recurse
                if isinstance(o, dict):
                    return {k: make_json_safe(v) for k, v in o.items()}
                if isinstance(o, (list, tuple)):
                    return [make_json_safe(v) for v in o]
                # numpy / pandas scalars
                if isinstance(o, (np.integer,)):
                    return int(o)
                if isinstance(o, (np.floating,)):
                    v = float(o)
                    if math.isnan(v) or math.isinf(v):
                        return None
                    return v
                # plain python floats
                if isinstance(o, float):
                    if math.isnan(o) or math.isinf(o):
                        return None
                    return o
                # pandas/Numpy NA
                try:
                    if pd.isna(o):
                        return None
                except Exception:
                    pass
                # keep simple json-native types, otherwise stringify
                try:
                    json.dumps(o)
                    return o
                except Exception:
                    return str(o)

            # Treat None, empty string, and NaN as missing values
            if val is None or val == '' or (isinstance(val, float) and np.isnan(val)):
                # attempt to compute fallback for certain fields
                if field_name == 'transit_depth':
                    computed = compute_transit_depth_from_row(row)
                    if computed is not None:
                        return float(computed)
                if field_name == 'transit_duration':
                    computed = compute_transit_duration_from_row(row)
                    if computed is not None:
                        return float(computed)

                if default is not None:
                    return float(default)
                raise HTTPException(status_code=400, detail={
                    "error": "missing_value",
                    "field": field_name,
                    "row_sample": make_json_safe(row.to_dict())
                })
            try:
                return float(val)
            except Exception:
                raise HTTPException(status_code=400, detail={
                    "error": "invalid_number",
                    "field": field_name,
                    "value": make_json_safe(val),
                    "row_sample": make_json_safe(row.to_dict())
                })

        # Crear request basado en el tipo de modelo detectado
        if model_type == 'k2':
            # Para K2, no necesitamos transit_duration ni transit_depth
            request = AnalysisRequest(
                orbital_period=safe_float(row.get('orbital_period'), 'orbital_period'),
                transit_duration=None,  # K2 no usa transit_duration
                transit_depth=None,     # K2 no usa transit_depth
                stellar_radius=safe_float(row.get('stellar_radius'), 'stellar_radius'),
                stellar_mass=safe_float(row.get('stellar_mass', 1.0), 'stellar_mass', default=1.0),
                stellar_temperature=safe_float(row.get('stellar_temperature', 5778.0), 'stellar_temperature', default=5778.0)
            )
        else:
            # Para Kepler y TESS, usar valores normales
            request = AnalysisRequest(
                orbital_period=safe_float(row.get('orbital_period'), 'orbital_period'),
                transit_duration=safe_float(row.get('transit_duration'), 'transit_duration'),
                transit_depth=safe_float(row.get('transit_depth'), 'transit_depth'),
                stellar_radius=safe_float(row.get('stellar_radius'), 'stellar_radius'),
                stellar_mass=safe_float(row.get('stellar_mass', 1.0), 'stellar_mass', default=1.0),
                stellar_temperature=safe_float(row.get('stellar_temperature', 5778.0), 'stellar_temperature', default=5778.0)
            )
        
        # Detectar automáticamente el tipo de modelo basado en las columnas del CSV
        model_type = detect_model_type(df)
        print(f"🔍 Detected model type: {model_type.upper()} from CSV columns")
        
        # Crear request para predict-with-model
        model_request = AnalysisRequest(
            orbital_period=request.orbital_period,
            transit_duration=request.transit_duration,
            transit_depth=request.transit_depth,
            stellar_radius=request.stellar_radius,
            stellar_mass=request.stellar_mass,
            stellar_temperature=request.stellar_temperature
        )
        
        return await predict_with_model(model_request, model_type)
        
    except HTTPException:
        # Re-raise HTTP errors (bad request, etc.) so the client sees proper status codes
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error procesando archivo: {str(e)}")


@router.get('/sample')
async def get_sample_csv():
    """Return a small sample of the CSV located in the project root (first 50 rows).
    Tries a few likely paths relative to the backend working directory.
    """
    candidates = [
        os.path.join(os.getcwd(), '..', 'cumulative_2025.10.04_18.03.20.csv'),
        os.path.join(os.getcwd(), '..', '..', 'cumulative_2025.10.04_18.03.20.csv'),
        os.path.join(os.getcwd(), 'cumulative_2025.10.04_18.03.20.csv'),
        os.path.join(os.getcwd(), '..', 'data', 'cumulative_2025.10.04_18.03.20.csv')
    ]

    found = None
    for p in candidates:
        if os.path.exists(p):
            found = p
            break

    if not found:
        raise HTTPException(status_code=404, detail="Sample CSV not found in workspace root")

    # Try multiple strategies to read possibly malformed CSV files
    try:
        try:
            df = pd.read_csv(found)
        except Exception:
            # fallback: let python engine guess the separator and skip bad lines
            df = pd.read_csv(found, sep=None, engine='python', on_bad_lines='skip')

        # Return first 50 rows as records (safe types)
        sample = df.head(50).fillna('').to_dict(orient='records')
        return {"rows": sample}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error leyendo sample CSV: {str(e)}")

def detect_model_type(df):
    """
    Detecta el tipo de modelo basado en las columnas del CSV.
    """
    columns_lower = [col.lower() for col in df.columns]
    columns_str = ' '.join(columns_lower)
    
    print(f"🔍 Detectando modelo para columnas: {list(df.columns)}")
    
    # Detectar K2 - tiene columnas específicas como 'v_mag', 'star_mass' y NO tiene 'tess_mag'
    k2_indicators = ['v_mag', 'star_mass']
    if any(indicator in columns_str for indicator in k2_indicators) and 'tess_mag' not in columns_str:
        print("✅ Detectado: K2")
        return "k2"
    
    # Detectar TESS - tiene columnas específicas como 'tess_mag'
    tess_indicators = ['tess_mag']
    if any(indicator in columns_str for indicator in tess_indicators):
        print("✅ Detectado: TESS")
        return "tess"
    
    # Detectar Kepler - tiene columnas como 'duration', 'impact_parameter', 'snr' pero NO 'v_mag' ni 'tess_mag'
    kepler_indicators = ['duration', 'impact_parameter', 'snr']
    if any(indicator in columns_str for indicator in kepler_indicators) and 'v_mag' not in columns_str and 'tess_mag' not in columns_str:
        print("✅ Detectado: Kepler")
        return "kepler"
    
    # Por defecto, usar Kepler
    print("⚠️ No detectado específicamente, usando Kepler por defecto")
    return "kepler"

def dummy_prediction(features):
    """
    Función dummy para predicciones cuando no hay modelo entrenado.
    """
    orbital_period, transit_duration, transit_depth, stellar_radius, stellar_mass, stellar_temp = features
    
    # Lógica simple basada en reglas (manejar valores None)
    transit_depth = transit_depth or 0.0
    transit_duration = transit_duration or 0.0
    
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


### New: model selection and template endpoints
REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
# MODEL_DIR should point to the repository-level 'modelo_final' directory
MODEL_DIR = os.path.join(REPO_ROOT, 'modelo_final')

MODEL_INFO = {
    "kepler": {
        "model_files": [os.path.join(MODEL_DIR, 'modelo_kepler.joblib')],
        "csv_templates": [os.path.join(MODEL_DIR, 'kepler.csv')]
    },
    "k2": {
        "model_files": [os.path.join(MODEL_DIR, 'modelo_k2.joblib')],
        "csv_templates": [os.path.join(MODEL_DIR, 'k2.csv')]
    },
    "tess": {
        "model_files": [os.path.join(MODEL_DIR, 'modelo_tess.joblib')],
        "csv_templates": [os.path.join(MODEL_DIR, 'tess.csv')]
    }
}


def locate_first_existing(paths):
    for p in paths:
        if os.path.exists(p):
            return p
    return None


def load_joblib_for_model(name: str):
    info = MODEL_INFO.get(name.lower())
    if not info:
        return None
    path = locate_first_existing(info.get('model_files', []))
    if path:
        try:
            return joblib.load(path)
        except Exception:
            return None
    return None

def predict_with_real_model(model_dict, features_dict):
    """
    Usa los modelos reales entrenados para hacer predicciones.
    """
    try:
        # Usar el modelo multiclase para predicción principal
        multiclase_model = model_dict['modelos']['multiclase']
        scaler = model_dict['scalers']['multiclase']
        feature_names = model_dict['features']['multiclase']
        
        # Crear array con las características en el orden correcto
        feature_array = []
        for feature_name in feature_names:
            if feature_name in features_dict and features_dict[feature_name] is not None:
                feature_array.append(features_dict[feature_name])
            else:
                # Usar valores por defecto específicos para cada característica
                # Obtener el tipo de modelo para calcular ratios específicos
                model_type = None
                if 'v_mag' in features_dict and 'star_mass' in features_dict:
                    model_type = 'k2'
                elif 'tess_mag' in features_dict:
                    model_type = 'tess'
                elif 'snr' in features_dict or 'impact_parameter' in features_dict:
                    model_type = 'kepler'
                
                default_values = {
                    'period': features_dict.get('period', 10.0),
                    'duration': features_dict.get('duration', 2.0),
                    'depth': features_dict.get('depth', 0.002),
                    'radius': features_dict.get('radius', 1.0),
                    'teq': 300.0,  # Temperatura de equilibrio estimada
                    'star_radius': features_dict.get('star_radius', 1.0),
                    'star_mass': features_dict.get('star_mass', 1.0),
                    'logg': 4.5,   # Gravedad superficial estándar
                    'impact_parameter': 0.0,  # Parámetro de impacto
                    'insolation': 1000.0,  # Insolación
                    'star_teff': features_dict.get('stellar_temperature', 5800.0),
                    'v_mag': 12.0,  # Magnitud visual
                    'tess_mag': 11.0,  # Magnitud TESS
                    'snr': 10.0,   # Signal-to-noise ratio
                    'transit_snr': 10.0,  # Transit SNR
                    'radius_ratio': features_dict.get('radius', 1.0) / max(features_dict.get('star_radius', 1.0) or 1.0, 0.1)
                }
                
                # Calcular ratios específicos por modelo
                if model_type == 'k2':
                    # K2 no tiene duration ni depth, usar valores por defecto
                    default_values['period_duration_ratio'] = 5.0  # Valor por defecto
                    default_values['depth_duration_ratio'] = 0.001  # Valor por defecto
                else:
                    # Para TESS y Kepler, calcular ratios normalmente
                    duration = max(features_dict.get('duration', 2.0) or 2.0, 0.1)
                    default_values['period_duration_ratio'] = features_dict.get('period', 10.0) / duration
                    default_values['depth_duration_ratio'] = (features_dict.get('depth', 0.002) or 0.002) / duration
                feature_array.append(default_values.get(feature_name, 0.0))
        
        import numpy as np
        X = np.array(feature_array).reshape(1, -1)
        
        # Escalar las características
        X_scaled = scaler.transform(X)
        
        # Hacer predicción
        prediction = multiclase_model.predict(X_scaled)[0]
        probabilities = multiclase_model.predict_proba(X_scaled)[0]
        
        # Mapear las clases a los nombres correctos
        class_mapping = {
            'CONFIRMED': 'exoplanet',
            'CANDIDATE': 'candidate', 
            'FALSE POSITIVE': 'false_positive'
        }
        
        prediction_mapped = class_mapping.get(prediction, 'candidate')
        confidence = float(max(probabilities))
        
        # Crear distribución de probabilidades
        prob_dist = {}
        for i, prob in enumerate(probabilities):
            class_name = multiclase_model.classes_[i]
            mapped_name = class_mapping.get(class_name, 'candidate')
            prob_dist[mapped_name] = float(prob)
        
        return prediction_mapped, confidence, prob_dist
        
    except Exception as e:
        print(f"Error usando modelo real: {e}")
        return None, None, None


def map_row_to_features(row: Dict[str, Any]) -> Dict[str, float]:
    # Try common column names and do simple unit conversions
    def get_val(keys, default=0.0):
        for k in keys:
            if k in row and row[k] not in (None, ''):
                try:
                    return float(str(row[k]).strip())
                except Exception:
                    return default
        return default

    orbital = get_val(['orbital_period', 'koi_period', 'period', 'kep_period'])
    duration = get_val(['transit_duration', 'koi_duration', 'duration'])
    depth = get_val(['transit_depth', 'koi_depth', 'depth'])
    stellar_radius = get_val(['stellar_radius', 'koi_srad', 'srad', 'stellar_radius_rsun', 'koi_srad_err1'])

    # If depth looks large (ppm), convert to fraction
    if depth > 1.0:
        # assume ppm
        depth = depth / 1e6

    return {
        'orbital_period': orbital,
        'transit_duration': duration,
        'transit_depth': depth,
        'stellar_radius': stellar_radius,
        'stellar_mass': get_val(['stellar_mass', 'koi_smass', 'smass'], 1.0),
        'stellar_temperature': get_val(['stellar_temperature', 'koi_steff', 'teff'], 5778.0)
    }


@router.get('/models')
async def list_models():
    """Return available model names and a short description."""
    return {"models": list(MODEL_INFO.keys())}


@router.get('/_debug_paths')
async def debug_paths():
    info = {}
    info['model_dir'] = MODEL_DIR
    for k, v in MODEL_INFO.items():
        info[k] = {'model_files': [], 'csv_templates': []}
        for p in v.get('model_files', []):
            info[k]['model_files'].append({'path': p, 'exists': os.path.exists(p)})
        for p in v.get('csv_templates', []):
            info[k]['csv_templates'].append({'path': p, 'exists': os.path.exists(p)})
    return info


@router.get('/template/{model_name}')
async def download_template(model_name: str):
    """Download a CSV template for the specified model with the exact features it needs."""
    info = MODEL_INFO.get(model_name.lower())
    if not info:
        raise HTTPException(status_code=404, detail=f"Model {model_name} not found")
    
    # Cargar el modelo para obtener las características exactas
    model_dict = load_joblib_for_model(model_name)
    if not model_dict:
        raise HTTPException(status_code=500, detail=f"Could not load model {model_name}")
    
    try:
        # Obtener las características del modelo multiclase
        features = model_dict['features']['multiclase']
        
        # Crear plantilla CSV con las características exactas
        template_content = create_model_specific_template(model_name, features)
        
        # Return as downloadable file
        from fastapi.responses import Response
        return Response(
            content=template_content,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=template_{model_name}.csv"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating template: {str(e)}")

def create_model_specific_template(model_name: str, features: list) -> str:
    """Crear plantilla CSV específica para cada modelo con valores de ejemplo"""
    
    # Valores de ejemplo específicos para cada modelo
    example_values = {
        'kepler': {
            'period': 10.5,
            'duration': 2.3,
            'depth': 0.0015,
            'radius': 1.2,
            'teq': 300.0,
            'star_radius': 0.95,
            'logg': 4.4,
            'impact_parameter': 0.1,
            'insolation': 1200.0,
            'snr': 15.0,
            'period_duration_ratio': 4.57,
            'transit_snr': 12.0,
            'depth_duration_ratio': 0.00065,
            'radius_ratio': 1.26
        },
        'k2': {
            'period': 10.5,
            'radius': 1.2,
            'teq': 300.0,
            'star_radius': 0.95,
            'star_mass': 0.98,
            'logg': 4.4,
            'insolation': 1200.0,
            'star_teff': 5800.0,
            'v_mag': 12.5,
            'radius_ratio': 1.26
        },
        'tess': {
            'period': 10.5,
            'duration': 2.3,
            'depth': 0.0015,
            'radius': 1.2,
            'teq': 300.0,
            'star_radius': 0.95,
            'logg': 4.4,
            'insolation': 1200.0,
            'star_teff': 5800.0,
            'tess_mag': 11.2,
            'period_duration_ratio': 4.57,
            'transit_snr': 12.0,
            'depth_duration_ratio': 0.00065,
            'radius_ratio': 1.26
        }
    }
    
    # Obtener valores de ejemplo para este modelo
    values = example_values.get(model_name, {})
    
    # Crear contenido CSV
    lines = []
    
    # Header con las características exactas
    lines.append(','.join(features))
    
    # Fila de ejemplo con valores
    example_row = []
    for feature in features:
        value = values.get(feature, 0.0)
        example_row.append(str(value))
    lines.append(','.join(example_row))
    
    # Fila vacía para que el usuario llene
    empty_row = [''] * len(features)
    lines.append(','.join(empty_row))
    
    return '\n'.join(lines)


@router.post('/_debug_preview')
async def debug_preview_file(file: UploadFile = File(...)):
    """Debug endpoint: returns how the server parses an uploaded CSV (columns, header, sample rows).
    Temporary helper for debugging client CSV uploads.
    """
    try:
        if not file.filename.endswith('.csv'):
            raise HTTPException(status_code=400, detail="Solo se permiten archivos CSV")

        contents = await file.read()
        text = contents.decode('utf-8', errors='replace')

        # Preprocess same as upload
        lines = text.splitlines()
        start = 0
        while start < len(lines) and (lines[start].strip() == '' or lines[start].lstrip().startswith('#')):
            start += 1

        header_idx = None
        window_end = min(len(lines), start + 20)
        lower_lines = [l.lower() for l in lines]
        for j in range(start, window_end):
            l = lower_lines[j]
            if ',' in l or '\t' in l or any(col in l for col in ["orbital_period", "transit_duration", "transit_depth", "stellar_radius"]):
                header_idx = j
                break
        if header_idx is None:
            header_idx = start

        cleaned_text = '\n'.join(lines[header_idx:])

        try:
            df = pd.read_csv(io.StringIO(cleaned_text))
        except Exception:
            df = pd.read_csv(io.StringIO(cleaned_text), sep=None, engine='python', on_bad_lines='skip')

        original_columns = list(df.columns)

        # Build rename_map using same alias logic
        alias_map = {
            'orbital_period': ['orbital_period', 'koi_period', 'period', 'kep_period', 'kepoi_period', 'pl_orbper', 'orbper', 'per'],
            'transit_duration': ['transit_duration', 'koi_duration', 'duration', 'koi_time0bk', 'pl_trandurh', 'pl_trandur', 'trandur'],
            'transit_depth': ['transit_depth', 'koi_depth', 'depth', 'pl_trandep', 'pl_trande'],
            # Do NOT map planet radius (pl_rade) to stellar_radius here
            'stellar_radius': ['stellar_radius', 'koi_srad', 'srad', 'st_rad', 'prad']
        }

        rename_map = {}
        lower_to_col = {c.lower(): c for c in df.columns}
        for canonical, aliases in alias_map.items():
            found = None
            for a in aliases:
                if a.lower() in lower_to_col:
                    found = lower_to_col[a.lower()]
                    break
            if found:
                rename_map[found] = canonical

        # apply rename_map copy
        df_renamed = df.rename(columns=rename_map) if rename_map else df.copy()

        # permissive substring fallback
        final_map = {}
        lower_to_col = {c.lower(): c for c in df_renamed.columns}
        keyword_map = {
            'orbital_period': ['orbper', 'orb', 'period', 'per'],
            'transit_duration': ['trandur', 'duration', 'dur', 'tran'],
            'transit_depth': ['trandep', 'depth', 'dep'],
            'stellar_radius': ['srad', 'rade', 'rad', 'st_rad', 'prad']
        }
        for canonical, keywords in keyword_map.items():
            if canonical in df_renamed.columns:
                continue
            found_col = None
            for lower_name, orig in lower_to_col.items():
                if any(k in lower_name for k in keywords):
                    found_col = orig
                    break
            if found_col:
                final_map[found_col] = canonical

        df_final = df_renamed.rename(columns=final_map) if final_map else df_renamed

        return {
            'original_filename': file.filename,
            'header_line_index': header_idx,
            'header_line_preview': lines[header_idx] if header_idx < len(lines) else '',
            'original_columns': original_columns,
            'rename_map': rename_map,
            'final_map': final_map,
            'final_columns': list(df_final.columns)[:100],
            'sample_rows': df_final.head(5).fillna('').to_dict(orient='records')
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Debug preview error: {str(e)}")


@router.post('/predict-with-model', response_model=AnalysisResponse)
async def predict_with_model(request: AnalysisRequest, model: Optional[str] = None):
    """Predict using a specific model (kepler/k2/tess). If model not found, fallback to default behavior."""
    # Try to load the named model; if missing, fallback to current loaded model
    selected_model = None
    model_info = "No model specified"
    if model:
        selected_model = load_joblib_for_model(model)
        if selected_model:
            model_info = f"Using {model.upper()} model from modelo_final/"
            print(f"🤖 {model_info}")
        else:
            model_info = f"Model {model.upper()} not found, using fallback"
            print(f"⚠️ {model_info}")

    try:
        features = np.array([
            request.orbital_period,
            request.transit_duration,
            request.transit_depth,
            request.stellar_radius,
            request.stellar_mass or 1.0,
            request.stellar_temperature or 5778.0
        ]).reshape(1, -1)

        if selected_model is None:
            # try the global model variable (existing behavior)
            if model is None and model is not None:
                selected_model = model
        if selected_model is None and model is not None:
            # If the requested model couldn't be loaded, return error
            raise HTTPException(status_code=500, detail=f"Modelo solicitado '{model}' no disponible en el servidor")

        if selected_model is None and model is None and model is None:
            # fall back to existing global model
            pass

        # Use selected_model if available, else fall back to global model variable
        if selected_model is not None:
            try:
                # Usar el modelo real con las características correctas
                features_dict = {
                    'period': request.orbital_period,
                    'duration': request.transit_duration,
                    'depth': request.transit_depth,
                    'radius': request.stellar_radius,
                    'star_radius': request.stellar_radius,
                    'stellar_mass': request.stellar_mass or 1.0,
                    'stellar_temperature': request.stellar_temperature or 5778.0
                }
                
                prediction, confidence, prob_dist = predict_with_real_model(selected_model, features_dict)
                
                if prediction is None:
                    # Fallback to dummy if real model fails
                    prediction, confidence, prob_dist = dummy_prediction(features[0])
                    print("⚠️ Modelo real falló, usando dummy")
                else:
                    print(f"✅ Usando modelo real: {prediction} (confianza: {confidence:.2%})")
                    
            except Exception as e:
                print(f"Error con modelo real: {e}")
                # In case the custom model API differs, fallback to dummy
                prediction, confidence, prob_dist = dummy_prediction(features[0])
        else:
            # Use existing predict_exoplanet behavior (global model or dummy)
            return await predict_exoplanet(request)

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

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en predict-with-model: {str(e)}")


@router.post('/predict-batch')
async def predict_batch(file: UploadFile = File(...), model: Optional[str] = None):
    """Process an uploaded CSV and return predictions for each row using the selected model.
    The uploaded CSV can have different column names; we try to map common 'koi_*' columns.
    """
    try:
        if not file.filename.endswith('.csv'):
            raise HTTPException(status_code=400, detail="Solo se permiten archivos CSV")

        contents = await file.read()
        text = contents.decode('utf-8', errors='replace')
        try:
            df = pd.read_csv(io.StringIO(text))
        except Exception:
            df = pd.read_csv(io.StringIO(text), sep=None, engine='python', on_bad_lines='skip')

        if df.shape[0] == 0:
            raise HTTPException(status_code=400, detail="CSV vacío")

        # Load selected model
        selected_model = None
        if model:
            selected_model = load_joblib_for_model(model)

        results = []
        for _, row in df.iterrows():
            mapped = map_row_to_features(row)
            # Build AnalysisRequest-like object
            req = AnalysisRequest(
                orbital_period=mapped['orbital_period'],
                transit_duration=mapped['transit_duration'],
                transit_depth=mapped['transit_depth'],
                stellar_radius=mapped['stellar_radius'],
                stellar_mass=mapped.get('stellar_mass', 1.0),
                stellar_temperature=mapped.get('stellar_temperature', 5778.0)
            )

            # Predict
            if selected_model is not None:
                try:
                    feats = np.array([req.orbital_period, req.transit_duration, req.transit_depth, req.stellar_radius, req.stellar_mass or 1.0, req.stellar_temperature or 5778.0]).reshape(1, -1)
                    pred = selected_model.predict(feats)[0]
                    probs = selected_model.predict_proba(feats)[0]
                    confidence = float(max(probs))
                    prob_dist = {"exoplanet": float(probs[0]), "candidate": float(probs[1]), "false_positive": float(probs[2])}
                except Exception:
                    pred, confidence, prob_dist = dummy_prediction([req.orbital_period, req.transit_duration, req.transit_depth, req.stellar_radius, req.stellar_mass or 1.0, req.stellar_temperature or 5778.0])
            else:
                # fallback to global model/dummy
                if model is None:
                    # use existing predict_exoplanet behavior
                    pred_resp = await predict_exoplanet(req)
                    pred = pred_resp.prediction
                    confidence = pred_resp.confidence
                    prob_dist = pred_resp.probability_distribution
                else:
                    pred, confidence, prob_dist = dummy_prediction([req.orbital_period, req.transit_duration, req.transit_depth, req.stellar_radius, req.stellar_mass or 1.0, req.stellar_temperature or 5778.0])

            results.append({
                "input": mapped,
                "prediction": pred,
                "confidence": confidence,
                "probability_distribution": prob_dist
            })

        return {"rows": results}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en predict-batch: {str(e)}")

