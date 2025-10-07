from fastapi import APIRouter, HTTPException
from typing import Dict, List, Any
from ..api import analysis as analysis_api
import asyncio
from pydantic import BaseModel
import json
import os
import io
import joblib
import pandas as pd
import numpy as np
import math

router = APIRouter()

class DashboardStats(BaseModel):
    total_exoplanets: int
    total_candidates: int
    total_false_positives: int
    total_discoveries: int
    model_accuracy: float
    model_precision: float
    model_recall: float
    model_f1_score: float
    predicted_counts: dict | None = None

class MissionData(BaseModel):
    mission: str
    exoplanets: int
    candidates: int
    false_positives: int
    total_discoveries: int
    predicted_counts: dict | None = None

class DiscoveryTrend(BaseModel):
    year: str
    discoveries: int

@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats():
    """
    Obtiene estadísticas generales del sistema.
    """
    try:
        # Determine repository/model directory
        repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
        model_dir = os.path.join(repo_root, 'modelo_final')

        # helper to read CSV skipping leading comment lines
        def read_csv_skip_comments(path):
            with open(path, 'r', encoding='utf-8', errors='replace') as fh:
                lines = fh.readlines()
            start = 0
            while start < len(lines) and (lines[start].strip() == '' or lines[start].lstrip().startswith('#')):
                start += 1
            cleaned = ''.join(lines[start:])
            try:
                return pd.read_csv(io.StringIO(cleaned))
            except Exception:
                return pd.read_csv(io.StringIO(cleaned), sep=None, engine='python', on_bad_lines='skip')

        totals = {'exoplanet': 0, 'candidate': 0, 'false_positive': 0}
        predicted_totals = {'exoplanet': 0, 'candidate': 0, 'false_positive': 0}
        missions = []
        for tel, fname in [('Kepler', 'kepler.csv'), ('K2', 'k2.csv'), ('TESS', 'tess.csv')]:
            csvpath = os.path.join(model_dir, fname)
            if not os.path.exists(csvpath):
                missions.append({
                    'mission': tel,
                    'exoplanets': 0,
                    'candidates': 0,
                    'false_positives': 0,
                    'total_discoveries': 0
                })
                continue
            df = read_csv_skip_comments(csvpath)
            # normalize disposition column
            disposition_col = None
            for c in df.columns:
                lc = c.lower()
                if 'disposition' in lc or 'disp' in lc:
                    disposition_col = c
                    break
            if disposition_col is None:
                # fallback: no dispositions available
                exo = cand = fp = 0
            else:
                vals = df[disposition_col].astype(str).str.upper().fillna('').str.strip()
                # Normalize common catalog codes (TESS TFOPWG uses PC/FP/KP/CP)
                # and other variants to our canonical labels used in training.
                def normalize_disp(s):
                    if not s or s == 'NAN':
                        return ''
                    # direct exact mappings
                    if s in ('CONFIRMED', 'CONFIRMED_PLANET', 'CP'):
                        return 'CONFIRMED'
                    if s in ('CANDIDATE', 'PC', 'PC?'):
                        return 'CANDIDATE'
                    if s in ('FALSE POSITIVE', 'FALSE_POSITIVE', 'FP'):
                        return 'FALSE POSITIVE'
                    # common short codes
                    if s == 'KP':
                        return 'CONFIRMED'
                    # if contains keywords
                    if 'FALSE' in s:
                        return 'FALSE POSITIVE'
                    if 'CANDID' in s or s == 'PC':
                        return 'CANDIDATE'
                    if 'CONFIR' in s or s == 'CP':
                        return 'CONFIRMED'
                    return s

                mapped = vals.map(normalize_disp)
                exo = int((mapped == 'CONFIRMED').sum())
                cand = int((mapped == 'CANDIDATE').sum())
                fp = int((mapped == 'FALSE POSITIVE').sum())
            total_rows = int(len(df))
            # compute predicted counts by running the same mapping+prediction used in analysis.upload
            predicted = {'exoplanet': 0, 'candidate': 0, 'false_positive': 0}
            try:
                # iterate rows and map to features
                for idx, row in df.iterrows():
                    orig = row.to_dict()
                    mapped = analysis_api.map_row_to_features(orig)
                    # build a request-like dict to call predict_exoplanet
                    try:
                        # reuse the analysis.predict_exoplanet function (async)
                        class _Req:
                            pass
                        req = _Req()
                        req.orbital_period = float(mapped.get('orbital_period', 0.0))
                        req.transit_duration = float(mapped.get('transit_duration', 0.0))
                        req.transit_depth = float(mapped.get('transit_depth', 0.0))
                        req.stellar_radius = float(mapped.get('stellar_radius', 1.0))
                        req.stellar_mass = float(mapped.get('stellar_mass', 1.0)) if mapped.get('stellar_mass') is not None else 1.0
                        req.stellar_temperature = float(mapped.get('stellar_temperature', 5778.0)) if mapped.get('stellar_temperature') is not None else 5778.0
                        # call the async prediction (use asyncio run if outside event loop)
                        try:
                            pred_resp = asyncio.get_event_loop().run_until_complete(analysis_api.predict_exoplanet(req))
                        except RuntimeError:
                            # if already in event loop, use asyncio.run
                            pred_resp = asyncio.run(analysis_api.predict_exoplanet(req))
                        pred = getattr(pred_resp, 'prediction', None)
                        if pred == 'exoplanet': predicted['exoplanet'] += 1
                        elif pred == 'candidate': predicted['candidate'] += 1
                        elif pred == 'false_positive': predicted['false_positive'] += 1
                    except Exception:
                        continue
            except Exception:
                predicted = {'exoplanet': 0, 'candidate': 0, 'false_positive': 0}

            missions.append({
                'mission': tel,
                'exoplanets': exo,
                'candidates': cand,
                'false_positives': fp,
                'total_discoveries': total_rows,
                'predicted_counts': predicted
            })
            totals['exoplanet'] += exo
            totals['candidate'] += cand
            totals['false_positive'] += fp
            # also accumulate total rows for overall discovery count
            totals.setdefault('rows', 0)
            totals['rows'] = totals.get('rows', 0) + total_rows

        # Load model artifacts and aggregate multiclase metrics
        metrics_list = []
        for tel in ['kepler', 'k2', 'tess']:
            model_file = os.path.join(model_dir, f'modelo_{tel}.joblib')
            if not os.path.exists(model_file):
                continue
            try:
                data = joblib.load(model_file)
                m = data.get('metricas', {}).get('multiclase')
                if m:
                    metrics_list.append(m)
            except Exception:
                continue

        # compute average metrics if available
        if metrics_list:
            acc = float(np.mean([m.get('accuracy', 0.0) for m in metrics_list]))
            prec = float(np.mean([m.get('precision', m.get('f1_score', 0.0)) if 'precision' in m else m.get('f1_score', 0.0) for m in metrics_list]))
            rec = float(np.mean([m.get('recall', m.get('f1_score', 0.0)) if 'recall' in m else m.get('f1_score', 0.0) for m in metrics_list]))
            f1 = float(np.mean([m.get('f1_score', 0.0) for m in metrics_list]))
        else:
            acc = prec = rec = f1 = 0.0

        # Build stats payload
        stats = {
            'total_exoplanets': int(totals['exoplanet']),
            'total_candidates': int(totals['candidate']),
            'total_false_positives': int(totals['false_positive']),
            'total_discoveries': int(totals.get('rows', 0)),
            'model_accuracy': acc,
            'model_precision': prec,
            'model_recall': rec,
            'model_f1_score': f1
        }

        # If missions were augmented with predicted_counts (new field), sum them and include in stats
        for m in missions:
            pc = m.get('predicted_counts')
            if isinstance(pc, dict):
                predicted_totals['exoplanet'] += int(pc.get('exoplanet', 0))
                predicted_totals['candidate'] += int(pc.get('candidate', 0))
                predicted_totals['false_positive'] += int(pc.get('false_positive', 0))

        stats['predicted_counts'] = {
            'exoplanet': int(predicted_totals['exoplanet']),
            'candidate': int(predicted_totals['candidate']),
            'false_positive': int(predicted_totals['false_positive'])
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
        # Reuse logic from /stats to compute counts per mission
        repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
        model_dir = os.path.join(repo_root, 'modelo_final')

        def read_csv_skip_comments(path):
            with open(path, 'r', encoding='utf-8', errors='replace') as fh:
                lines = fh.readlines()
            start = 0
            while start < len(lines) and (lines[start].strip() == '' or lines[start].lstrip().startswith('#')):
                start += 1
            cleaned = ''.join(lines[start:])
            try:
                return pd.read_csv(io.StringIO(cleaned))
            except Exception:
                return pd.read_csv(io.StringIO(cleaned), sep=None, engine='python', on_bad_lines='skip')

        missions = []
        for tel, fname in [('Kepler', 'kepler.csv'), ('K2', 'k2.csv'), ('TESS', 'tess.csv')]:
            csvpath = os.path.join(model_dir, fname)
            if not os.path.exists(csvpath):
                missions.append({
                    'mission': tel,
                    'exoplanets': 0,
                    'candidates': 0,
                    'false_positives': 0,
                    'total_discoveries': 0
                })
                continue
            df = read_csv_skip_comments(csvpath)
            disposition_col = None
            for c in df.columns:
                lc = c.lower()
                if 'disposition' in lc or 'disp' in lc:
                    disposition_col = c
                    break
            if disposition_col is None:
                exo = cand = fp = 0
            else:
                vals = df[disposition_col].astype(str).str.upper().fillna('').str.strip()
                def normalize_disp(s):
                    if not s or s == 'NAN':
                        return ''
                    if s in ('CONFIRMED', 'CONFIRMED_PLANET', 'CP'):
                        return 'CONFIRMED'
                    if s in ('CANDIDATE', 'PC', 'PC?'):
                        return 'CANDIDATE'
                    if s in ('FALSE POSITIVE', 'FALSE_POSITIVE', 'FP'):
                        return 'FALSE POSITIVE'
                    if s == 'KP':
                        return 'CONFIRMED'
                    if 'FALSE' in s:
                        return 'FALSE POSITIVE'
                    if 'CANDID' in s or s == 'PC':
                        return 'CANDIDATE'
                    if 'CONFIR' in s or s == 'CP':
                        return 'CONFIRMED'
                    return s

                mapped = vals.map(normalize_disp)
                exo = int((mapped == 'CONFIRMED').sum())
                cand = int((mapped == 'CANDIDATE').sum())
                fp = int((mapped == 'FALSE POSITIVE').sum())
            total_rows = int(len(df))
            # compute predicted_counts for this mission using analysis.predict_exoplanet
            predicted = {'exoplanet': 0, 'candidate': 0, 'false_positive': 0}
            try:
                for idx, row in df.iterrows():
                    orig = row.to_dict()
                    mapped = analysis_api.map_row_to_features(orig)
                    try:
                        req = analysis_api.AnalysisRequest(
                            orbital_period=float(mapped.get('orbital_period', 0.0)),
                            transit_duration=float(mapped.get('transit_duration', 0.0)),
                            transit_depth=float(mapped.get('transit_depth', 0.0)),
                            stellar_radius=float(mapped.get('stellar_radius', 1.0)),
                            stellar_mass=float(mapped.get('stellar_mass', 1.0)) if mapped.get('stellar_mass') is not None else None,
                            stellar_temperature=float(mapped.get('stellar_temperature', 5778.0)) if mapped.get('stellar_temperature') is not None else None
                        )
                        resp = await analysis_api.predict_exoplanet(req)
                        pred = getattr(resp, 'prediction', None)
                        if pred == 'exoplanet': predicted['exoplanet'] += 1
                        elif pred == 'candidate': predicted['candidate'] += 1
                        elif pred == 'false_positive': predicted['false_positive'] += 1
                    except Exception:
                        continue
            except Exception:
                predicted = {'exoplanet': 0, 'candidate': 0, 'false_positive': 0}

            missions.append({
                'mission': tel,
                'exoplanets': exo,
                'candidates': cand,
                'false_positives': fp,
                'total_discoveries': total_rows,
                'predicted_counts': predicted
            })

        return [MissionData(**m) for m in missions]

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo datos de misiones: {str(e)}")

@router.get("/trends", response_model=List[DiscoveryTrend])
async def get_discovery_trends():
    """
    Obtiene tendencias de descubrimientos por año.
    """
    try:
        repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
        model_dir = os.path.join(repo_root, 'modelo_final')

        def read_csv_skip_comments(path):
            with open(path, 'r', encoding='utf-8', errors='replace') as fh:
                lines = fh.readlines()
            start = 0
            while start < len(lines) and (lines[start].strip() == '' or lines[start].lstrip().startswith('#')):
                start += 1
            cleaned = ''.join(lines[start:])
            try:
                return pd.read_csv(io.StringIO(cleaned))
            except Exception:
                return pd.read_csv(io.StringIO(cleaned), sep=None, engine='python', on_bad_lines='skip')

        by_year = {}
        for fname in ['kepler.csv', 'k2.csv', 'tess.csv']:
            csvpath = os.path.join(model_dir, fname)
            if not os.path.exists(csvpath):
                continue
            df = read_csv_skip_comments(csvpath)
            # try common year columns
            year_col = None
            for c in df.columns:
                lc = c.lower()
                if lc in ('disc_year', 'discovery_year', 'year'):
                    year_col = c
                    break
            if year_col:
                # Coerce to numeric first to avoid strange string/date parsing
                yrs = pd.to_numeric(df[year_col], errors='coerce').dropna().astype(int)
                for y in yrs:
                    by_year[y] = by_year.get(y, 0) + 1
            else:
                # try to extract year from any date-like column
                for c in df.columns:
                    if 'date' in c.lower() or 'time' in c.lower() or 'epoch' in c.lower():
                        try:
                            dates = pd.to_datetime(df[c], errors='coerce')
                            years = dates.dt.year.dropna().astype(int)
                            for y in years:
                                by_year[y] = by_year.get(y, 0) + 1
                            break
                        except Exception:
                            continue
        # Filter out implausible years that can appear from epoch parsing or bad data
        current_year = pd.Timestamp.now().year
        min_year = 1990
        max_year = current_year + 1
        filtered = {int(k): v for k, v in by_year.items() if isinstance(k, int) and (k >= min_year and k <= max_year)}

        trends = [{'year': str(k), 'discoveries': int(v)} for k, v in sorted(filtered.items())]
        return [DiscoveryTrend(**t) for t in trends]

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo tendencias: {str(e)}")

@router.get("/model-performance")
async def get_model_performance():
    """
    Obtiene métricas de rendimiento del modelo.
    """
    try:
        repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
        model_dir = os.path.join(repo_root, 'modelo_final')

        metrics_list = []
        feature_importance = {}
        for tel in ['kepler', 'k2', 'tess']:
            model_file = os.path.join(model_dir, f'modelo_{tel}.joblib')
            if not os.path.exists(model_file):
                continue
            try:
                data = joblib.load(model_file)
                m = data.get('metricas', {}).get('multiclase')
                if m:
                    metrics_list.append(m)
                # try to extract feature importance from stored model if available
                modelos = data.get('modelos', {})
                if 'multiclase' in modelos:
                    model_obj = modelos['multiclase']
                    if hasattr(model_obj, 'feature_importances_'):
                        # best-effort mapping: feature names from stored features
                        feat_names = data.get('features', {}).get('multiclase', [])
                        importances = getattr(model_obj, 'feature_importances_', None)
                        if importances is not None and len(feat_names) == len(importances):
                            for n, imp in zip(feat_names, importances):
                                feature_importance[n] = float(feature_importance.get(n, 0.0) + imp)
            except Exception:
                continue

        if metrics_list:
            accuracy = float(np.mean([m.get('accuracy', 0.0) for m in metrics_list]))
            precision = float(np.mean([m.get('precision', m.get('f1_score', 0.0)) if 'precision' in m else m.get('f1_score', 0.0) for m in metrics_list]))
            recall = float(np.mean([m.get('recall', m.get('f1_score', 0.0)) if 'recall' in m else m.get('f1_score', 0.0) for m in metrics_list]))
            f1_score = float(np.mean([m.get('f1_score', 0.0) for m in metrics_list]))
        else:
            accuracy = precision = recall = f1_score = 0.0

        # normalize summed feature importance
        if feature_importance:
            total = sum(feature_importance.values())
            if total > 0:
                for k in list(feature_importance.keys()):
                    feature_importance[k] = feature_importance[k] / total

        performance_data = {
            'accuracy': accuracy,
            'precision': precision,
            'recall': recall,
            'f1_score': f1_score,
            'auc_roc': None,
            'confusion_matrix': None,
            'feature_importance': feature_importance
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
