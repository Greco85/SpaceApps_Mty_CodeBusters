import React, { useEffect, useState } from 'react';
import Planet3D from '../components/Planet3D.tsx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Globe, Star, Target, AlertTriangle } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [simResult, setSimResult] = useState<any | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [stats, setStats] = useState<any | null>(null);
  const [missions, setMissions] = useState<any[] | null>(null);
  const [trends, setTrends] = useState<any[] | null>(null);
  const [missionTrends, setMissionTrends] = useState<Record<string, any[]> | null>({});
  const [selectedTrendYear, setSelectedTrendYear] = useState<number | null>(null);
  const [performance, setPerformance] = useState<any | null>(null);
  const [recent, setRecent] = useState<any[] | null>(null);
  const [batchResults, setBatchResults] = useState<Array<{planet: string, result: string, confidence?: number | null, true_label?: string | null, raw?: any}> | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [useCsvGroundTruth, setUseCsvGroundTruth] = useState<boolean>(false);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [batchGroups, setBatchGroups] = useState<{exoplanet: number, candidate: number, false_positive: number} | null>(null);
  const [batchAccuracy, setBatchAccuracy] = useState<number | null>(null);
  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  // removed enforceTemplate toggle (button) per UX request

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
                // If a model is selected, ensure the uploaded CSV filename matches the model's expected mission
                if (!selectedModel) {
                  if (!window.confirm('No seleccionaste un modelo. Deseas continuar?')) {
                    return;
                  }
                } else {
                  try {
                    const fname = (input.files[0] && input.files[0].name) ? String(input.files[0].name).toLowerCase() : '';
                    const sm = String(selectedModel).toLowerCase();
                    let expected: string | null = null;
                    if (sm.includes('kepler')) expected = 'kepler';
                    else if (sm.includes('k2')) expected = 'k2';
                    else if (sm.includes('tess')) expected = 'tess';

                    if (expected) {
                      if (!fname.includes(expected)) {
                        alert(`El archivo CSV no coincide con la plantilla seleccionada (${expected.toUpperCase()}). Por favor selecciona el CSV correcto o cambia el modelo.`);
                        return;
                      }
                    } else {
                      // Unknown model name - be conservative and block the upload
                      alert('Modelo seleccionado no reconocido. Selecciona un modelo válido (kepler, k2, tess).');
                      return;
                    }
                  } catch (e) {
                    // If any unexpected issue happens while checking, block to be safe
                    alert('Error al verificar el archivo y el modelo. Asegúrate de seleccionar un archivo CSV y un modelo válidos.');
                    return;
                  }
                }
                const f = input.files[0];
                const fd = new FormData();
                fd.append('file', f);
                if (selectedModel) fd.append('model', selectedModel);
                // template enforcement toggle removed; always send model if selected
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
                      flat.push({ 
                        planet: r.planet || (r.input && (r.input.pl_name || r.input.name)) || 'unknown', 
                        result: r.prediction || 'error',
                        confidence: typeof r.confidence === 'number' ? r.confidence : null,
                        true_label: r.true_label || null,
                        raw: r.input || null
                      } as any);
                    }
                    // Prefer server-provided CSV counts (ground-truth) so numbers match the mission graphs and Exploration analysis
                    if (json.csv_counts) {
                      const csv = json.csv_counts;
                      const counts = {
                        exoplanet: typeof csv.exoplanet === 'number' ? csv.exoplanet : 0,
                        candidate: typeof csv.candidate === 'number' ? csv.candidate : 0,
                        false_positive: typeof csv.false_positive === 'number' ? csv.false_positive : 0
                      };
                      setBatchGroups(counts);
                      setUseCsvGroundTruth(true);
                    } else if (json.predicted_counts) {
                      const p = json.predicted_counts;
                      const counts = {
                        exoplanet: typeof p.exoplanet === 'number' ? p.exoplanet : 0,
                        candidate: typeof p.candidate === 'number' ? p.candidate : 0,
                        false_positive: typeof p.false_positive === 'number' ? p.false_positive : 0
                      };
                      setBatchGroups(counts);
                      setUseCsvGroundTruth(false);
                    } else if (json.groups) {
                      const counts = {
                        exoplanet: (json.groups.exoplanet || []).length,
                        candidate: (json.groups.candidate || []).length,
                        false_positive: (json.groups.false_positive || []).length
                      };
                      setBatchGroups(counts);
                      setUseCsvGroundTruth(false);
                    } else {
                      // Final fallback: compute counts from predicted rows
                      const counts = { exoplanet: 0, candidate: 0, false_positive: 0 };
                      for (const r of flat) {
                        if (r.result === 'exoplanet') counts.exoplanet++;
                        else if (r.result === 'candidate') counts.candidate++;
                        else if (r.result === 'false_positive') counts.false_positive++;
                      }
                      setBatchGroups(counts);
                      setUseCsvGroundTruth(false);
                    }

                    // compute average model confidence across rows if available
                    let sumConf = 0, confCount = 0;
                    if (json.rows) {
                      for (const rowItem of json.rows) {
                        if (typeof rowItem.confidence === 'number' && isFinite(rowItem.confidence)) {
                          sumConf += rowItem.confidence;
                          confCount++;
                        }
                      }
                    }
                    const avgConfidence = confCount > 0 ? (sumConf / confCount) : null;
                    setBatchAccuracy(avgConfidence);
                    } else if (json.prediction) {
                    // single-row legacy response
                    flat.push({ planet: 'row_1', result: json.prediction });
                    setBatchGroups({ exoplanet: json.prediction === 'exoplanet' ? 1 : 0, candidate: json.prediction === 'candidate' ? 1 : 0, false_positive: json.prediction === 'false_positive' ? 1 : 0 });
                    setBatchAccuracy(null);
                  }
                  setBatchResults(flat);
                    // After a successful upload, try to detect mission from filename and refresh mission/stats/trends
                    try {
                      const fName = f && f.name ? String(f.name).toLowerCase() : '';
                      let missionKey: string | null = null;
                      if (fName.includes('kepler')) missionKey = 'kepler';
                      else if (fName.includes('k2')) missionKey = 'k2';
                      else if (fName.includes('tess')) missionKey = 'tess';

                      // Refresh missions and stats so numbers agree across the dashboard
                      try {
                        const [mRes2, sRes2] = await Promise.all([
                          fetch('/api/v1/dashboard/missions'),
                          fetch('/api/v1/dashboard/stats')
                        ]);
                        if (mRes2.ok) setMissions(await mRes2.json());
                        if (sRes2.ok) setStats(await sRes2.json());
                      } catch (e) {
                        // ignore refresh errors
                      }

                      if (missionKey) {
                        try {
                          const tRes = await fetch(`/api/v1/dashboard/trends?mission=${missionKey}`);
                          if (tRes.ok) {
                            const tJson = await tRes.json();
                            setMissionTrends(prev => ({ ...(prev || {}), [missionKey!]: tJson }));
                          }
                        } catch (e) {
                          // ignore
                        }
                      }
                    } catch (e) {
                      // non-critical
                    }
                } catch (err: any) {
                  alert('Error subiendo archivo: ' + String(err));
                }
              }}
            >
              Subir y Analizar
            </button>
            {/* plantilla toggle removed per request */}
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
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="text-sm text-gray-300">Listado de resultados</div>
                  </div>
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full align-middle">
                <div className="overflow-y-auto max-h-80 border border-space-blue/30 rounded">
                   <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-space-dark/60 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-300">#</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-300">Planeta</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-300">Resultado</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-300">Confianza</th>
                        </tr>
                    </thead>
                    <tbody className="bg-transparent divide-y divide-gray-700">
                      {batchResults && batchResults.length > 0 ? (
                        batchResults
                          .filter((row) => {
                            if (!filterCategory) return true;
                            if (useCsvGroundTruth) {
                              const key = (row.true_label && String(row.true_label)) || '';
                              return String(key) === filterCategory;
                            }
                            const key = (row.result && String(row.result)) || '';
                            return String(key) === filterCategory;
                          })
                          .map((row, idx) => {
                            const uid = `${row.planet}-${idx}`;
                            const isExpanded = !!expandedRows[uid];
                            return (
                              <React.Fragment key={uid}>
                                <tr className={`hover:bg-space-blue/10 ${isExpanded ? 'bg-space-blue/5' : ''}`} onClick={() => setExpandedRows(prev => ({ ...prev, [uid]: !prev[uid] }))} role="button">
                                  <td className="px-4 py-2 text-sm text-gray-400">{idx + 1}</td>
                                  <td className="px-4 py-2 text-sm text-gray-200">{row.planet}</td>
                                  <td className={`px-4 py-2 text-sm ${row.result === 'exoplanet' ? 'text-green-400' : (row.result === 'candidate' ? 'text-yellow-300' : 'text-red-400')}`}>
                                    {row.result}
                                  </td>
                                  <td className="px-4 py-2 text-sm text-right text-gray-300">{row.confidence !== null && row.confidence !== undefined ? formatConfidence(row.confidence) : '-'}</td>
                                </tr>
                                {isExpanded ? (
                                  <tr className="bg-space-dark/60">
                                    <td colSpan={4} className="px-4 py-2 text-xs text-gray-300">
                                      <pre className="whitespace-pre-wrap">{JSON.stringify(row.raw || row, null, 2)}</pre>
                                    </td>
                                  </tr>
                                ) : null}
                              </React.Fragment>
                            );
                          })
                      ) : (
                        <tr><td colSpan={4} className="px-4 py-4 text-sm text-gray-400">No hay resultados aún. Sube un CSV.</td></tr>
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

      {/* Discovery Trend */}
        <div className="bg-space-dark/50 backdrop-blur-sm border border-space-blue/30 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">Tendencia de Descubrimientos (k2)</h3>
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

      <div style={{ height: 32 }} />

      {/* Mission Comparison (dynamic per-upload): show 3 slots for kepler/k2/tess; charts load when CSV is uploaded and analyzed */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Comparación por Misión</h3>
        <div className="grid lg:grid-cols-3 gap-4">
          {['kepler','k2','tess'].map((m) => {
            const title = m === 'kepler' ? 'Kepler' : (m === 'k2' ? 'K2' : 'TESS');
            const info = missions ? missions.find((mm:any) => (mm.mission || '').toLowerCase() === (m === 'k2' ? 'k2' : m)) : null;
            const hasData = missionTrends && (missionTrends as any)[m] && (missionTrends as any)[m].length > 0;
            const exoplanets = hasData ? (info ? info.exoplanets : 0) : '-';
            const candidates = hasData ? (info ? info.candidates : 0) : '-';
            const falsePos = hasData ? (info ? info.false_positives : 0) : '-';

            const dataCounts = hasData ? [
              { category: 'Exoplanetas', value: exoplanets },
              { category: 'Candidatos', value: candidates },
              { category: 'Falsos Positivos', value: falsePos }
            ] : [];

            const colors = ['#10B981', '#FDE047', '#EF4444'];

            return (
              <div key={m} className="bg-space-dark/50 backdrop-blur-sm border border-space-blue/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-lg font-semibold">{title}</h4>
                </div>

                {hasData ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={dataCounts} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="category" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip contentStyle={{ backgroundColor: '#1E3A8A', border: '1px solid #3B82F6', borderRadius: '8px' }} />
                      <Bar dataKey="value">
                        {dataCounts.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={colors[idx % colors.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[180px] flex items-center justify-center text-gray-400">
                    <div className="text-sm">Sin datos.</div>
                  </div>
                )}

                <div className="mt-3 grid grid-cols-3 gap-2 text-sm text-gray-300">
                  <div className="text-center">
                    <div className="text-xs">Exoplanetas</div>
                    <div className="text-green-400 font-semibold">{exoplanets}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs">Candidatos</div>
                    <div className="text-yellow-300 font-semibold">{candidates}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs">Falsos Positivos</div>
                    <div className="text-red-400 font-semibold">{falsePos}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
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


