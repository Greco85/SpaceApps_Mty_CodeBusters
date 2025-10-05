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
  const [sampleRows, setSampleRows] = useState<any[] | null>(null);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);

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
        const txt = await res.text();
        throw new Error(`Server error: ${res.status} ${txt}`);
      }

      const json = await res.json();

      // Map backend shape to frontend shape
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

  const loadSample = async () => {
    setIsUploading(true);
    try {
      const res = await fetch('/api/v1/analysis/sample');
      if (!res.ok) throw new Error(`Sample load failed: ${res.status}`);
      const json = await res.json();
      setSampleRows(json.rows || []);
    } catch (err: any) {
      alert('No se pudo cargar sample: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const analyzeRow = async (idx: number) => {
    const row = sampleRows?.[idx];
    if (!row) return;
    setIsUploading(true);
    try {
      const payload = {
        orbital_period: Number(row.orbital_period || row.period || 0),
        transit_duration: Number(row.transit_duration || row.duration || 0),
        transit_depth: Number(row.transit_depth || row.depth || 0),
        stellar_radius: Number(row.stellar_radius || row.radius || 1.0),
        stellar_mass: Number(row.stellar_mass || row.mass || 1.0),
        stellar_temperature: Number(row.stellar_temperature || row.temperature || 5778)
      };

      const res = await fetch('/api/v1/analysis/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Predict failed: ${res.status} ${txt}`);
      }
      const json = await res.json();
      setAnalysisResult({
        prediction: json.prediction,
        confidence: json.confidence,
        features: {
          orbital_period: json.features_analyzed?.orbital_period || payload.orbital_period,
          transit_duration: json.features_analyzed?.transit_duration || payload.transit_duration,
          transit_depth: json.features_analyzed?.transit_depth || payload.transit_depth,
          stellar_radius: json.features_analyzed?.stellar_radius || payload.stellar_radius,
        }
      });
      setSelectedRowIndex(idx);
    } catch (err: any) {
      alert('Error analizando fila: ' + err.message);
    } finally {
      setIsUploading(false);
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

        <div className="mt-4 flex items-center space-x-3">
          <label htmlFor="file-upload" className="cursor-pointer">
            <span className="inline-block px-4 py-2 bg-blue-600 text-white rounded">Seleccionar archivo</span>
          </label>
          <button
            onClick={async () => {
              const el = document.getElementById('file-upload') as HTMLInputElement | null;
              if (el) el.click();
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded"
          >
            Abrir explorador
          </button>
          <button
            onClick={loadSample}
            disabled={isUploading}
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            Cargar CSV de ejemplo
          </button>
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

      {/* Sample rows table */}
      {sampleRows && (
        <div className="bg-space-dark/50 backdrop-blur-sm border border-space-blue/30 rounded-lg p-6 mb-6">
          <h3 className="text-xl font-semibold mb-3">Filas de ejemplo</h3>
          <div className="overflow-auto max-h-60">
            <table className="w-full text-sm table-auto">
              <thead>
                <tr>
                  <th className="p-1">#</th>
                  <th className="p-1">orbital_period</th>
                  <th className="p-1">transit_duration</th>
                  <th className="p-1">transit_depth</th>
                  <th className="p-1">stellar_radius</th>
                  <th className="p-1">Acción</th>
                </tr>
              </thead>
              <tbody>
                {sampleRows.map((r, i) => (
                  <tr key={i} className={i === selectedRowIndex ? 'bg-gray-100' : ''}>
                    <td className="p-1">{i + 1}</td>
                    <td className="p-1">{r.orbital_period ?? r.period ?? ''}</td>
                    <td className="p-1">{r.transit_duration ?? r.duration ?? ''}</td>
                    <td className="p-1">{r.transit_depth ?? r.depth ?? ''}</td>
                    <td className="p-1">{r.stellar_radius ?? r.radius ?? ''}</td>
                    <td className="p-1">
                      <button
                        onClick={() => analyzeRow(i)}
                        className="px-2 py-0.5 bg-indigo-600 text-white rounded"
                      >
                        Analizar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
              {/* Simple inline bar chart */}
              <div className="mt-6">
                <h4 className="text-md font-medium mb-2">Visualización rápida</h4>
                <div className="w-full h-40 bg-space-dark/30 rounded-lg p-4">
                  <svg width="100%" height="100%" viewBox="0 0 400 120">
                    {(() => {
                      const keys = Object.entries(analysisResult.features);
                      const maxVal = Math.max(...keys.map(([,v]) => Number(v)), 1);
                      return keys.map(([k,v], i) => {
                        const x = 20 + i * 90;
                        const barH = (Number(v) / maxVal) * 80;
                        return (
                          <g key={k}>
                            <rect x={x} y={90 - barH} width={50} height={barH} fill="#F97316" rx={4} />
                            <text x={x + 25} y={105} textAnchor="middle" fontSize={10} fill="#E5E7EB">{k}</text>
                            <text x={x + 25} y={85 - barH} textAnchor="middle" fontSize={11} fill="#E5E7EB">{Number(v).toFixed(2)}</text>
                          </g>
                        )
                      })
                    })()}
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Planet simulation */}
          
        </div>
      )}
    </div>
  );
};

// Small helper component for SVG planet simulation


export default Analysis;

