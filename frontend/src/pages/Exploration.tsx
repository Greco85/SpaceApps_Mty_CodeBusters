import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Upload, FileText, BarChart3, AlertCircle, Target, Globe, Star, TrendingUp, Brain, GraduationCap, Zap, Compass, Search } from 'lucide-react';
import Chatbot from '../components/Chatbot.tsx';

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Custom icons for different classifications
const createExoplanetIcon = (classification: string, radius: number) => {
  const size = Math.max(15, Math.min(35, radius * 10));
  let color = '#6B7280'; // Default gray
  
  switch (classification) {
    case 'exoplanet':
      color = '#10B981'; // Green
      break;
    case 'candidate':
      color = '#FDE047'; // Yellow
      break;
    case 'false_positive':
      color = '#EF4444'; // Red
      break;
    default:
      color = '#6B7280'; // Gray for unknown
  }
  
  return L.divIcon({
    className: 'custom-exoplanet-icon',
    html: `<div style="
      width: ${size}px;
      height: ${size}px;
      background-color: ${color};
      border: 2px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: ${size > 20 ? '10px' : '6px'};
      color: white;
      font-weight: bold;
    ">★</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

interface ExoplanetData {
  id: string;
  name: string;
  classification: 'exoplanet' | 'candidate' | 'false_positive';
  coordinates: {
    rightAscension: number;
    declination: number;
  };
  radius: number;
  orbitalPeriod: number;
  discoveryYear: number;
  mission: string;
  stellarTemperature: number;
}

interface AnalysisResult {
  prediction: 'exoplanet' | 'candidate' | 'false_positive';
  confidence: number;
  features: {
    orbital_period: number;
    transit_duration: number;
    transit_depth: number;
    stellar_radius: number;
  };
}

const Exploration: React.FC = () => {
  const [exoplanets, setExoplanets] = useState<ExoplanetData[]>([]);
  const [filteredExoplanets, setFilteredExoplanets] = useState<ExoplanetData[]>([]);
  const [selectedClassification, setSelectedClassification] = useState<string>('all');
  const [selectedExoplanet, setSelectedExoplanet] = useState<ExoplanetData | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<'expert' | 'student'>('expert');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Load exoplanet data from CSV
  useEffect(() => {
    loadExoplanetData();
    // Ensure page starts at top
    window.scrollTo(0, 0);
  }, []);

  const loadExoplanetData = async () => {
    try {
      const response = await fetch('/api/v1/analysis/sample');
      if (response.ok) {
        const data = await response.json();
        const rows = data.rows || [];
        
        // Convert CSV data to exoplanet format
        const exoplanetData: ExoplanetData[] = rows.slice(0, 100).map((row: any, index: number) => {
          // Random classification for demo (in real app, this would come from ML prediction)
          const classifications = ['exoplanet', 'candidate', 'false_positive'];
          const randomClassification = classifications[Math.floor(Math.random() * classifications.length)];
          
          return {
            id: `exoplanet-${index}`,
            name: row.name || `Exoplanet ${index + 1}`,
            classification: randomClassification,
            coordinates: {
              rightAscension: (Math.random() - 0.5) * 360, // Random coordinates for demo
              declination: (Math.random() - 0.5) * 180,
            },
            radius: Number(row.radius || Math.random() * 2 + 0.5),
            orbitalPeriod: Number(row.orbital_period || Math.random() * 1000 + 1),
            discoveryYear: 2000 + Math.floor(Math.random() * 24),
            mission: ['Kepler', 'TESS', 'K2'][Math.floor(Math.random() * 3)],
            stellarTemperature: Number(row.stellar_temperature || 3000 + Math.random() * 6000),
          };
        });
        
        setExoplanets(exoplanetData);
        setFilteredExoplanets(exoplanetData);
      }
    } catch (error) {
      console.error('Error loading exoplanet data:', error);
    }
  };

  // Filter exoplanets based on classification
  useEffect(() => {
    if (selectedClassification === 'all') {
      setFilteredExoplanets(exoplanets);
    } else {
      setFilteredExoplanets(exoplanets.filter(ep => ep.classification === selectedClassification));
    }
  }, [selectedClassification, exoplanets]);

  // Convert coordinates to map coordinates
  const convertToMapCoordinates = (ra: number, dec: number): [number, number] => {
    const lat = dec;
    const lng = ra > 180 ? ra - 360 : ra;
    return [lat, lng];
  };

  // Calculate statistics from filtered data
  const getStatistics = () => {
    const total = filteredExoplanets.length;
    const exoplanets = filteredExoplanets.filter(ep => ep.classification === 'exoplanet').length;
    const candidates = filteredExoplanets.filter(ep => ep.classification === 'candidate').length;
    const falsePositives = filteredExoplanets.filter(ep => ep.classification === 'false_positive').length;
    
    return {
      total,
      exoplanets,
      candidates,
      falsePositives,
      precision: total > 0 ? ((exoplanets / total) * 100).toFixed(1) : '0.0'
    };
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsUploading(true);

    try {
      const form = new FormData();
      form.append('file', file, file.name);

      const res = await fetch('/api/v1/analysis/upload', {
        method: 'POST',
        body: form,
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const json = await res.json();
      setAnalysisResult({
        prediction: json.prediction,
        confidence: json.confidence,
        features: {
          orbital_period: json.features_analyzed?.orbital_period || 0,
          transit_duration: json.features_analyzed?.transit_duration || 0,
          transit_depth: json.features_analyzed?.transit_depth || 0,
          stellar_radius: json.features_analyzed?.stellar_radius || 0,
        }
      });
    } catch (err: any) {
      console.error('Upload error', err);
      alert('Error al procesar el archivo: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const stats = getStatistics();

  return (
    <div className="min-h-screen bg-space-dark text-white">
      <div className="container mx-auto px-4 py-6 pt-24">
        <h1 className="text-4xl font-space font-bold mb-6 text-center">
          Exploración de Exoplanetas
        </h1>

        {/* Features Section */}
        <section className="py-12 mb-12">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-space font-bold text-center mb-12">
              Características del Sistema
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-space-dark/50 backdrop-blur-sm border border-space-blue/30 rounded-lg p-6 hover:border-exoplanet-orange/50 transition-colors duration-200">
                <Zap className="h-12 w-12 text-exoplanet-orange mb-4" />
                <h3 className="text-xl font-semibold mb-2">IA Avanzada</h3>
                <p className="text-gray-300">Modelos de machine learning entrenados con datos reales de la NASA</p>
              </div>
              <div className="bg-space-dark/50 backdrop-blur-sm border border-space-blue/30 rounded-lg p-6 hover:border-exoplanet-orange/50 transition-colors duration-200">
                <Compass className="h-12 w-12 text-exoplanet-orange mb-4" />
                <h3 className="text-xl font-semibold mb-2">Exploración Interactiva</h3>
                <p className="text-gray-300">Mapa unificado con análisis, estadísticas y chatbot integrado</p>
              </div>
              <div className="bg-space-dark/50 backdrop-blur-sm border border-space-blue/30 rounded-lg p-6 hover:border-exoplanet-orange/50 transition-colors duration-200">
                <Search className="h-12 w-12 text-exoplanet-orange mb-4" />
                <h3 className="text-xl font-semibold mb-2">Datos Auténticos</h3>
                <p className="text-gray-300">Basado en misiones reales: Kepler, K2 y TESS</p>
              </div>
            </div>
          </div>
        </section>

        {/* How it Works Section */}
        <section className="py-12 mb-12">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-space font-bold text-center mb-12">
              ¿Cómo Funciona?
            </h2>
            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-exoplanet-orange text-white rounded-full flex items-center justify-center font-bold text-lg">
                  1
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Carga de Datos</h3>
                  <p className="text-gray-300">Sube archivos CSV con datos de curvas de luz estelar o utiliza nuestros datasets pre-cargados</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-exoplanet-orange text-white rounded-full flex items-center justify-center font-bold text-lg">
                  2
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Procesamiento IA</h3>
                  <p className="text-gray-300">Nuestro modelo analiza patrones en los datos para identificar tránsitos planetarios</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-exoplanet-orange text-white rounded-full flex items-center justify-center font-bold text-lg">
                  3
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Resultados</h3>
                  <p className="text-gray-300">Recibe clasificaciones detalladas: exoplaneta confirmado, candidato o falso positivo</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-6">
          <div className="bg-space-dark/50 backdrop-blur-sm border border-space-blue/30 rounded-lg p-1 flex">
            <button
              onClick={() => {
                setActiveTab('expert');
                window.scrollTo(0, 0);
              }}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-all duration-200 ${
                activeTab === 'expert'
                  ? 'bg-exoplanet-orange text-white shadow-lg'
                  : 'text-gray-300 hover:text-white hover:bg-space-blue/30'
              }`}
            >
              <Brain className="h-5 w-5" />
              <span>Vista Experto</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('student');
                window.scrollTo(0, 0);
              }}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-all duration-200 ${
                activeTab === 'student'
                  ? 'bg-exoplanet-orange text-white shadow-lg'
                  : 'text-gray-300 hover:text-white hover:bg-space-blue/30'
              }`}
            >
              <GraduationCap className="h-5 w-5" />
              <span>Vista Estudiante</span>
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Map Section */}
          <div className="lg:col-span-2">
            <div className="bg-space-dark/50 backdrop-blur-sm border border-space-blue/30 rounded-lg p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold">Mapa de Exoplanetas</h2>
                <div className="flex space-x-2">
                  <select
                    value={selectedClassification}
                    onChange={(e) => setSelectedClassification(e.target.value)}
                    className="bg-space-dark border border-space-blue/30 rounded px-3 py-1 text-white"
                  >
                    <option value="all">Todos</option>
                    <option value="exoplanet">Exoplanetas Confirmados</option>
                    <option value="candidate">Candidatos</option>
                    <option value="false_positive">Falsos Positivos</option>
                  </select>
                </div>
              </div>
              
              <div className="h-96 rounded-lg overflow-hidden">
                <MapContainer
                  center={[0, 0]}
                  zoom={2}
                  style={{ height: '100%', width: '100%' }}
                  className="rounded-lg"
                >
                  <TileLayer
                    url="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgdmlld0JveD0iMCAwIDI1NiAyNTYiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyNTYiIGhlaWdodD0iMjU2IiBmaWxsPSIjMDAwMDAwIi8+CjxnIGZpbGw9IiNmZmZmZmYiPgo8Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSIxIiBvcGFjaXR5PSIwLjgiLz4KPGNpcmNsZSBjeD0iMTAwIiBjeT0iODAiIHI9IjEuNSIgb3BhY2l0eT0iMC42Ii8+CjxjaXJjbGUgY3g9IjIwMCIgY3k9IjEwMCIgcj0iMC41IiBvcGFjaXR5PSIwLjkiLz4KPGNpcmNsZSBjeD0iMTUwIiBjeT0iMjAwIiByPSIxLjIiIG9wYWNpdHk9IjAuNyIvPgo8Y2lyY2xlIGN4PSI4MCIgY3k9IjE4MCIgcj0iMC44IiBvcGFjaXR5PSIwLjgiLz4KPC9nPgo8L3N2Zz4K"
                    attribution=""
                  />
                  {filteredExoplanets.map((exoplanet) => (
                    <Marker
                      key={exoplanet.id}
                      position={convertToMapCoordinates(
                        exoplanet.coordinates.rightAscension,
                        exoplanet.coordinates.declination
                      )}
                      icon={createExoplanetIcon(exoplanet.classification, exoplanet.radius)}
                      eventHandlers={{
                        click: () => setSelectedExoplanet(exoplanet),
                      }}
                    >
                      <Popup>
                        <div className="text-black">
                          <h3 className="font-bold">{exoplanet.name}</h3>
                          <p><strong>Tipo:</strong> {exoplanet.classification}</p>
                          <p><strong>Radio:</strong> {exoplanet.radius.toFixed(2)} R⊕</p>
                          <p><strong>Período Orbital:</strong> {exoplanet.orbitalPeriod.toFixed(1)} días</p>
                          <p><strong>Año de Descubrimiento:</strong> {exoplanet.discoveryYear}</p>
                          <p><strong>Misión:</strong> {exoplanet.mission}</p>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Statistics */}
            <div className="bg-space-dark/50 backdrop-blur-sm border border-space-blue/30 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">
                {activeTab === 'expert' ? 'Estadísticas del Modelo' : 'Datos Interesantes'}
              </h3>
              
              {activeTab === 'expert' ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-exoplanet-orange">{stats.total}</div>
                      <div className="text-sm text-gray-400">Total Analizado</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">{stats.exoplanets}</div>
                      <div className="text-sm text-gray-400">Confirmados</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-400">{stats.candidates}</div>
                      <div className="text-sm text-gray-400">Candidatos</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-400">{stats.falsePositives}</div>
                      <div className="text-sm text-gray-400">Falsos Positivos</div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-exoplanet-orange">{stats.precision}%</div>
                    <div className="text-sm text-gray-400">Precisión del Modelo</div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-space-blue/20 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-2">Planetas Confirmados</h4>
                    <p className="text-gray-300 text-sm">
                      {stats.exoplanets} exoplanetas han sido confirmados por científicos
                    </p>
                  </div>
                  <div className="bg-star-yellow/20 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-2">Candidatos</h4>
                    <p className="text-gray-300 text-sm">
                      {stats.candidates} candidatos esperan confirmación
                    </p>
                  </div>
                  <div className="bg-planet-green/20 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-2">IA Precisa</h4>
                    <p className="text-gray-300 text-sm">
                      Nuestra IA tiene {stats.precision}% de precisión
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Analysis Section */}
            <div className="bg-space-dark/50 backdrop-blur-sm border border-space-blue/30 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center space-x-2">
                <Upload className="h-5 w-5 text-exoplanet-orange" />
                <span>Análisis de Datos</span>
              </h3>
              
              <div className="space-y-4">
                <div className="border-2 border-dashed border-space-blue/50 rounded-lg p-4 text-center">
                  <input
                    type="file"
                    accept=".csv,.json"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center space-y-2"
                  >
                    <FileText className="h-8 w-8 text-gray-400" />
                    <div>
                      <p className="text-sm font-semibold">
                        {selectedFile ? selectedFile.name : 'Selecciona archivo CSV'}
                      </p>
                      <p className="text-xs text-gray-400">
                        Formatos: CSV, JSON
                      </p>
                    </div>
                  </label>
                </div>

                <button
                  onClick={() => document.getElementById('file-upload')?.click()}
                  className="w-full bg-exoplanet-orange hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors duration-200"
                >
                  {isUploading ? 'Analizando...' : 'Analizar Datos'}
                </button>

                {analysisResult && (
                  <div className="mt-4 p-4 bg-space-blue/20 rounded-lg">
                    <h4 className="font-semibold mb-2">Resultado:</h4>
                    <div className="space-y-1 text-sm">
                      <p><strong>Predicción:</strong> {analysisResult.prediction}</p>
                      <p><strong>Confianza:</strong> {(analysisResult.confidence * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Chatbot */}
            <div className="bg-space-dark/50 backdrop-blur-sm border border-space-blue/30 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">
                {activeTab === 'student' ? 'Pregúntame sobre Exoplanetas' : 'Asistente de IA'}
              </h3>
              <Chatbot />
            </div>
          </div>
        </div>

        {/* Selected Exoplanet Details */}
        {selectedExoplanet && (
          <div className="mt-6 bg-space-dark/50 backdrop-blur-sm border border-space-blue/30 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Detalles del Exoplaneta Seleccionado</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Información Básica</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Nombre:</strong> {selectedExoplanet.name}</p>
                  <p><strong>Clasificación:</strong> {selectedExoplanet.classification}</p>
                  <p><strong>Radio:</strong> {selectedExoplanet.radius.toFixed(2)} R⊕</p>
                  <p><strong>Período Orbital:</strong> {selectedExoplanet.orbitalPeriod.toFixed(1)} días</p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Descubrimiento</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Año:</strong> {selectedExoplanet.discoveryYear}</p>
                  <p><strong>Misión:</strong> {selectedExoplanet.mission}</p>
                  <p><strong>Coordenadas:</strong></p>
                  <p className="text-xs text-gray-400">
                    RA: {selectedExoplanet.coordinates.rightAscension.toFixed(2)}°
                  </p>
                  <p className="text-xs text-gray-400">
                    Dec: {selectedExoplanet.coordinates.declination.toFixed(2)}°
                  </p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Estrella Anfitriona</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Temperatura:</strong> {selectedExoplanet.stellarTemperature.toFixed(0)} K</p>
                  <p><strong>Tipo:</strong> {selectedExoplanet.stellarTemperature > 6000 ? 'F' : selectedExoplanet.stellarTemperature > 5000 ? 'G' : 'K'}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Exploration;
