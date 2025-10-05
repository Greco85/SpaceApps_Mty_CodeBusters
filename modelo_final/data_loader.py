import pandas as pd
import numpy as np
import chardet
import os

# Detección automática de codificación
def detectar_encoding(archivo):
    try:
        with open(archivo, 'rb') as f:
            resultado = chardet.detect(f.read(10000))
        encoding = resultado['encoding']
        confianza = resultado['confidence']
        print(f"🔍 Encoding detectado para {archivo}: {encoding} (confianza: {confianza:.2f})")
        return encoding if confianza > 0.7 else 'utf-8'
    except Exception as e:
        print(f"Error detectando encoding: {e}, usando utf-8")
        return 'utf-8'

# Carga de CSV con salto de filas
def cargar_csv_con_salto(archivo, fila_inicio=1):
    try:
        encoding = detectar_encoding(archivo)
        print(f" Cargando {archivo} desde fila {fila_inicio}...")
        
        df = pd.read_csv(
            archivo, 
            skiprows=fila_inicio - 1,
            encoding=encoding,
            engine='python',
            on_bad_lines='skip'
        )
        
        if df.empty:
            print(f" Archivo {archivo} vacío después de saltar {fila_inicio-1} filas")
            return None
            
        print(f" {archivo} cargado: {df.shape[0]} filas, {df.shape[1]} columnas")
        return df
        
    except Exception as e:
        print(f" Error cargando {archivo}: {e}")
        try:
            return pd.read_csv(archivo, skiprows=fila_inicio - 1, encoding='latin-1')
        except:
            return None

# PREPROCESAMIENTO ESPECIALIZADO CON METADATOS REALES
def preprocesar_telescopio(df, telescopio):
    """
    Preprocesamiento especializado usando metadatos reales de cada telescopio
    """
    df = df.copy()
    print(f"🔧 Preprocesando datos {telescopio.upper()}...")
    
    if telescopio == "kepler":
        # CARACTERÍSTICAS NATIVAS KEPLER (metadatos)
        mapeo_columnas = {
            'koi_period': 'period',
            'koi_duration': 'duration', 
            'koi_depth': 'depth',
            'koi_prad': 'radius',
            'koi_teq': 'teq',
            'koi_srad': 'star_radius',
            'koi_smass': 'star_mass',
            'koi_slogg': 'logg',
            'koi_impact': 'impact_parameter',
            'koi_disposition': 'disposition',
            'koi_insol': 'insolation',
            'koi_model_snr': 'snr'
        }
        
    elif telescopio == "tess":
        # CARACTERÍSTICAS NATIVAS TESS (metadatos)
        mapeo_columnas = {
            'pl_orbper': 'period',
            'pl_trandurh': 'duration',
            'pl_trandep': 'depth', 
            'pl_rade': 'radius',
            'pl_eqt': 'teq',
            'st_rad': 'star_radius',
            'st_mass': 'star_mass',
            'st_logg': 'logg',
            'pl_insol': 'insolation',
            'tfopwg_disp': 'disposition',
            'st_teff': 'star_teff',
            'st_tmag': 'tess_mag'
        }
        
    else:  # K2
        # CARACTERÍSTICAS NATIVAS K2 (metadatos)
        mapeo_columnas = {
            'pl_orbper': 'period',
            'pl_trandurh': 'duration',
            'pl_trandep': 'depth',
            'pl_rade': 'radius', 
            'pl_eqt': 'teq',
            'st_rad': 'star_radius',
            'st_mass': 'star_mass',
            'st_logg': 'logg',
            'pl_insol': 'insolation',
            'disposition': 'disposition',
            'st_teff': 'star_teff',
            'sy_vmag': 'v_mag'
        }
    
    # Aplicar mapeo solo para columnas existentes
    columnas_existentes = [col for col in mapeo_columnas.keys() if col in df.columns]
    print(f"   Columnas encontradas en {telescopio}: {columnas_existentes}")
    
    df = df[columnas_existentes]
    df = df.rename(columns=mapeo_columnas)

    # Manejar valores faltantes
    for col in df.select_dtypes(include=[np.number]).columns:
        if col in df.columns:
            df[col] = df[col].fillna(df[col].median())
    
    for col in df.select_dtypes(include=['object']).columns:
        if col in df.columns:
            df[col] = df[col].fillna('')

    # CARACTERÍSTICAS DERIVADAS ESPECÍFICAS
    if 'period' in df.columns and 'duration' in df.columns:
        df['period_duration_ratio'] = df['period'] / (df['duration'].replace(0, 1e-5))
    
    if 'depth' in df.columns and 'duration' in df.columns:
        df['transit_snr'] = df['depth'] / (df['duration'].replace(0, 1e-5))
        df['depth_duration_ratio'] = df['depth'] / (df['duration'].replace(0, 1e-5))
    
    if 'radius' in df.columns and 'star_radius' in df.columns:
        df['radius_ratio'] = df['radius'] / (df['star_radius'].replace(0, 1e-5))
    
    # MAPEO DE DISPOSICIONES POR TELESCOPIO
    if 'disposition' in df.columns:
        if telescopio == "kepler":
            df['disposition'] = df['disposition'].replace({
                'CONFIRMED': 'CONFIRMED',
                'CANDIDATE': 'CANDIDATE', 
                'FALSE POSITIVE': 'FALSE POSITIVE'
            })
        elif telescopio == "tess":
            df['disposition'] = df['disposition'].replace({
                'PC': 'CANDIDATE',      # Planetary Candidate
                'CP': 'CONFIRMED',      # Confirmed Planet  
                'KP': 'CONFIRMED',      # Known Planet
                'APC': 'CANDIDATE',     # Ambiguous Planetary Candidate
                'FP': 'FALSE POSITIVE', # False Positive
                'FA': 'FALSE POSITIVE'  # False Alarm
            })
        else:  # K2
            df['disposition'] = df['disposition'].replace({
                'CONFIRMED': 'CONFIRMED',
                'CANDIDATE': 'CANDIDATE',
                'FALSE POSITIVE': 'FALSE POSITIVE'
            })
        
        # Manejar valores no mapeados
        mapeadas = ['CONFIRMED', 'CANDIDATE', 'FALSE POSITIVE']
        df['disposition'] = df['disposition'].apply(
            lambda x: x if x in mapeadas else 'CANDIDATE'
        )

    print(f"   Disposiciones únicas {telescopio}: {df['disposition'].unique()}")
    return df

# Cargar y preprocesar todos los datasets
def cargar_y_preprocesar_datasets():
    print(" Cargando datasets de los 3 telescopios...")
    df_kepler = cargar_csv_con_salto("kepler.csv", 54)
    df_tess = cargar_csv_con_salto("tess.csv", 70) 
    df_k2 = cargar_csv_con_salto("k2.csv", 99)

    # Verificar carga
    if df_kepler is None:
        raise Exception(" No se pudo cargar dataset Kepler")
    if df_tess is None:
        raise Exception(" No se pudo cargar dataset TESS") 
    if df_k2 is None:
        print(" Dataset K2 no disponible, continuando con Kepler y TESS")

    # Preprocesar los 3 telescopios
    df_kepler_proc = preprocesar_telescopio(df_kepler, "kepler")
    df_tess_proc = preprocesar_telescopio(df_tess, "tess")
    df_k2_proc = preprocesar_telescopio(df_k2, "k2") if df_k2 is not None else None

    print(f" Kepler procesado: {df_kepler_proc.shape}")
    print(f" TESS procesado: {df_tess_proc.shape}")
    if df_k2_proc is not None:
        print(f" K2 procesado: {df_k2_proc.shape}")
    
    return df_kepler_proc, df_tess_proc, df_k2_proc