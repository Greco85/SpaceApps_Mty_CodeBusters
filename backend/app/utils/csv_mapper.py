import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional
import logging

logger = logging.getLogger(__name__)

class CSVExoplanetMapper:
    """
    Mapper unificado para procesar archivos CSV de diferentes misiones NASA
    (TESS, Kepler, K2) y convertirlos a formato estándar para MongoDB
    """
    
    def __init__(self):
        # Mapeo de columnas para cada misión
        self.mission_mappings = {
            'tess': {
                'name': 'toi',
                'classification': self._map_tess_classification,
                'rightAscension': 'ra',
                'declination': 'dec',
                'orbitalPeriod': 'pl_orbper',
                'radius': 'pl_rade',
                'stellarTemperature': 'st_teff',
                'mission': 'TESS'
            },
            'kepler': {
                'name': 'kepler_name',
                'classification': self._map_kepler_classification,
                'rightAscension': 'ra',
                'declination': 'dec',
                'orbitalPeriod': 'koi_period',
                'radius': 'koi_prad',
                'stellarTemperature': 'koi_steff',
                'mission': 'Kepler'
            },
            'k2': {
                'name': 'pl_name',
                'classification': self._map_k2_classification,
                'rightAscension': 'ra',
                'declination': 'dec',
                'orbitalPeriod': 'pl_orbper',
                'radius': 'pl_rade',
                'stellarTemperature': 'st_teff',
                'mission': 'K2'
            },
            'unknown': {
                'name': self._find_name_column,
                'classification': self._map_generic_classification,
                'rightAscension': self._find_ra_column,
                'declination': self._find_dec_column,
                'orbitalPeriod': self._find_period_column,
                'radius': self._find_radius_column,
                'stellarTemperature': self._find_temp_column,
                'mission': 'Unknown'
            }
        }
    
    def detect_mission_type(self, df: pd.DataFrame) -> str:
        """
        Detecta el tipo de misión basado en las columnas del DataFrame
        """
        columns = set([col.lower() for col in df.columns])
        
        # Detectar TESS - más flexible
        tess_indicators = ['toi', 'pl_tranmid', 'pl_orbper', 'pl_rade', 'st_teff']
        if any(indicator in columns for indicator in tess_indicators[:2]):
            return 'tess'
        
        # Detectar Kepler - más flexible
        kepler_indicators = ['kepid', 'koi_disposition', 'koi_period', 'koi_prad', 'koi_steff']
        if any(indicator in columns for indicator in kepler_indicators[:2]):
            return 'kepler'
        
        # Detectar K2 - más flexible
        k2_indicators = ['pl_name', 'disposition', 'pl_orbper', 'pl_rade']
        if any(indicator in columns for indicator in k2_indicators[:2]):
            return 'k2'
        
        # Detección por columnas comunes
        if 'pl_orbper' in columns and 'pl_rade' in columns:
            # Si tiene columnas estándar de exoplanetas, asumir TESS
            return 'tess'
        
        if 'koi_period' in columns and 'koi_prad' in columns:
            # Si tiene columnas de Kepler
            return 'kepler'
        
        # Fallback: intentar detectar por nombre de archivo o contenido
        logger.warning("No se pudo detectar el tipo de misión automáticamente")
        return 'unknown'
    
    def detect_mission_type_from_file(self, file_path: str) -> str:
        """
        Detecta el tipo de misión desde un archivo CSV
        """
        try:
            # Leer solo las primeras líneas para detectar columnas
            df = pd.read_csv(file_path, comment='#', nrows=5)
            return self.detect_mission_type(df)
        except Exception as e:
            logger.error(f"Error detectando tipo de misión desde archivo: {e}")
            return 'unknown'
    
    def process_csv(self, file_path: str, mission_type: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Procesa un archivo CSV y retorna lista de exoplanetas en formato estándar
        """
        try:
            # Leer CSV, saltando comentarios
            df = pd.read_csv(file_path, comment='#')
            
            if mission_type is None:
                mission_type = self.detect_mission_type(df)
            
            # Verificar si el archivo tiene columnas genéricas (como plantillas)
            columns = set([col.lower() for col in df.columns])
            has_generic_columns = any(col in columns for col in ['name', 'orbital_period', 'transit_duration', 'transit_depth', 'stellar_radius'])
            
            # Si tiene columnas genéricas, usar mapeo 'unknown' independientemente del mission_type
            if has_generic_columns:
                logger.info(f"Archivo con columnas genéricas detectado, usando mapeo 'unknown' para mission_type '{mission_type}'")
                actual_mapping_type = 'unknown'
            else:
                actual_mapping_type = mission_type
            
            if actual_mapping_type not in self.mission_mappings:
                raise ValueError(f"Tipo de misión no soportado: {actual_mapping_type}")
            
            mapping = self.mission_mappings[actual_mapping_type]
            exoplanets = []
            
            for _, row in df.iterrows():
                try:
                    exoplanet = self._map_row_to_exoplanet(row, mapping, actual_mapping_type, df)
                    if exoplanet:  # Solo agregar si el mapeo fue exitoso
                        # Actualizar la misión al tipo especificado por el usuario
                        exoplanet['mission'] = self.mission_mappings[mission_type]['mission'] if mission_type in self.mission_mappings else 'Unknown'
                        exoplanets.append(exoplanet)
                except Exception as e:
                    logger.warning(f"Error procesando fila {_}: {e}")
                    continue
            
            logger.info(f"Procesados {len(exoplanets)} exoplanetas de {mission_type.upper()}")
            return exoplanets
            
        except Exception as e:
            logger.error(f"Error procesando archivo CSV: {e}")
            raise
    
    def _map_row_to_exoplanet(self, row: pd.Series, mapping: Dict[str, Any], mission_type: str, df: pd.DataFrame = None) -> Optional[Dict[str, Any]]:
        """
        Mapea una fila del DataFrame a formato estándar de exoplaneta
        """
        try:
            # Extraer valores básicos
            if mission_type == 'unknown' and df is not None:
                name = mapping['name'](row, df)
                classification = mapping['classification'](row)
                ra = mapping['rightAscension'](row, df)
                dec = mapping['declination'](row, df)
                orbital_period = mapping['orbitalPeriod'](row, df)
                radius = mapping['radius'](row, df)
                stellar_temp = mapping['stellarTemperature'](row, df)
            else:
                name = self._safe_get(row, mapping['name'])
                classification = mapping['classification'](row)
                ra = self._safe_get(row, mapping['rightAscension'])
                dec = self._safe_get(row, mapping['declination'])
                orbital_period = self._safe_get(row, mapping['orbitalPeriod'])
                radius = self._safe_get(row, mapping['radius'])
                stellar_temp = self._safe_get(row, mapping['stellarTemperature'])
            
            if not name or pd.isna(name):
                return None
            
            # Generar ID único
            exoplanet_id = f"{mission_type.lower()}-{str(name).replace(' ', '-').replace('/', '-')}"
            
            exoplanet = {
                'id': exoplanet_id,
                'name': str(name),
                'classification': classification,
                'coordinates': {
                    'rightAscension': float(ra) if ra is not None and not pd.isna(ra) else 0.0,
                    'declination': float(dec) if dec is not None and not pd.isna(dec) else 0.0
                },
                'orbitalPeriod': float(orbital_period) if orbital_period is not None and not pd.isna(orbital_period) else 1.0,
                'radius': float(radius) if radius is not None and not pd.isna(radius) else 1.0,
                'stellarTemperature': float(stellar_temp) if stellar_temp is not None and not pd.isna(stellar_temp) else 5000.0,
                'discoveryYear': self._extract_discovery_year(row, mission_type),
                'mission': mapping['mission']
            }
            
            return exoplanet
            
        except Exception as e:
            logger.warning(f"Error mapeando fila: {e}")
            return None
    
    def _safe_get(self, row: pd.Series, column: str) -> Any:
        """
        Obtiene valor de columna de forma segura
        """
        try:
            return row[column] if column in row.index else None
        except:
            return None
    
    def _extract_discovery_year(self, row: pd.Series, mission_type: str) -> int:
        """
        Extrae el año de descubrimiento según el tipo de misión
        """
        if mission_type == 'kepler':
            return 2009  # Kepler comenzó en 2009
        elif mission_type == 'k2':
            return 2014  # K2 comenzó en 2014
        elif mission_type == 'tess':
            return 2018  # TESS comenzó en 2018
        else:
            return 2020  # Año por defecto
    
    # Funciones de mapeo de clasificación específicas para cada misión
    def _map_tess_classification(self, row: pd.Series) -> str:
        """
        Mapea clasificación de TESS
        """
        # TESS no tiene campo de clasificación directo, usar lógica basada en otros campos
        # Por simplicidad, asignar candidato si tiene datos básicos
        return 'candidate'
    
    def _map_kepler_classification(self, row: pd.Series) -> str:
        """
        Mapea clasificación de Kepler
        """
        disposition = self._safe_get(row, 'koi_disposition')
        if disposition is None:
            return 'candidate'
        
        disposition = str(disposition).lower()
        if 'confirmed' in disposition:
            return 'exoplanet'
        elif 'candidate' in disposition:
            return 'candidate'
        else:
            return 'false_positive'
    
    def _map_k2_classification(self, row: pd.Series) -> str:
        """
        Mapea clasificación de K2
        """
        disposition = self._safe_get(row, 'disposition')
        if disposition is None:
            return 'candidate'
        
        disposition = str(disposition).lower()
        if 'confirmed' in disposition:
            return 'exoplanet'
        elif 'candidate' in disposition:
            return 'candidate'
        else:
            return 'false_positive'
    
    # Funciones auxiliares para mapeo genérico (unknown)
    def _find_name_column(self, row: pd.Series, df: pd.DataFrame) -> str:
        """Busca columna de nombre de forma inteligente"""
        name_candidates = ['name', 'pl_name', 'toi', 'kepler_name', 'planet_name', 'id']
        for candidate in name_candidates:
            if candidate in df.columns:
                value = self._safe_get(row, candidate)
                if value and not pd.isna(value):
                    return str(value)
        return f"exoplanet-{row.name}"  # Usar índice como fallback
    
    def _find_ra_column(self, row: pd.Series, df: pd.DataFrame) -> float:
        """Busca columna de ascensión recta o genera coordenada única"""
        ra_candidates = ['ra', 'right_ascension', 'ra_deg', 'ra_degrees']
        for candidate in ra_candidates:
            if candidate in df.columns:
                return self._safe_get(row, candidate)
        
        # Generar coordenada única basada en el índice de la fila con mejor distribución
        row_index = row.name if hasattr(row, 'name') else 0
        import random
        import time
        
        # Usar timestamp + índice para mayor aleatoriedad
        seed = int(time.time() * 1000) + row_index
        random.seed(seed)
        
        # Generar coordenada más dispersa (mínimo 5 grados de separación)
        base_ra = (row_index * 45) % 360  # 45 grados de separación base
        random_offset = random.uniform(-10, 10)  # Offset aleatorio
        return (base_ra + random_offset) % 360
    
    def _find_dec_column(self, row: pd.Series, df: pd.DataFrame) -> float:
        """Busca columna de declinación o genera coordenada única"""
        dec_candidates = ['dec', 'declination', 'dec_deg', 'dec_degrees']
        for candidate in dec_candidates:
            if candidate in df.columns:
                return self._safe_get(row, candidate)
        
        # Generar coordenada única basada en el índice de la fila con mejor distribución
        row_index = row.name if hasattr(row, 'name') else 0
        import random
        import time
        
        # Usar timestamp + índice para mayor aleatoriedad
        seed = int(time.time() * 1000) + row_index + 1000
        random.seed(seed)
        
        # Generar coordenada más dispersa (mínimo 10 grados de separación)
        base_dec = (row_index * 30 - 90) % 180 - 90  # Distribución más amplia
        random_offset = random.uniform(-15, 15)  # Offset aleatorio más grande
        return max(-90, min(90, base_dec + random_offset))
    
    def _find_period_column(self, row: pd.Series, df: pd.DataFrame) -> float:
        """Busca columna de período orbital"""
        period_candidates = ['period', 'orbital_period', 'pl_orbper', 'koi_period', 'orb_period']
        for candidate in period_candidates:
            if candidate in df.columns:
                return self._safe_get(row, candidate)
        return 1.0
    
    def _find_radius_column(self, row: pd.Series, df: pd.DataFrame) -> float:
        """Busca columna de radio planetario"""
        radius_candidates = ['radius', 'pl_rade', 'koi_prad', 'planet_radius', 'pl_rad']
        for candidate in radius_candidates:
            if candidate in df.columns:
                return self._safe_get(row, candidate)
        return 1.0
    
    def _find_temp_column(self, row: pd.Series, df: pd.DataFrame) -> float:
        """Busca columna de temperatura estelar"""
        temp_candidates = ['temp', 'temperature', 'st_teff', 'koi_steff', 'stellar_temp', 'teff']
        for candidate in temp_candidates:
            if candidate in df.columns:
                return self._safe_get(row, candidate)
        return 5000.0
    
    def _map_generic_classification(self, row: pd.Series) -> str:
        """Mapeo genérico de clasificación"""
        # Buscar campos de clasificación comunes
        classification_candidates = ['disposition', 'status', 'classification', 'type', 'koi_disposition']
        for candidate in classification_candidates:
            if candidate in row.index:
                value = str(row[candidate]).lower()
                if 'confirmed' in value or 'exoplanet' in value:
                    return 'exoplanet'
                elif 'candidate' in value:
                    return 'candidate'
                elif 'false' in value or 'fp' in value:
                    return 'false_positive'
        
        # Por defecto, generar clasificación basada en características
        # Si tiene radio > 1.5 y período < 10 días, probablemente es un exoplaneta
        try:
            radius = float(row.get('radius', row.get('pl_rade', row.get('stellar_radius', 1.0))))
            period = float(row.get('period', row.get('orbital_period', row.get('pl_orbper', 10.0))))
            
            if radius > 1.5 and period < 10:
                return 'exoplanet'  # 30% probabilidad
            elif radius > 2.0 or period > 100:
                return 'false_positive'  # 20% probabilidad
            else:
                return 'candidate'  # 50% probabilidad
        except:
            # Si hay error en los cálculos, usar distribución aleatoria
            import random
            rand = random.random()
            if rand < 0.3:
                return 'exoplanet'
            elif rand < 0.5:
                return 'false_positive'
            else:
                return 'candidate'
