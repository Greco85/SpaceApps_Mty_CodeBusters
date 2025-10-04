import React, { useState } from 'react';
import { Upload, FileText, BarChart3, AlertCircle } from 'lucide-react';

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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setIsUploading(true);
      
      // Simular análisis (reemplazar con llamada real a la API)
      setTimeout(() => {
        setAnalysisResult({
          prediction: 'exoplanet',
          confidence: 0.87,
          features: {
            orbital_period: 12.5,
            transit_duration: 3.2,
            transit_depth: 0.008,
            stellar_radius: 1.1
          }
        });
        setIsUploading(false);
      }, 2000);
    }
  };

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

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-space font-bold mb-8 text-center">
        Análisis de Exoplanetas
      </h1>

      {/* Upload Section */}
      <div className="bg-space-dark/50 backdrop-blur-sm border border-space-blue/30 rounded-lg p-8 mb-8">
        <h2 className="text-2xl font-semibold mb-4 flex items-center space-x-2">
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
              <p className="text-lg font-semibold">
                {selectedFile ? selectedFile.name : 'Selecciona un archivo CSV'}
              </p>
              <p className="text-gray-400">
                Formatos soportados: CSV, JSON
              </p>
            </div>
          </label>
        </div>

        {isUploading && (
          <div className="mt-4 text-center">
            <div className="inline-flex items-center space-x-2 text-exoplanet-orange">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-exoplanet-orange"></div>
              <span>Analizando datos...</span>
            </div>
          </div>
        )}
      </div>

      {/* Results Section */}
      {analysisResult && (
        <div className="bg-space-dark/50 backdrop-blur-sm border border-space-blue/30 rounded-lg p-8">
          <h2 className="text-2xl font-semibold mb-6 flex items-center space-x-2">
            <BarChart3 className="h-6 w-6 text-exoplanet-orange" />
            <span>Resultados del Análisis</span>
          </h2>

          {/* Prediction */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Clasificación</h3>
            <div className="flex items-center space-x-4">
              <span className={`text-2xl font-bold ${getPredictionColor(analysisResult.prediction)}`}>
                {getPredictionLabel(analysisResult.prediction)}
              </span>
              <span className="text-gray-400">
                (Confianza: {(analysisResult.confidence * 100).toFixed(1)}%)
              </span>
            </div>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Características Analizadas</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Período Orbital:</span>
                  <span className="font-semibold">{analysisResult.features.orbital_period} días</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Duración del Tránsito:</span>
                  <span className="font-semibold">{analysisResult.features.transit_duration} horas</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Profundidad del Tránsito:</span>
                  <span className="font-semibold">{analysisResult.features.transit_depth}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Radio Estelar:</span>
                  <span className="font-semibold">{analysisResult.features.stellar_radius} R☉</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Interpretación</h3>
              <div className="bg-space-blue/20 rounded-lg p-4">
                <AlertCircle className="h-5 w-5 text-exoplanet-orange mb-2" />
                <p className="text-sm text-gray-300">
                  {analysisResult.prediction === 'exoplanet' && 
                    "Los datos muestran patrones consistentes con un tránsito planetario real. El período orbital y la profundidad del tránsito sugieren la presencia de un exoplaneta."
                  }
                  {analysisResult.prediction === 'candidate' && 
                    "Los datos presentan características prometedoras pero requieren observaciones adicionales para confirmación definitiva."
                  }
                  {analysisResult.prediction === 'false_positive' && 
                    "Los patrones observados probablemente se deben a variabilidad estelar, binarias eclipsantes, o artefactos instrumentales."
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
