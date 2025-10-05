from motor.motor_asyncio import AsyncIOMotorClient
import os
from typing import List, Dict, Any
import logging
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

class MongoDB:
    def __init__(self):
        # Cargar variables de entorno
        load_dotenv()
        # Usar MongoDB Atlas por defecto
        self.mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
        self.client = None
        self.db = None
        self.exoplanets_collection = None
        
    async def connect(self):
        """Conectar a MongoDB"""
        try:
            self.client = AsyncIOMotorClient(self.mongodb_url)
            self.db = self.client.exoplanet_hunter
            self.exoplanets_collection = self.db.exoplanets
            
            # Test de conexión
            await self.client.admin.command('ping')
            logger.info("Conectado a MongoDB exitosamente")
            return True
        except Exception as e:
            logger.warning(f"No se pudo conectar a MongoDB: {e}. Usando datos mock.")
            # No fallar si no hay MongoDB, usar datos mock
            return False
    
    async def disconnect(self):
        """Desconectar de MongoDB"""
        if self.client:
            self.client.close()
    
    async def get_all_exoplanets(self, limit: int = 1000) -> List[Dict[str, Any]]:
        """Obtener todos los exoplanetas"""
        try:
            if self.exoplanets_collection is None:
                return self._get_mock_exoplanets()
                
            cursor = self.exoplanets_collection.find({}).limit(limit)
            exoplanets = await cursor.to_list(length=limit)
            
            # Convertir ObjectId a string para JSON serialization
            for exoplanet in exoplanets:
                if '_id' in exoplanet:
                    exoplanet['_id'] = str(exoplanet['_id'])
            
            return exoplanets
        except Exception as e:
            logger.error(f"Error obteniendo exoplanetas: {e}")
            return self._get_mock_exoplanets()
    
    async def get_exoplanets_by_classification(self, classification: str) -> List[Dict[str, Any]]:
        """Obtener exoplanetas por clasificación"""
        try:
            filter_query = {"classification": classification} if classification != "all" else {}
            cursor = self.exoplanets_collection.find(filter_query)
            exoplanets = await cursor.to_list(length=1000)
            
            for exoplanet in exoplanets:
                if '_id' in exoplanet:
                    exoplanet['_id'] = str(exoplanet['_id'])
            
            return exoplanets
        except Exception as e:
            logger.error(f"Error obteniendo exoplanetas por clasificación: {e}")
            return []
    
    async def insert_exoplanet(self, exoplanet_data: Dict[str, Any]) -> bool:
        """Insertar un nuevo exoplaneta"""
        try:
            result = await self.exoplanets_collection.insert_one(exoplanet_data)
            return result.inserted_id is not None
        except Exception as e:
            logger.error(f"Error insertando exoplaneta: {e}")
            return False
    
    async def insert_sample_data(self):
        """Insertar datos de muestra para testing"""
        sample_exoplanets = [
            {
                "name": "Kepler-452b",
                "classification": "exoplanet",
                "coordinates": {
                    "rightAscension": 285.546,
                    "declination": 44.749
                },
                "radius": 1.63,
                "orbitalPeriod": 384.843,
                "discoveryYear": 2015,
                "mission": "Kepler",
                "stellarTemperature": 5757
            },
            {
                "name": "TOI-715b",
                "classification": "candidate",
                "coordinates": {
                    "rightAscension": 120.234,
                    "declination": -52.876
                },
                "radius": 1.55,
                "orbitalPeriod": 19.288,
                "discoveryYear": 2023,
                "mission": "TESS",
                "stellarTemperature": 3930
            },
            {
                "name": "HD 209458 b",
                "classification": "exoplanet",
                "coordinates": {
                    "rightAscension": 331.446,
                    "declination": 18.884
                },
                "radius": 1.38,
                "orbitalPeriod": 3.525,
                "discoveryYear": 1999,
                "mission": "Ground-based",
                "stellarTemperature": 6071
            },
            {
                "name": "K2-18b",
                "classification": "candidate",
                "coordinates": {
                    "rightAscension": 172.561,
                    "declination": 7.589
                },
                "radius": 2.61,
                "orbitalPeriod": 32.939,
                "discoveryYear": 2015,
                "mission": "K2",
                "stellarTemperature": 3457
            },
            {
                "name": "GJ 1214 b",
                "classification": "exoplanet",
                "coordinates": {
                    "rightAscension": 258.339,
                    "declination": 4.899
                },
                "radius": 2.68,
                "orbitalPeriod": 1.580,
                "discoveryYear": 2009,
                "mission": "Ground-based",
                "stellarTemperature": 3026
            }
        ]
        
        try:
            # Limpiar datos existentes
            await self.exoplanets_collection.delete_many({})
            
            # Insertar datos de muestra
            result = await self.exoplanets_collection.insert_many(sample_exoplanets)
            logger.info(f"Insertados {len(result.inserted_ids)} exoplanetas de muestra")
            return True
        except Exception as e:
            logger.error(f"Error insertando datos de muestra: {e}")
            return False
    
    def _get_mock_exoplanets(self) -> List[Dict[str, Any]]:
        """Datos mock cuando no hay MongoDB disponible"""
        return [
            {
                "_id": "mock-1",
                "name": "Kepler-452b",
                "classification": "exoplanet",
                "coordinates": {
                    "rightAscension": 285.546,
                    "declination": 44.749
                },
                "radius": 1.63,
                "orbitalPeriod": 384.843,
                "discoveryYear": 2015,
                "mission": "Kepler",
                "stellarTemperature": 5757
            },
            {
                "_id": "mock-2",
                "name": "TOI-715b",
                "classification": "candidate",
                "coordinates": {
                    "rightAscension": 120.234,
                    "declination": -52.876
                },
                "radius": 1.55,
                "orbitalPeriod": 19.288,
                "discoveryYear": 2023,
                "mission": "TESS",
                "stellarTemperature": 3930
            },
            {
                "_id": "mock-3",
                "name": "HD 209458 b",
                "classification": "exoplanet",
                "coordinates": {
                    "rightAscension": 331.446,
                    "declination": 18.884
                },
                "radius": 1.38,
                "orbitalPeriod": 3.525,
                "discoveryYear": 1999,
                "mission": "Ground-based",
                "stellarTemperature": 6071
            },
            {
                "_id": "mock-4",
                "name": "K2-18b",
                "classification": "candidate",
                "coordinates": {
                    "rightAscension": 172.561,
                    "declination": 7.589
                },
                "radius": 2.61,
                "orbitalPeriod": 32.939,
                "discoveryYear": 2015,
                "mission": "K2",
                "stellarTemperature": 3457
            },
            {
                "_id": "mock-5",
                "name": "GJ 1214 b",
                "classification": "exoplanet",
                "coordinates": {
                    "rightAscension": 258.339,
                    "declination": 4.899
                },
                "radius": 2.68,
                "orbitalPeriod": 1.580,
                "discoveryYear": 2009,
                "mission": "Ground-based",
                "stellarTemperature": 3026
            }
        ]

# Instancia global
mongodb = MongoDB()
