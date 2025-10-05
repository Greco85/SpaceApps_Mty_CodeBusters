import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
// Se eliminó 'Telescope' y se utilizará 'Layers' para evitar el error de importación.
import { Globe, Star, Target, Layers, Loader, Table, Search, X } from 'lucide-react';

// =========================================================
// LÓGICA DE CONEXIÓN AL BACKEND (Simulada para funcionar aquí)
// =========================================================

/**
 * Función que simula la llamada al endpoint del servidor proxy (Backend).
 * En una aplicación real, se usaría 'fetch(http://localhost:3000/api/exoplanets)'.
 */
const getExoplanetDataFromProxy = async () => {
    // Si tu servidor 'server.js' estuviera corriendo, usarías:
    // const PROXY_SERVER_URL = "http://localhost:3000/api/exoplanets"; 
    // const response = await fetch(PROXY_SERVER_URL);
    // return response.json();

    // -- SIMULACIÓN para que el código funcione en este entorno --
    return new Promise(resolve => {
        setTimeout(() => {
            resolve({
                classification: [
                    { name: 'Exoplanetas Confirmados', value: 2470, color: '#4ade80' },
                    { name: 'Candidatos', value: 1850, color: '#facc15' },
                    { name: 'Falsos Positivos', value: 680, color: '#EF4444' },
                ],
                predictions: [
                    { name: 'Kepler (KOI)', exoplanets: 2470, candidates: 1850, false_positives: 680 },
                    { name: 'K2 (Simulado)', exoplanets: 89, candidates: 32, false_positives: 12 }, 
                    { name: 'TESS (TOI)', exoplanets: 360, candidates: 1500, false_positives: 210 },
                ],
                trend: [
                    { year: '2010', discoveries: 50 },
                    { year: '2011', discoveries: 550 },
                    { year: '2012', discoveries: 900 },
                    { year: '2013', discoveries: 1200 },
                    { year: '2014+', discoveries: 1500 },
                ],
                performance: [
                    { metric: 'Precisión', value: 94.2 }, 
                    { metric: 'Recall', value: 91.8 },    
                    { metric: 'F1-Score', value: 93.0 },  
                    { metric: 'AUC-ROC', value: 96.5 },   
                ],
                tableData: [
                    { pl_name: 'Kepler-186 f', hostname: 'Kepler-186', disc_year: 2014, disc_facility: 'Kepler', pl_radj: 1.11 },
                    { pl_name: 'WASP-12 b', hostname: 'WASP-12', disc_year: 2008, disc_facility: 'WASP', pl_radj: 1.73 },
                    { pl_name: 'HD 209458 b', hostname: 'HD 209458', disc_year: 1999, disc_facility: 'Lick', pl_radj: 1.38 },
                    { pl_name: 'TRAPPIST-1 d', hostname: 'TRAPPIST-1', disc_year: 2016, disc_facility: 'TRAPPIST', pl_radj: 0.77 },
                    { pl_name: '55 Cnc e', hostname: '55 Cnc', disc_year: 2004, disc_facility: 'HET', pl_radj: 0.18 },
                    { pl_name: 'Kepler-22 b', hostname: 'Kepler-22', disc_year: 2011, disc_facility: 'Kepler', pl_radj: 2.4 },
                    { pl_name: 'Proxima Cen b', hostname: 'Proxima Cen', disc_year: 2016, disc_facility: 'La Silla', pl_radj: 0.1 },
                ],
            });
        }, 1000);
    });
};
// =========================================================
// FIN DE LA FUNCIÓN DE CONEXIÓN
// =========================================================


const Dashboard: React.FC = () => {
  // --- ESTADOS DE LA APLICACIÓN ---
  const [viewMode, setViewMode] = useState<'dashboard' | 'table'>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para el Dashboard
  const [modelPerformance, setModelPerformance] = useState<any[]>([]);
  const [predictionsByMission, setPredictionsByMission] = useState<any[]>([]);
  const [discoveryTrend, setDiscoveryTrend] = useState<any[]>([]);
  const [classificationData, setClassificationData] = useState<any[]>([]);

  // Estados para la Tabla Interactiva
  const [tableData, setTableData] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeColumns, setActiveColumns] = useState<string[]>([]);
  
  // Colores y constantes
  const COLORS = {
      EXOPLANET: '#4ade80', // Verde (Confirmado)
      CANDIDATE: '#facc15', // Amarillo (Candidato)
      FALSE_POSITIVE: '#EF4444', // Rojo (Falso Positivo)
      METRICS: '#F97316', // Naranja Exoplanet
      TREND: '#8B5CF6' // Morado
  };
  
  const TABLE_DATA_LIMIT = 200; 

  // --- FUNCIÓN PRINCIPAL PARA CARGAR TODOS LOS DATOS (DESDE EL PROXY SIMULADO) ---
  const fetchAllData = async () => {
    setIsLoading(true);
    // Mensaje que guía al usuario sobre la arquitectura
    setError("ADVERTENCIA: Usando lógica de **Proxy Backend (Simulado)**. En una aplicación real, el servidor proxy definido en 'server.js' superaría las restricciones CORS de la NASA.");
    
    try {
        const data: any = await getExoplanetDataFromProxy(); // Llama a la simulación del backend
        
        // Carga de datos
        setClassificationData(data.classification);
        setDiscoveryTrend(data.trend);
        setPredictionsByMission(data.predictions);
        setModelPerformance(data.performance);

        setTableData(data.tableData);
        // Inicializar las columnas con las claves de los datos
        if (data.tableData.length > 0) {
            setActiveColumns(Object.keys(data.tableData[0]));
        }

    } catch (e) {
        console.error("Error al cargar datos desde el proxy simulado:", e);
        setError("Error al procesar la respuesta del proxy simulado. Por favor, revisa la consola.");
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // --- LÓGICA DE FILTRADO PARA LA TABLA ---
  const filteredTableData = useMemo(() => {
    if (!searchTerm) return tableData;
    const lowerSearchTerm = searchTerm.toLowerCase();

    return tableData.filter(row => {
      // Intenta coincidir con la cadena de búsqueda en CUALQUIER columna
      return Object.values(row).some(value => 
        String(value).toLowerCase().includes(lowerSearchTerm)
      );
    });
  }, [tableData, searchTerm]);

  // --- COMPONENTES AUXILIARES DE LA UI ---

  // Tarjeta de estadísticas (usada en el dashboard)
  interface StatCardProps {
    icon: React.ComponentType<any>;
    title: string;
    value: string;
    change: string;
    positive: boolean;
  }
  const StatCard: React.FC<StatCardProps> = ({ icon: Icon, title, value, change, positive }) => (
    <div className="bg-space-dark/50 backdrop-blur-sm border border-space-blue/30 rounded-xl p-6 shadow-lg hover:border-exoplanet-orange transition duration-300">
      <div className="flex items-center justify-between mb-4">
        <Icon className="h-8 w-8 text-exoplanet-orange" />
        <span className={`text-sm font-bold ${positive ? 'text-planet-green' : 'text-red-400'}`}>
          {change}
        </span>
      </div>
      <h3 className="text-3xl font-extrabold mb-1">{value}</h3>
      <p className="text-gray-400 text-sm">{title}</p>
    </div>
  );

  // Contenedor de gráficos (usado en el dashboard)
  interface ChartContainerProps {
      title: string;
      children: React.ReactNode;
      className?: string;
  }
  const ChartContainer: React.FC<ChartContainerProps> = ({ title, children, className = '' }) => (
      <div className={`bg-space-dark/50 backdrop-blur-sm border border-space-blue/30 rounded-xl p-6 shadow-xl ${className}`}>
          <h3 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-2 flex items-center space-x-2">
              <Layers className="h-5 w-5" />
              <span>{title}</span>
          </h3>
          {children}
      </div>
  );

  // --- VISTA: TABLA INTERACTIVA ---

  const InteractiveTableView: React.FC = () => {
    const handleColumnToggle = (column: string) => {
        setActiveColumns(prev => 
            prev.includes(column) ? prev.filter(c => c !== column) : [...prev, column]
        );
    };

    const allColumns = tableData.length > 0 ? Object.keys(tableData[0]) : [];

    return (
        <div className="p-4">
            <h2 className="text-3xl font-bold mb-6 flex items-center space-x-3 text-exoplanet-orange">
                <Table className="h-7 w-7" />
                <span>Tabla Interactiva: Planetary Systems (PS) - Datos (Simulados vía Proxy)</span>
            </h2>

            <div className="flex flex-col sm:flex-row justify-between items-center bg-gray-800/50 p-4 rounded-lg mb-6 border border-gray-700">
                <div className="relative w-full sm:w-1/3 mb-4 sm:mb-0">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar en la tabla (ej: Kepler-186f, TESS, 2014)..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-600 rounded-lg focus:ring-exoplanet-orange focus:border-exoplanet-orange transition duration-150"
                    />
                    {searchTerm && (
                        <button 
                            onClick={() => setSearchTerm('')} 
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition duration-150"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    )}
                </div>
                <div className="text-sm text-gray-400">
                    Mostrando **{filteredTableData.length}** de {tableData.length} registros (Límite {TABLE_DATA_LIMIT} simulado)
                </div>
            </div>

            {/* Selector de Columnas (Simulado) */}
            <div className="mb-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <h4 className="text-lg font-semibold mb-2 text-white">Seleccionar Columnas ({activeColumns.length}/{allColumns.length})</h4>
                <div className="flex flex-wrap gap-2">
                    {allColumns.map(column => (
                        <button
                            key={column}
                            onClick={() => handleColumnToggle(column)}
                            className={`px-3 py-1 text-sm font-medium rounded-full transition-colors duration-200 ${
                                activeColumns.includes(column)
                                    ? 'bg-exoplanet-orange text-gray-900'
                                    : 'bg-gray-600 text-gray-200 hover:bg-gray-500'
                            }`}
                        >
                            {column.toUpperCase().replace(/_/g, ' ')}
                        </button>
                    ))}
                </div>
            </div>

            {/* Visualización de la Tabla */}
            <div className="overflow-x-auto bg-gray-800/50 rounded-lg shadow-xl border border-gray-700">
                <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-700/70 sticky top-0">
                        <tr>
                            {activeColumns.map(column => (
                                <th 
                                    key={column} 
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap cursor-pointer hover:bg-gray-600 transition duration-150"
                                    // Aquí iría la lógica de ordenación (double-click to sort)
                                >
                                    {column.toUpperCase().replace(/_/g, ' ')}
                                    {/* Icono de ordenación: ASC/DESC */}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {filteredTableData.map((row, index) => (
                            <tr key={index} className="hover:bg-gray-700/50 transition duration-150">
                                {activeColumns.map(column => (
                                    <td key={column} className="px-6 py-4 whitespace-nowrap text-sm font-light text-gray-300">
                                        {row[column] === null || row[column] === undefined ? 
                                            <span className="text-gray-500 italic">null</span> : 
                                            row[column]
                                        }
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {filteredTableData.length === 0 && tableData.length > 0 && (
                <div className="text-center text-gray-500 mt-8 p-6 bg-gray-800/50 rounded-lg border border-gray-700">
                    No se encontraron resultados para la búsqueda "{searchTerm}". Intenta con otro término.
                </div>
            )}
        </div>
    );
  };
  
  // --- VISTA: DASHBOARD DE GRÁFICOS ---

  const DashboardView: React.FC = () => {
      // Obtener los valores para las tarjetas de estadísticas (basado en Kepler)
      const confirmedCount = classificationData.find(c => c.name === 'Exoplanetas Confirmados')?.value || 0;
      const candidateCount = classificationData.find(c => c.name === 'Candidatos')?.value || 0;
      const falsePositiveCount = classificationData.find(c => c.name === 'Falsos Positivos')?.value || 0;
      const totalProcessed = confirmedCount + candidateCount + falsePositiveCount;
      const accuracyValue = modelPerformance.find(m => m.metric === 'Precisión')?.value || 0;
      
      return (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <StatCard
              icon={Target}
              title="Precisión del Modelo (Simulada)"
              value={`${accuracyValue.toFixed(1)}%` || "N/A"}
              change="Modelo V3.1"
              positive={true}
            />
            <StatCard
              icon={Globe}
              title="Exoplanetas Confirmados (Simulados)"
              value={confirmedCount.toString()}
              change={`Total Procesado: ${totalProcessed}`}
              positive={confirmedCount > 0}
            />
            <StatCard
              icon={Star}
              title="Candidatos (Simulados)"
              value={candidateCount.toString()}
              change={`Exo-Candidatos: ${candidateCount}`}
              positive={candidateCount > 0}
            />
            <StatCard
              icon={Layers} // ICONO ACTUALIZADO: Usamos Layers en lugar de Telescope
              title={`Registros Procesados (Simulados)`}
              value={totalProcessed.toString()}
              change="Total Mockeado"
              positive={true}
            />
          </div>

          {/* Charts Grid */}
          <div className="grid lg:grid-cols-2 gap-8 mb-10">
            <ChartContainer title="Métricas de Rendimiento del Modelo (IA Simulado)">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={modelPerformance} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="metric" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                  <Tooltip contentStyle={{ backgroundColor: '#1E3A8A', border: '1px solid #3B82F6', borderRadius: '8px', color: '#fff'}} />
                  <Bar dataKey="value" fill={COLORS.METRICS} radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>

            <ChartContainer title="Distribución de Clasificaciones (Datos Simulados)">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={classificationData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {classificationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>

          <ChartContainer title="Resultados Acumulados por Misión (Datos Simulados)">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={predictionsByMission} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip contentStyle={{ backgroundColor: '#1E3A8A', border: '1px solid #3B82F6', borderRadius: '8px', color: '#fff' }} />
                <Legend verticalAlign="top" height={36} iconType="square" />
                <Bar dataKey="exoplanets" stackId="a" fill={COLORS.EXOPLANET} name="Exoplanetas Confirmados" />
                <Bar dataKey="candidates" stackId="a" fill={COLORS.CANDIDATE} name="Candidatos" />
                <Bar dataKey="false_positives" stackId="a" fill={COLORS.FALSE_POSITIVE} name="Falsos Positivos" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>

          <ChartContainer title="Tendencia de Detección (Datos Simulados)">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={discoveryTrend} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="year" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip formatter={(value: number) => [value, 'Detecciones KOI']} contentStyle={{ backgroundColor: '#1E3A8A', border: '1px solid #3B82F6', borderRadius: '8px', color: '#fff'}} />
                <Bar dataKey="discoveries" fill={COLORS.TREND} radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </>
      );
  };
  
  // --- RENDERIZADO PRINCIPAL ---
  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 text-white font-space bg-gray-900 min-h-screen">
      <script src="https://cdn.tailwindcss.com"></script>
      <style>{`
        .text-planet-green { color: #4ade80; }
        .text-star-yellow { color: #facc15; }
        .text-exoplanet-orange { color: #f97316; }
        .bg-space-dark\/50 { background-color: rgba(13, 17, 23, 0.5); }
        .border-space-blue\/30 { border-color: rgba(59, 130, 246, 0.3); }
        .font-space { font-family: 'Inter', sans-serif; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin 2s linear infinite; }
      `}</style>
      
      <h1 className="text-4xl font-space font-extrabold mb-6 text-center text-white border-b border-gray-700 pb-3">
        Explorador Global de Exoplanetas
      </h1>

      {error && (
          <div className="bg-orange-900/50 border border-orange-400 text-orange-100 p-4 rounded-lg mb-6 flex items-center">
              <span className="font-bold mr-2">¡ADVERTENCIA!</span> {error}
          </div>
      )}

      {/* Selector de Vistas */}
      <div className="flex justify-center mb-8">
          <button 
              onClick={() => setViewMode('dashboard')}
              className={`px-6 py-3 text-lg font-semibold rounded-l-xl transition-all duration-300 flex items-center space-x-2 ${
                  viewMode === 'dashboard' ? 'bg-exoplanet-orange text-gray-900 shadow-xl' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
          >
              <Layers className="h-5 w-5" /> <span>Dashboard (Gráficos)</span>
          </button>
          <button 
              onClick={() => setViewMode('table')}
              className={`px-6 py-3 text-lg font-semibold rounded-r-xl transition-all duration-300 flex items-center space-x-2 ${
                  viewMode === 'table' ? 'bg-exoplanet-orange text-gray-900 shadow-xl' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
          >
              <Table className="h-5 w-5" /> <span>Tabla Interactiva (PS)</span>
          </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-96">
          <Loader className="h-16 w-16 text-exoplanet-orange animate-spin-slow" />
          <p className="mt-4 text-xl text-gray-400">Simulando la carga de datos...</p>
        </div>
      ) : (
        viewMode === 'dashboard' ? <DashboardView /> : <InteractiveTableView />
      )}
    </div>
  );
};

export default Dashboard;