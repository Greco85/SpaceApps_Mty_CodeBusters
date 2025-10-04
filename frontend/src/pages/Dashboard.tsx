import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Globe, Star, Target } from 'lucide-react';

const Dashboard: React.FC = () => {
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
          value="94.2%"
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

