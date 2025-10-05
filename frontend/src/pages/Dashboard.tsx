import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, Star, AlertTriangle, Database, Brain, Target, Activity } from 'lucide-react';

interface DashboardStats {
  total_analyzed: number;
  confirmed: number;
  candidates: number;
  false_positives: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
}

interface MissionData {
  mission: string;
  count: number;
}

interface DiscoveryTrend {
  year: string;
  discoveries: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    total_analyzed: 0,
    confirmed: 0,
    candidates: 0,
    false_positives: 0,
    accuracy: 0,
    precision: 0,
    recall: 0,
    f1_score: 0
  });

  const [missionData, setMissionData] = useState<MissionData[]>([]);
  const [discoveryTrends, setDiscoveryTrends] = useState<DiscoveryTrend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Cargar estadísticas de MongoDB
      const statsResponse = await fetch('http://localhost:8000/api/v1/dashboard/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Cargar datos de misiones
      const missionsResponse = await fetch('http://localhost:8000/api/v1/dashboard/missions');
      if (missionsResponse.ok) {
        const missionsData = await missionsResponse.json();
        setMissionData(missionsData);
      }

      // Cargar tendencias de descubrimiento
      const trendsResponse = await fetch('http://localhost:8000/api/v1/dashboard/discovery-trends');
      if (trendsResponse.ok) {
        const trendsData = await trendsResponse.json();
        setDiscoveryTrends(trendsData);
      }

    } catch (error) {
      console.error('Error cargando datos del dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  if (loading) {
    return (
      <div className="min-h-screen bg-space-dark text-white pt-16">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-exoplanet-orange"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-space-dark text-white pt-16">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-space font-bold mb-2 flex items-center space-x-3">
            <Database className="h-10 w-10 text-exoplanet-orange" />
            <span>Dashboard de Exoplanetas</span>
          </h1>
          <p className="text-gray-400">Estadísticas en tiempo real de la base de datos MongoDB Atlas</p>
        </div>

        {/* Métricas principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-space-dark/50 backdrop-blur-sm border border-space-blue/30 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Analizado</p>
                <p className="text-3xl font-bold text-white">{(stats.total_analyzed || 0).toLocaleString()}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-space-dark/50 backdrop-blur-sm border border-space-blue/30 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Confirmados</p>
                <p className="text-3xl font-bold text-green-400">{(stats.confirmed || 0).toLocaleString()}</p>
              </div>
              <Star className="h-8 w-8 text-green-400" />
            </div>
          </div>

          <div className="bg-space-dark/50 backdrop-blur-sm border border-space-blue/30 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Candidatos</p>
                <p className="text-3xl font-bold text-yellow-400">{(stats.candidates || 0).toLocaleString()}</p>
              </div>
              <Users className="h-8 w-8 text-yellow-400" />
            </div>
          </div>

          <div className="bg-space-dark/50 backdrop-blur-sm border border-space-blue/30 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Falsos Positivos</p>
                <p className="text-3xl font-bold text-red-400">{(stats.false_positives || 0).toLocaleString()}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
          </div>
        </div>

        {/* Métricas del modelo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-space-dark/50 backdrop-blur-sm border border-space-blue/30 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Precisión</p>
                <p className="text-3xl font-bold text-blue-400">{(stats.precision || 0).toFixed(1)}%</p>
              </div>
              <Target className="h-8 w-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-space-dark/50 backdrop-blur-sm border border-space-blue/30 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Recall</p>
                <p className="text-3xl font-bold text-purple-400">{(stats.recall || 0).toFixed(1)}%</p>
              </div>
              <Brain className="h-8 w-8 text-purple-400" />
            </div>
          </div>

          <div className="bg-space-dark/50 backdrop-blur-sm border border-space-blue/30 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">F1-Score</p>
                <p className="text-3xl font-bold text-indigo-400">{(stats.f1_score || 0).toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-indigo-400" />
            </div>
          </div>

          <div className="bg-space-dark/50 backdrop-blur-sm border border-space-blue/30 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Exactitud</p>
                <p className="text-3xl font-bold text-exoplanet-orange">{(stats.accuracy || 0).toFixed(1)}%</p>
              </div>
              <Database className="h-8 w-8 text-exoplanet-orange" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Gráfico de barras - Tendencias de descubrimiento */}
          <div className="bg-space-dark/50 backdrop-blur-sm border border-space-blue/30 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4 text-exoplanet-orange">Tendencias de Descubrimiento</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={discoveryTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="year" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }} 
                />
                <Bar dataKey="discoveries" fill="#F97316" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfico circular - Descubrimientos por misión */}
          <div className="bg-space-dark/50 backdrop-blur-sm border border-space-blue/30 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4 text-exoplanet-orange">Descubrimientos por Misión</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={missionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {missionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribución de tamaños */}
        <div className="mt-8 bg-space-dark/50 backdrop-blur-sm border border-space-blue/30 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4 text-exoplanet-orange">Distribución de Clasificaciones</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-300">Exoplanetas Confirmados</span>
                <span className="text-sm text-white font-semibold">{stats.confirmed || 0}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-green-400 h-2 rounded-full" 
                  style={{ width: `${((stats.confirmed || 0) / (stats.total_analyzed || 1)) * 100}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-300">Candidatos</span>
                <span className="text-sm text-white font-semibold">{stats.candidates || 0}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-yellow-400 h-2 rounded-full" 
                  style={{ width: `${((stats.candidates || 0) / (stats.total_analyzed || 1)) * 100}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-300">Falsos Positivos</span>
                <span className="text-sm text-white font-semibold">{stats.false_positives || 0}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-red-400 h-2 rounded-full" 
                  style={{ width: `${((stats.false_positives || 0) / (stats.total_analyzed || 1)) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;