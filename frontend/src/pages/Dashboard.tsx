import React, { useState } from 'react';
import Chatbot from '../components/Chatbot.tsx';
import Planet3D from '../components/Planet3D.tsx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Globe, Star, Target } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [sampleRows, setSampleRows] = useState<any[] | null>(null);
  const [simResult, setSimResult] = useState<any | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  // Datos de ejemplo - reemplazar con datos reales de la API
  const modelPerformance = [
    { metric: 'Precisión', value: 94.2 },
    { metric: 'Recall', value: 91.8 },
    { metric: 'F1-Score', value: 93.0 },
    { metric: 'AUC-ROC', value: 96.5 },
  ];

  const predictionsByMission = [
    { name: 'Kepler', exoplanets: 120, candidates: 45, false_positives: 15 },
    { name: 'K2', exoplanets: 89, candidates: 32, false_positives: 12 },
    { name: 'TESS', exoplanets: 156, candidates: 67, false_positives: 23 },
  ];

  const discoveryTrend = [
    { year: '2019', discoveries: 45 },
    { year: '2020', discoveries: 67 },
    { year: '2021', discoveries: 89 },
    { year: '2022', discoveries: 112 },
    { year: '2023', discoveries: 134 },
    { year: '2024', discoveries: 156 },
  ];

  const classificationData = [
    { name: 'Exoplanetas Confirmados', value: 365, color: '#10B981' },
    { name: 'Candidatos', value: 144, color: '#FDE047' },
    { name: 'Falsos Positivos', value: 50, color: '#EF4444' },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-4xl font-space font-bold mb-8 text-center">
        Dashboard de Rendimiento
      </h1>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={Target}
          title="Precisión del Modelo"
          value="70%"
          change="+2.1%"
          positive={true}
        />
        <StatCard
          icon={Globe}
          title="Exoplanetas Detectados"
          value="365"
          change="+23 este mes"
          positive={true}
        />
        <StatCard
          icon={Star}
          title="Candidatos Activos"
          value="144"
          change="+8 nuevos"
          positive={true}
        />
        <StatCard
          icon={TrendingUp}
          title="Tasa de Descubrimiento"
          value="12.3/día"
          change="+1.2"
          positive={true}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        {/* Model Performance */}
        <div className="bg-space-dark/50 backdrop-blur-sm border border-space-blue/30 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Rendimiento del Modelo</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={modelPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="metric" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1E3A8A', 
                  border: '1px solid #3B82F6',
                  borderRadius: '8px'
                }} 
              />
              <Bar dataKey="value" fill="#F97316" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Classification Distribution */}
        <div className="bg-space-dark/50 backdrop-blur-sm border border-space-blue/30 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Distribución de Clasificaciones</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={classificationData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {classificationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Mission Comparison */}
      <div className="bg-space-dark/50 backdrop-blur-sm border border-space-blue/30 rounded-lg p-6 mb-8">
        <h3 className="text-xl font-semibold mb-4">Comparación por Misión</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={predictionsByMission}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1E3A8A', 
                border: '1px solid #3B82F6',
                borderRadius: '8px'
              }} 
            />
            <Bar dataKey="exoplanets" stackId="a" fill="#10B981" name="Exoplanetas" />
            <Bar dataKey="candidates" stackId="a" fill="#FDE047" name="Candidatos" />
            <Bar dataKey="false_positives" stackId="a" fill="#EF4444" name="Falsos Positivos" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Discovery Trend */}
      <div className="bg-space-dark/50 backdrop-blur-sm border border-space-blue/30 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">Tendencia de Descubrimientos</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={discoveryTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="year" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1E3A8A', 
                border: '1px solid #3B82F6',
                borderRadius: '8px'
              }} 
            />
            <Bar dataKey="discoveries" fill="#8B5CF6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Chatbot */}
      <div className="mt-8">
        <Chatbot />
      </div>

      {/* Quick CSV simulation test */}
      <div className="mt-8">
        <div className="bg-space-dark/50 backdrop-blur-sm border border-space-blue/30 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-3">Prueba de simulación (CSV de repo)</h3>
          <div className="flex items-center space-x-3 mb-4">
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded"
              onClick={async () => {
                setIsSimulating(true);
                try {
                  // load sample rows
                  const res = await fetch('/api/v1/analysis/sample');
                  if (!res.ok) throw new Error('No se pudo cargar sample');
                  const json = await res.json();
                  const rows = json.rows || [];
                  setSampleRows(rows);
                  if (rows.length > 0) {
                    // simulate using first row
                    const r = rows[0];
                    const payload = {
                      orbital_period: Number(r.orbital_period || r.period || 0),
                      transit_duration: Number(r.transit_duration || r.duration || 0),
                      transit_depth: Number(r.transit_depth || r.depth || 0),
                      stellar_radius: Number(r.stellar_radius || r.radius || 1.0),
                    };
                    const p = await fetch('/api/v1/analysis/predict', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(payload)
                    });
                    if (!p.ok) {
                      const txt = await p.text();
                      throw new Error(`Predict failed: ${p.status} ${txt}`);
                    }
                    const pj = await p.json();
                    setSimResult({
                      prediction: pj.prediction,
                      confidence: pj.confidence,
                      features: {
                        orbital_period: pj.features_analyzed?.orbital_period || payload.orbital_period,
                        transit_duration: pj.features_analyzed?.transit_duration || payload.transit_duration,
                        transit_depth: pj.features_analyzed?.transit_depth || payload.transit_depth,
                        stellar_radius: pj.features_analyzed?.stellar_radius || payload.stellar_radius,
                      }
                    });
                  } else {
                    alert('No hay filas en el CSV de ejemplo');
                  }
                } catch (err: any) {
                  alert('Error simulando: ' + err.message);
                } finally {
                  setIsSimulating(false);
                }
              }}
              disabled={isSimulating}
            >
              {isSimulating ? 'Simulando...' : 'Simular primera fila del CSV'}
            </button>
            <div className="text-sm text-gray-400">{sampleRows ? `${sampleRows.length} filas cargadas` : ''}</div>
          </div>

          {simResult && (
            <div>
              <h4 className="text-lg font-medium mb-2">Resultado de la simulación</h4>
              <div className="mb-4">Predicción: <strong>{simResult.prediction}</strong> — Confianza: {(simResult.confidence*100 || 0).toFixed(1)}%</div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-transparent p-2 rounded">
                  <Planet3D radius={Math.max(6, Math.sqrt(Math.abs(simResult.features.transit_depth || 0.01)) * 60)} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface StatCardProps {
  icon: React.ComponentType<any>;
  title: string;
  value: string;
  change: string;
  positive: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, title, value, change, positive }) => (
  <div className="bg-space-dark/50 backdrop-blur-sm border border-space-blue/30 rounded-lg p-6">
    <div className="flex items-center justify-between mb-4">
      <Icon className="h-8 w-8 text-exoplanet-orange" />
      <span className={`text-sm font-medium ${positive ? 'text-green-400' : 'text-red-400'}`}>
        {change}
      </span>
    </div>
    <h3 className="text-2xl font-bold mb-1">{value}</h3>
    <p className="text-gray-400 text-sm">{title}</p>
  </div>
);

export default Dashboard;


