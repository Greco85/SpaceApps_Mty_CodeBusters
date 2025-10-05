import React, { useEffect, useState } from 'react';
import Planet3D from '../components/Planet3D.tsx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Globe, Star, Target } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [simResult, setSimResult] = useState<any | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [stats, setStats] = useState<any | null>(null);
  const [missions, setMissions] = useState<any[] | null>(null);
  const [trends, setTrends] = useState<any[] | null>(null);
  const [performance, setPerformance] = useState<any | null>(null);
  const [recent, setRecent] = useState<any[] | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [sRes, mRes, tRes, pRes, rRes] = await Promise.all([
          fetch('/api/v1/dashboard/stats'),
          fetch('/api/v1/dashboard/missions'),
          fetch('/api/v1/dashboard/trends'),
          fetch('/api/v1/dashboard/model-performance'),
          fetch('/api/v1/dashboard/recent-discoveries')
        ]);

        if (!mounted) return;

        const sJson = sRes.ok ? await sRes.json() : null;
        const mJson = mRes.ok ? await mRes.json() : null;
        const tJson = tRes.ok ? await tRes.json() : null;
        const pJson = pRes.ok ? await pRes.json() : null;
        const rJson = rRes.ok ? await rRes.json() : null;

        setStats(sJson);
        setMissions(mJson);
        setTrends(tJson);
        setPerformance(pJson);
        setRecent(rJson);
      } catch (err) {
        console.error('Error loading dashboard data', err);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

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
            <BarChart data={performance ? [
                { metric: 'Precisión', value: (performance.accuracy || 0) * 100 },
                { metric: 'Precision', value: (performance.precision || 0) * 100 },
                { metric: 'Recall', value: (performance.recall || 0) * 100 },
                { metric: 'F1-Score', value: (performance.f1_score || 0) * 100 }
              ] : []}>
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
                data={missions ? missions.map((m: any) => ({ name: m.mission, value: m.total_discoveries, color: '#6EE7B7' })) : []}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {(missions || []).map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? '#10B981' : (index === 1 ? '#FDE047' : '#EF4444')} />
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
          <BarChart data={missions || []}>
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
          <BarChart data={trends || []}>
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

      {/* Chatbot removed from Dashboard - kept on Exploration page only */}

      {/* Removed CSV simulation and model-specific controls from Dashboard per request */}
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


