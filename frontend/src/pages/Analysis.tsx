import React, { useState } from 'react';
import { Upload, FileText, BarChart3, AlertCircle, Type, Lightbulb } from 'lucide-react';

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

const Analysis: React.FC = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Nuevo estado para el input manual
  const [manualInput, setManualInput] = useState('');
  const [inputMode, setInputMode] = useState<'file' | 'manual'>('file');
  const [inputError, setInputError] = useState<string | null>(null);


  // --- Lógica de Manejo de Predicción ---
  
  /**
   * Intenta parsear el texto del prompt a un objeto de características válidas.
   * @returns El objeto de características o un mensaje de error.
   */
  const parseManualInput = (input: string) => {
    const featureMap: { [key: string]: number } = {};
    const requiredFeatures = ['orbital_period', 'transit_duration', 'transit_depth', 'stellar_radius'];

    // Utilizamos una expresión regular para encontrar pares clave: valor
    const regex = /(\w+):\s*([\d.]+)/g;
    let match;

    while ((match = regex.exec(input)) !== null) {
      const key = match[1].toLowerCase();
      const value = parseFloat(match[2]);
      
      if (requiredFeatures.includes(key) && !isNaN(value)) {
        featureMap[key] = value;
      }
    }

    // Verificación final: ¿Tenemos todas las características requeridas?
    const missingFeatures = requiredFeatures.filter(feature => !(feature in featureMap));

    if (missingFeatures.length > 0) {
      return `Faltan las siguientes características: ${missingFeatures.join(', ')}.`;
    }
    
    // Si todo es correcto, devuelve el objeto de características completo
    return featureMap as AnalysisResult['features'];
  };

  const simulateAnalysis = (isValid: boolean, parsedFeatures?: AnalysisResult['features']) => {
    setIsUploading(true);
    setAnalysisResult(null);
    setInputError(null);

    setTimeout(() => {
      setIsUploading(false);

      if (!isValid || !parsedFeatures) {
        setAnalysisResult(null);
        setInputError("Datos de entrada inválidos. Asegúrate de que el formato o el prompt cumplen con los requisitos del modelo.");
        return;
      }
      
      // En una implementación real, aquí se llamaría al API con parsedFeatures.
      // Usamos los features parseados para el resultado
      setAnalysisResult({
        prediction: 'exoplanet', // Simulación: siempre es 'exoplanet' si es válido
        confidence: 0.87,
        features: parsedFeatures // <--- Usamos los datos parseados para la visualización
      });
    }, 2000);
  };

  // --- Handlers de UI ---

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Simulación de validación de archivo: solo acepta un nombre 'valid_data.csv'
      const isValidFile = file.name.includes('valid') && file.name.endsWith('.csv'); 
      
      setSelectedFile(file);
      simulateAnalysis(isValidFile);
    }
  };

  const handleManualSubmit = () => {
    if (!manualInput.trim()) {
      setInputError("El prompt no puede estar vacío.");
      return;
    }
    
    const parsedData = parseManualInput(manualInput);

    if (typeof parsedData === 'string') {
      // Es un mensaje de error
      setInputError(parsedData);
      simulateAnalysis(false);
    } else {
      // Es el objeto de características (válido)
      // Ahora enviamos los datos válidos al simulador (que luego sería la API)
      simulateAnalysis(true, parsedData);
    }
  };
  
  // --- Funciones de Estilo y Etiquetado ---

  const getPredictionColor = (prediction: string) => {
    switch (prediction) {
      case 'exoplanet': return 'text-planet-green';
      case 'candidate': return 'text-star-yellow';
      case 'false_positive': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getPredictionLabel = (prediction: string) => {
    switch (prediction) {
      case 'exoplanet': return 'Exoplaneta Confirmado';
      case 'candidate': return 'Candidato a Planeta';
      case 'false_positive': return 'Falso Positivo';
      default: return 'Desconocido';
    }
  };

  // --- Componente Principal ---

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
      <style>{`
        /* Definiciones de color para Tailwind */
        .text-planet-green { color: #4ade80; }
        .text-star-yellow { color: #facc15; }
        .text-exoplanet-orange { color: #f97316; }
        .bg-space-dark { background-color: #0d1117; }
        .border-space-blue { border-color: #3b82f6; }
        .bg-space-blue-light { background-color: #1e3a8a; }
        .font-space { font-family: 'Inter', sans-serif; }
      `}</style>
      
      <h1 className="text-4xl font-space font-bold mb-8 text-center text-white">
        Análisis de Exoplanetas
      </h1>

      {/* Selector de Modo */}
      <div className="flex justify-center mb-6 space-x-4">
        <button
          onClick={() => setInputMode('file')}
          className={`px-4 py-2 rounded-full transition-all duration-300 flex items-center space-x-2 ${
            inputMode === 'file' 
              ? 'bg-exoplanet-orange text-white shadow-lg' 
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          <FileText className="h-5 w-5" />
          <span>Carga de Archivo</span>
        </button>
        <button
          onClick={() => setInputMode('manual')}
          className={`px-4 py-2 rounded-full transition-all duration-300 flex items-center space-x-2 ${
            inputMode === 'manual' 
              ? 'bg-exoplanet-orange text-white shadow-lg' 
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          <Type className="h-5 w-5" />
          <span>Entrada Manual (Prompt)</span>
        </button>
      </div>

      {/* INPUT SECTION - Condicional según inputMode */}
      
      {/* 1. Carga de Archivo */}
      {inputMode === 'file' && (
        <div className="bg-space-dark/50 backdrop-blur-sm border border-space-blue/30 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-4 flex items-center space-x-2 text-white">
            <Upload className="h-6 w-6 text-exoplanet-orange" />
            <span>Cargar Datos</span>
          </h2>
          
          <div className="border-2 border-dashed border-space-blue/50 rounded-lg p-8 text-center hover:border-exoplanet-orange/50 transition-colors duration-200">
            <input
              type="file"
              accept=".csv,.json"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center space-y-4"
            >
              <FileText className="h-12 w-12 text-gray-400" />
              <div>
                <p className="text-lg font-semibold text-white">
                  {selectedFile ? selectedFile.name : 'Selecciona un archivo CSV o JSON'}
                </p>
                <p className="text-gray-400">
                  El archivo debe contener las características necesarias para la predicción.
                </p>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* 2. Entrada Manual (Prompt) */}
      {inputMode === 'manual' && (
        <div className="bg-space-dark/50 backdrop-blur-sm border border-space-blue/30 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-4 flex items-center space-x-2 text-white">
            <Type className="h-6 w-6 text-exoplanet-orange" />
            <span>Ingreso Manual de Características</span>
          </h2>
          
          <div className="mb-4 bg-space-blue-light/50 p-3 rounded-lg flex items-start space-x-2 text-sm text-gray-200">
            <Lightbulb className="h-5 w-5 text-star-yellow mt-0.5 flex-shrink-0" />
            <p>
              **Formato Requerido:** Ingresa los **cuatro** pares clave:valor separados por comas, usando solo números. Ejemplo: "orbital\_period: 12.5, transit\_duration: 3.2, transit\_depth: 0.008, stellar\_radius: 1.1".
            </p>
          </div>

          <textarea
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder="Ingresa los datos para la predicción aquí..."
            rows={4}
            className="w-full p-4 rounded-lg bg-gray-800 text-white border border-gray-600 focus:border-exoplanet-orange focus:ring-1 focus:ring-exoplanet-orange transition-colors"
          />

          <button
            onClick={handleManualSubmit}
            disabled={isUploading || !manualInput.trim()}
            className="mt-4 w-full py-3 rounded-lg bg-exoplanet-orange text-white font-bold hover:bg-exoplanet-orange/90 transition-opacity disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            {isUploading ? 'Analizando...' : 'Analizar Datos Manuales'}
          </button>
        </div>
      )}

      {/* Loading & Error Messages */}
      {isUploading && (
        <div className="mt-4 text-center p-4 bg-gray-800 rounded-lg">
          <div className="inline-flex items-center space-x-2 text-exoplanet-orange">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-exoplanet-orange"></div>
            <span className="text-lg">Analizando datos con el Modelo ML...</span>
          </div>
        </div>
      )}

      {inputError && (
        <div className="mt-4 p-4 bg-red-800/50 border border-red-600 rounded-lg text-red-300 flex items-center space-x-2">
          <AlertCircle className="h-5 w-5" />
          <p>{inputError}</p>
        </div>
      )}

      {/* Results Section */}
      {analysisResult && !isUploading && (
        <div className="bg-space-dark/50 backdrop-blur-sm border border-space-blue/30 rounded-lg p-8">
          <h2 className="text-2xl font-semibold mb-6 flex items-center space-x-2 text-white">
            <BarChart3 className="h-6 w-6 text-exoplanet-orange" />
            <span>Resultados del Análisis</span>
          </h2>

          {/* Prediction */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2 text-gray-300">Clasificación</h3>
            <div className="flex items-center space-x-4">
              <span className={`text-3xl font-bold ${getPredictionColor(analysisResult.prediction)}`}>
                {getPredictionLabel(analysisResult.prediction)}
              </span>
              <span className="text-gray-400 text-xl">
                (Confianza: {(analysisResult.confidence * 100).toFixed(1)}%)
              </span>
            </div>
          </div>

          {/* Features & Interpretation Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-4 text-white">Características Analizadas</h3>
              <div className="space-y-3 p-4 bg-gray-800/50 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-gray-400">Período Orbital:</span>
                  <span className="font-semibold text-white">{analysisResult.features.orbital_period} días</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Duración del Tránsito:</span>
                  <span className="font-semibold text-white">{analysisResult.features.transit_duration} horas</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Profundidad del Tránsito:</span>
                  <span className="font-semibold text-white">{analysisResult.features.transit_depth}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Radio Estelar:</span>
                  <span className="font-semibold text-white">{analysisResult.features.stellar_radius} R☉</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4 text-white">Interpretación del Modelo</h3>
              <div className="bg-space-blue/20 rounded-lg p-4 h-full">
                <AlertCircle className="h-5 w-5 text-exoplanet-orange mb-2" />
                <p className="text-sm text-gray-300">
                  {analysisResult.prediction === 'exoplanet' && 
                    "Los datos muestran patrones consistentes con un tránsito planetario real. El período orbital y la profundidad del tránsito sugieren la presencia de un exoplaneta."
                  }
                  {analysisResult.prediction === 'candidate' && 
                    "Los datos presentan características prometedoras pero requieren observaciones adicionales para confirmación definitiva. Confianza alta pero sin verificación externa."
                  }
                  {analysisResult.prediction === 'false_positive' && 
                    "Los patrones observados probablemente se deban a variabilidad estelar, binarias eclipsantes, o artefactos instrumentales. Se requiere re-observación."
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analysis;