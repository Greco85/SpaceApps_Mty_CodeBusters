import React, { useEffect, useState } from 'react';
import Planet3D from '../components/Planet3D.tsx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Globe, Star, Target, AlertTriangle } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [simResult, setSimResult] = useState<any | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [stats, setStats] = useState<any | null>(null);
  const [missions, setMissions] = useState<any[] | null>(null);
  const [trends, setTrends] = useState<any[] | null>(null);
  const [selectedTrendYear, setSelectedTrendYear] = useState<number | null>(null);
  const [performance, setPerformance] = useState<any | null>(null);
  const [recent, setRecent] = useState<any[] | null>(null);
  const [batchResults, setBatchResults] = useState<Array<{planet: string, result: string}> | null>(null);
  const [batchGroups, setBatchGroups] = useState<{exoplanet: number, candidate: number, false_positive: number} | null>(null);
  const [batchAccuracy, setBatchAccuracy] = useState<number | null>(null);
  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [enforceTemplate, setEnforceTemplate] = useState<boolean>(true);

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
    // fetch models for CSV upload template selection
    (async () => {
      try {
        const res = await fetch('/api/v1/analysis/models');
        if (!res.ok) return;
        const j = await res.json();
        setModels(j.models || []);
        if ((j.models || []).length > 0) setSelectedModel((j.models || [])[0]);
      } catch (e) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Helper to render confidence safely (avoid NaN / Infinity showing as 'NaN%')
  const formatConfidence = (v: number | null) => {
    if (v === null) return '-';
    if (typeof v !== 'number' || !isFinite(v) || Number.isNaN(v)) return '-';
    return `${(v * 100).toFixed(1)}%`;
  };

  // trends data is available for charts; per-card discovery rate removed (not used)



  // --- Precompute StatCard values to avoid inline IIFEs inside JSX (fixes TSX parsing issues) ---
  // Show '-' initially when no dataset has been uploaded (batchResults empty)
  const precisionDisplay = (!batchResults || batchResults.length === 0)
    ? '-'
    : (batchAccuracy !== null
      ? formatConfidence(batchAccuracy)
      : (performance && typeof performance.accuracy === 'number'
        ? formatConfidence(performance.accuracy)
        : '-'));

  const precisionChangeDisplay =
    performance && typeof performance.accuracy_change === 'number'
      ? `${performance.accuracy_change > 0 ? '+' : ''}${(performance.accuracy_change * 100).toFixed(1)}%`
      : '-';

  const precisionPositive =
    performance && typeof performance.accuracy_change === 'number'
      ? performance.accuracy_change >= 0
      : batchAccuracy !== null
      ? batchAccuracy >= 0.5
      : false;

  const getNumericValue = (primary: any, fallback: any) => {
    const v = primary !== undefined && primary !== null ? primary : fallback;
    return v === undefined || v === null ? '-' : String(v);
  };

  const exoplanetsValue = getNumericValue(batchGroups?.exoplanet, stats?.exoplanets_total);
  const candidatesValue = getNumericValue(batchGroups?.candidate, stats?.candidates_total);

  const exoplanetsChange = stats && typeof stats.exoplanets_change_text === 'string' ? stats.exoplanets_change_text : '-';
  const candidatesChangeText = stats && typeof stats.candidates_change_text === 'string' ? stats.candidates_change_text : '-';
  const falsePositivesValue = getNumericValue(batchGroups?.false_positive, stats?.false_positives_total);
  const falsePositivesChange = stats && typeof stats.false_positives_change_text === 'string' ? stats.false_positives_change_text : '-';

  // Annual discovery rate computation (derived from `trends`)
  const byYear: Record<number, number> = {};
  if (trends && trends.length) {
    for (const t of trends) {
      let year: number | null = null;
      if (typeof t.year === 'number') year = t.year;
      else if (t.date) {
        const d = new Date(t.date);
        if (!isNaN(d.getTime())) year = d.getFullYear();
      }
      if (year === null) continue;
      byYear[year] = (byYear[year] || 0) + (Number(t.discoveries) || 0);
    }
  }
  const years = Object.keys(byYear).map(y => parseInt(y, 10)).sort((a, b) => a - b);
  let annualRate: number | null = null;
  let annualChangePercent: number | null = null;
  let annualPositive = false;

  if (years.length > 0) {
    if (selectedTrendYear && byYear[selectedTrendYear] !== undefined) {
      annualRate = byYear[selectedTrendYear];
    } else if (years.length === (trends ? trends.length : 0)) {
      const total = years.reduce((s, y) => s + (byYear[y] || 0), 0);
      annualRate = Math.round(total / years.length);
    } else {
      annualRate = byYear[years[years.length - 1]];
    }

    if (years.length >= 2) {
      const latest = byYear[years[years.length - 1]] || 0;
      const prev = byYear[years[years.length - 2]] || 0;
      if (prev > 0) {
        annualChangePercent = ((latest - prev) / Math.max(1, prev)) * 100;
        annualPositive = annualChangePercent >= 0;
      } else {
        annualChangePercent = null;
        annualPositive = latest >= prev;
      }
    }
  }


  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-4xl font-space font-bold mb-8 text-center">
        Dashboard de Rendimiento
      </h1>

      {/* CSV batch upload and results table (moved to top) */}
      <div className="mt-8">
        <div className="bg-space-dark/50 backdrop-blur-sm border border-space-blue/30 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-3">Subir CSV y ver resultados agrupados</h3>
          <p className="text-sm text-gray-400 mb-4">Sube un CSV y veremos una tabla con dos columnas: Planeta y Resultado (candidate/exoplanet/false_positive).</p>
          <div className="flex items-center space-x-3 mb-4">
            <input id="file-input" type="file" accept=".csv" className="text-sm" />
            <select value={selectedModel || ''} onChange={(e) => setSelectedModel(e.target.value || null)} className="text-sm bg-black/40 border border-space-blue/20 text-white rounded px-2 py-1">
              <option value="">Selecciona modelo</option>
              {models.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded"
              onClick={async () => {
                const input: any = document.getElementById('file-input');
                if (!input || !input.files || input.files.length === 0) {
                  alert('Selecciona un archivo CSV primero');
                  return;
                }
                if (!selectedModel) {
                  if (!window.confirm('No seleccionaste un modelo. Deseas continuar sin plantilla?')) {
                    return;
                  }
                }
                const f = input.files[0];
                const fd = new FormData();
                fd.append('file', f);
                if (selectedModel) fd.append('model', selectedModel);
                if (enforceTemplate && selectedModel) fd.append('template_model', selectedModel);
                try {
                  const res = await fetch('/api/v1/analysis/upload', { method: 'POST', body: fd });
                  if (!res.ok) {
                    const txt = await res.text();
                    alert('Error: ' + txt);
                    return;
                  }
                  const json = await res.json();
                  // Normalize into flat rows with planet + result
                  let flat: Array<{planet: string, result: string}> = [];
                  if (json.rows) {
                    for (const r of json.rows) {
                      flat.push({ planet: r.planet || (r.input && (r.input.pl_name || r.input.name)) || 'unknown', result: r.prediction || 'error' });
                    }
                    // Use groups if provided by backend; otherwise compute counts
                    if (json.groups) {
                      const counts = {
                        exoplanet: (json.groups.exoplanet || []).length,
                        candidate: (json.groups.candidate || []).length,
                        false_positive: (json.groups.false_positive || []).length
                      };
                      setBatchGroups(counts);
                      // compute average model confidence across rows (preferred for 'Confianza')
                      let sumConf = 0, confCount = 0;
                      for (const g of ['exoplanet','candidate','false_positive']) {
                        const arr = json.groups[g] || [];
                        for (const item of arr) {
                          if (typeof item.confidence === 'number' && isFinite(item.confidence)) {
                            sumConf += item.confidence;
                            confCount++;
                          }
                        }
                      }
                      const avgConfidence = confCount > 0 ? (sumConf / confCount) : null;
                      setBatchAccuracy(avgConfidence);
                    } else {
                      const counts = { exoplanet: 0, candidate: 0, false_positive: 0 };
                      let correct = 0, totalWithLabel = 0;
                      for (const r of flat) {
                        if (r.result === 'exoplanet') counts.exoplanet++;
                        else if (r.result === 'candidate') counts.candidate++;
                        else if (r.result === 'false_positive') counts.false_positive++;
                      }
                      setBatchGroups(counts);
                      setBatchAccuracy(null);
                    }
                  } else if (json.prediction) {
                    // single-row legacy response
                    flat.push({ planet: 'row_1', result: json.prediction });
                    setBatchGroups({ exoplanet: json.prediction === 'exoplanet' ? 1 : 0, candidate: json.prediction === 'candidate' ? 1 : 0, false_positive: json.prediction === 'false_positive' ? 1 : 0 });
                    setBatchAccuracy(null);
                  }
                  setBatchResults(flat);
                } catch (err: any) {
                  alert('Error subiendo archivo: ' + String(err));
                }
              }}
            >
              Subir y Analizar
            </button>
            <button className={`px-3 py-2 ${enforceTemplate ? 'bg-green-600' : 'bg-gray-600'} text-white rounded`} onClick={() => setEnforceTemplate(prev => !prev)} title="Enforce template for uploads">
              Plantilla {enforceTemplate ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Resultado summary (four rows) */}
          <div className="mb-4">
            <div className="bg-space-dark/40 border border-space-blue/30 rounded p-4">
              <h4 className="text-lg font-medium mb-3 text-gray-200">Resultado</h4>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-300">
                <div className="font-medium">Exoplanetas</div>
                <div className="text-right text-green-400 font-semibold">{batchGroups ? batchGroups.exoplanet : '-'}</div>

                <div className="font-medium">Falsos positivos</div>
                <div className="text-right text-red-400 font-semibold">{batchGroups ? batchGroups.false_positive : '-'}</div>

                <div className="font-medium">Candidatos</div>
                <div className="text-right text-yellow-300 font-semibold">{batchGroups ? batchGroups.candidate : '-'}</div>

                <div className="font-medium">Confianza</div>
                <div className="text-right text-white font-semibold">{formatConfidence(batchAccuracy)}</div>
              </div>
            </div>
          </div>

          {/* Results table */}
          <div className="mt-4">
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full align-middle">
                <div className="overflow-y-auto max-h-80 border border-space-blue/30 rounded">
                   <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-space-dark/60 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-300">Planeta</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-300">Resultado</th>
                      </tr>
                    </thead>
                    <tbody className="bg-transparent divide-y divide-gray-700">
                      {batchResults && batchResults.length > 0 ? (
                        batchResults.map((row, idx) => (
                          <tr key={idx} className="hover:bg-space-blue/10">
                            <td className="px-4 py-2 text-sm text-gray-200">{row.planet}</td>
                            <td className={`px-4 py-2 text-sm ${row.result === 'exoplanet' ? 'text-green-400' : (row.result === 'candidate' ? 'text-yellow-300' : 'text-red-400')}`}>
                              {row.result}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan={2} className="px-4 py-4 text-sm text-gray-400">No hay resultados aún. Sube un CSV.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add small whitespace at the end of the page */}
      <div style={{ height: 32 }} />

      {/* Stats Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Use precomputed stat values */}
        <>
          <StatCard
            icon={Target}
            title="Precisión del Modelo"
            value={precisionDisplay}
            change={precisionChangeDisplay}
            positive={precisionPositive}
          />
          <StatCard
            icon={Globe}
            title="Exoplanetas Detectados"
            value={exoplanetsValue}
            change={exoplanetsChange}
            positive={batchGroups ? (typeof batchGroups.exoplanet === 'number' ? batchGroups.exoplanet > 0 : false) : false}
          />
          <StatCard
            icon={Star}
            title="Candidatos Activos"
            value={candidatesValue}
            change={candidatesChangeText}
            positive={batchGroups ? (typeof batchGroups.candidate === 'number' ? batchGroups.candidate > 0 : false) : false}
          />
        </>

        {/* False positives stat - interactive, filters results table on click */}
        <StatCard
          icon={AlertTriangle}
          title="Falsos Positivos"
          value={falsePositivesValue}
          change={falsePositivesChange}
          positive={batchGroups ? (typeof batchGroups.false_positive === 'number' ? batchGroups.false_positive === 0 : false) : false}
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

        {/* Distribución de Clasificaciones eliminada (se duplica con Comparación por Misión) */}
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
            <Bar
              dataKey="discoveries"
              fill="#8B5CF6"
              onClick={(data: any, index: number) => {
                try {
                  const year = data && data.year ? data.year : null;
                  if (year) setSelectedTrendYear(year);
                } catch (e) {}
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Add small whitespace at the end of the page */}
      <div style={{ height: 32 }} />

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
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, title, value, change, positive, onClick }) => (
  <div
    className={`bg-space-dark/50 backdrop-blur-sm border border-space-blue/30 rounded-lg p-6 ${onClick ? 'cursor-pointer hover:scale-[1.01] transition-transform' : ''}`}
    onClick={onClick}
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
    onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
  >
    <div className="flex items-center justify-between mb-4">
      <Icon className="h-8 w-8 text-exoplanet-orange" />
      {/* Only render the small change label when a meaningful value exists (hide '-' placeholders) */}
      {change && change !== '-' ? (
        <span className={`text-sm font-medium ${positive ? 'text-green-400' : 'text-red-400'}`}>
          {change}
        </span>
      ) : null}
    </div>
    <h3 className="text-2xl font-bold mb-1">{value}</h3>
    <p className="text-gray-400 text-sm">{title}</p>
  </div>
);

export default Dashboard;


