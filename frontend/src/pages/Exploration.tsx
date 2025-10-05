import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Upload, FileText, BarChart3, AlertCircle, Target, Globe, Star, TrendingUp, Zap, Compass, Search, HelpCircle, X, MessageCircle, Send, Minimize2, Bot, Sparkles, Calendar, MapPin, Rocket, Thermometer } from 'lucide-react';
import Chatbot from '../components/Chatbot.tsx';
import ExoplanetMap3D from '../components/ExoplanetMap3D.tsx';
import { exoplanetService, ExoplanetData, ExoplanetStats } from '../services/exoplanetService.ts';

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

const Exploration: React.FC = () => {
  const [exoplanets, setExoplanets] = useState<ExoplanetData[]>([]);
  const [filteredExoplanets, setFilteredExoplanets] = useState<ExoplanetData[]>([]);
  const [selectedClassification, setSelectedClassification] = useState<string>('all');
  const [selectedExoplanet, setSelectedExoplanet] = useState<ExoplanetData | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isExoplanetModalOpen, setIsExoplanetModalOpen] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [stats, setStats] = useState<ExoplanetStats>({
    total: 0,
    exoplanets: 0,
    candidates: 0,
    false_positives: 0,
    precision: 0,
    recall: 0,
    f1Score: 0,
    accuracy: 0
  });
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [uploadErrorDetail, setUploadErrorDetail] = useState<any | null>(null);

  // Load exoplanet data from MongoDB
  useEffect(() => {
    loadExoplanetData();
    loadStatistics();
    // Ensure page starts at top
    window.scrollTo(0, 0);
    // fetch available models for analysis modal
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
  }, []);

  const loadStatistics = async () => {
    try {
      const statistics = await exoplanetService.getExoplanetStats();
      setStats(statistics);
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  // Disable body scroll when modal is open
  useEffect(() => {
    if (isHelpModalOpen || isExoplanetModalOpen || isAnalysisModalOpen || uploadErrorDetail) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isHelpModalOpen, isExoplanetModalOpen, isAnalysisModalOpen, uploadErrorDetail]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isLoading]);

  const loadExoplanetData = async () => {
    try {
      console.log('Cargando datos de exoplanetas desde MongoDB...');
      const exoplanetData = await exoplanetService.getExoplanets('all', 1000);
      console.log('Datos cargados:', exoplanetData.length, 'exoplanetas');
      
      setExoplanets(exoplanetData);
      setFilteredExoplanets(exoplanetData);
    } catch (error) {
      console.error('Error loading exoplanet data from MongoDB:', error);
      
      // Fallback data si MongoDB no está disponible
      const fallbackData: ExoplanetData[] = [
        {
          id: 'kepler-452b',
          name: 'Kepler-452b',
          classification: 'exoplanet',
          coordinates: { rightAscension: 285.546, declination: 44.749 },
          radius: 1.63,
          orbitalPeriod: 384.843,
          discoveryYear: 2015,
          mission: 'Kepler',
          stellarTemperature: 5757
        },
        {
          id: 'toi-715b',
          name: 'TOI-715b',
          classification: 'candidate',
          coordinates: { rightAscension: 120.234, declination: -52.876 },
          radius: 1.55,
          orbitalPeriod: 19.288,
          discoveryYear: 2023,
          mission: 'TESS',
          stellarTemperature: 3930
        }
      ];
      setExoplanets(fallbackData);
      setFilteredExoplanets(fallbackData);
    }
  };

  // Filter exoplanets based on classification
  useEffect(() => {
    if (selectedClassification === 'all') {
      setFilteredExoplanets(exoplanets);
    } else {
      setFilteredExoplanets(exoplanets.filter(ep => ep.classification === selectedClassification));
    }
  }, [selectedClassification, exoplanets]);

  // Handle exoplanet selection
  const handleExoplanetClick = (exoplanet: ExoplanetData) => {
    setSelectedExoplanet(exoplanet);
    setIsExoplanetModalOpen(true);
  };


  // Data for charts
  const discoveryTrendData = [
    { year: '2018', discoveries: 45 },
    { year: '2019', discoveries: 67 },
    { year: '2020', discoveries: 89 },
    { year: '2021', discoveries: 112 },
    { year: '2022', discoveries: 134 },
    { year: '2023', discoveries: 156 },
    { year: '2024', discoveries: 178 }
  ];

  const missionData = [
    { name: 'Kepler', value: 423, color: '#10B981' },
    { name: 'TESS', value: 289, color: '#FDE047' },
    { name: 'K2', value: 156, color: '#3B82F6' },
    { name: 'Otros', value: 379, color: '#8B5CF6' }
  ];

  const sizeDistributionData = [
    { size: 'Super-Tierras', count: 234 },
    { size: 'Neptunos', count: 189 },
    { size: 'Júpiteres', count: 156 },
    { size: 'Tierras', count: 89 },
    { size: 'Sub-Tierras', count: 45 }
  ];

  // Handle CSV upload to MongoDB
  const handleCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsUploading(true);

    try {
      const form = new FormData();
      form.append('file', file, file.name);

      const res = await fetch('http://localhost:8000/api/v1/exoplanets/upload-csv', {
        method: 'POST',
        body: form,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Error del servidor: ${res.status} - ${errorText}`);
      }

      const result = await res.json();
      console.log('Archivo procesado:', result);
      
      // Mostrar resultado
      alert(`Archivo procesado exitosamente!\n\n` +
            `Archivo: ${result.filename}\n` +
            `Misión: ${result.mission_type.toUpperCase()}\n` +
            `Procesados: ${result.total_processed} exoplanetas\n` +
            `Insertados: ${result.inserted} en MongoDB Atlas\n\n` +
            `Recarga la página para ver los nuevos exoplanetas en el mapa.`);
      
      // Recargar datos de exoplanetas
      await loadExoplanetData();
      
    } catch (err: any) {
      console.error('Error subiendo CSV:', err);
      alert('Error procesando archivo CSV: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle file selection (only sets the file, doesn't analyze)
  const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setAnalysisResult(null); // Reset previous results
    }
  };

  // Handle AI analysis (separate function)
  const handleAIAnalysis = async () => {
    if (!selectedFile) {
      alert('Selecciona un archivo primero');
      return;
    }

    if (!selectedModel) {
      alert('Selecciona un modelo primero');
      return;
    }

    setIsUploading(true);

    try {
      const form = new FormData();
      form.append('file', selectedFile, selectedFile.name);

      const res = await fetch('/api/v1/analysis/upload', {
        method: 'POST',
        body: form,
      });

      if (!res.ok) {
        // Try to read json error body for structured missing_columns info
        try {
          const j = await res.json();
          const detail = j?.detail;
          if (detail && detail.error === 'missing_columns') {
            // set state and return immediately so modal shows without relying on async catch timing
            setUploadErrorDetail(detail);
            setIsUploading(false);
            return;
          }
          // fallback: stringify
          throw new Error(`Server error: ${res.status} - ${JSON.stringify(j)}`);
        } catch (e: any) {
          // if parsing failed, throw generic
          throw new Error(`Server error: ${res.status}`);
        }
      }

      const json = await res.json();
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
      
      // Avanzar al paso 3 para mostrar resultados
      setCurrentStep(3);
    } catch (err: any) {
      console.error('Upload error', err);
      alert('Error al procesar el archivo: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = async () => {
    if (!selectedModel) return alert('Selecciona un modelo primero');
    
    try {
      // Descargar plantilla específica desde el backend
      const response = await fetch(`http://localhost:8000/api/v1/analysis/template/${selectedModel}`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      // Obtener el contenido del CSV
      const csvContent = await response.text();
      
      // Crear y descargar archivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `template_${selectedModel}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Error descargando plantilla:', error);
      alert('Error descargando plantilla. Intenta de nuevo.');
    }
  };

  const nextStep = () => {
    setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const resetModal = () => {
    setCurrentStep(1);
    setIsAnalysisModalOpen(false);
    setSelectedFile(null);
    setAnalysisResult(null);
  };

  const handleAddToMap = async () => {
    if (!selectedFile) {
      alert('No hay archivo seleccionado');
      return;
    }

    if (!selectedModel) {
      alert('No hay modelo seleccionado');
      return;
    }

    setIsUploading(true);

    try {
      const form = new FormData();
      form.append('file', selectedFile, selectedFile.name);
      form.append('mission_type', selectedModel); // Agregar el tipo de misión seleccionado

      const res = await fetch('http://localhost:8000/api/v1/exoplanets/upload-csv', {
        method: 'POST',
        body: form,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Error del servidor: ${res.status} - ${errorText}`);
      }

      const result = await res.json();
      console.log('Archivo procesado:', result);
      
      // Mostrar resultado con la misión correcta
      const missionDisplay = selectedModel.toUpperCase();
      alert(`Archivo agregado al mapa exitosamente!\n\n` +
            `Archivo: ${result.filename}\n` +
            `Misión: ${missionDisplay}\n` +
            `Procesados: ${result.total_processed} exoplanetas\n` +
            `Insertados: ${result.inserted} en MongoDB Atlas\n\n` +
            `Recarga la página para ver los nuevos exoplanetas en el mapa.`);
      
      // Recargar datos de exoplanetas
      await loadExoplanetData();
      
      // Cerrar modal
      resetModal();
      
    } catch (err: any) {
      console.error('Error subiendo CSV:', err);
      alert('Error procesando archivo CSV: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };


  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return;
    
    const userMessage = { role: 'user' as const, content: currentMessage };
    setChatMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsLoading(true);

    try {
      const response = await axios.post('/api/v1/chat/message', {
        messages: [...chatMessages, userMessage],
      });

      const botReply = response.data?.reply || 'Sin respuesta';
      const botMessage = { role: 'assistant' as const, content: botReply };
      setChatMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage = { role: 'assistant' as const, content: 'Error: no se pudo conectar al servidor.' };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-space-dark text-white">
      {/* Floating Header */}
      <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-40">
        <div className="flex items-center space-x-4 bg-black/50 backdrop-blur-sm rounded-full px-6 py-3 border border-space-blue/30">
          <h1 className="text-lg font-space font-bold text-white">
            Exploración de Exoplanetas
          </h1>
          <button
            onClick={() => setIsHelpModalOpen(true)}
            className="bg-exoplanet-orange hover:bg-orange-600 text-white p-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-110"
            title="¿Cómo funciona el sistema?"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Help Modal */}
      {isHelpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-space-dark border border-space-blue/30 rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-space-blue/30">
                <h2 className="text-2xl font-space font-bold text-white">
                  ¿Cómo Funciona el Sistema?
                </h2>
                <button
                  onClick={() => setIsHelpModalOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-8">
                {/* Features Section */}
                <section>
                  <h3 className="text-xl font-semibold mb-4 text-exoplanet-orange">
                    Características del Sistema
                  </h3>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="bg-space-dark/50 border border-space-blue/20 rounded-lg p-4">
                      <Zap className="h-8 w-8 text-exoplanet-orange mb-3" />
                      <h4 className="text-lg font-semibold mb-2">IA Avanzada</h4>
                      <p className="text-gray-300 text-sm">Modelos de machine learning entrenados con datos reales de la NASA</p>
                    </div>
                    <div className="bg-space-dark/50 border border-space-blue/20 rounded-lg p-4">
                      <Compass className="h-8 w-8 text-exoplanet-orange mb-3" />
                      <h4 className="text-lg font-semibold mb-2">Exploración Interactiva</h4>
                      <p className="text-gray-300 text-sm">Mapa unificado con análisis, estadísticas y chatbot integrado</p>
                    </div>
                    <div className="bg-space-dark/50 border border-space-blue/20 rounded-lg p-4">
                      <Search className="h-8 w-8 text-exoplanet-orange mb-3" />
                      <h4 className="text-lg font-semibold mb-2">Datos Auténticos</h4>
                      <p className="text-gray-300 text-sm">Basado en misiones reales: Kepler, K2 y TESS</p>
                    </div>
                  </div>
                </section>

                {/* How it Works Section */}
                <section>
                  <h3 className="text-xl font-semibold mb-4 text-exoplanet-orange">
                    ¿Cómo Funciona?
                  </h3>
                  <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-exoplanet-orange text-white rounded-full flex items-center justify-center font-bold">
                        1
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold mb-1">Carga de Datos</h4>
                        <p className="text-gray-300 text-sm">Sube archivos CSV con datos de curvas de luz estelar o utiliza nuestros datasets pre-cargados</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-exoplanet-orange text-white rounded-full flex items-center justify-center font-bold">
                        2
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold mb-1">Procesamiento IA</h4>
                        <p className="text-gray-300 text-sm">Nuestro modelo analiza patrones en los datos para identificar tránsitos planetarios</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-exoplanet-orange text-white rounded-full flex items-center justify-center font-bold">
                        3
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold mb-1">Resultados</h4>
                        <p className="text-gray-300 text-sm">Recibe clasificaciones detalladas: exoplaneta confirmado, candidato o falso positivo</p>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-space-blue/30">
                <button
                  onClick={() => setIsHelpModalOpen(false)}
                  className="w-full bg-exoplanet-orange hover:bg-orange-600 text-white py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Full Screen Map */}
      <div className="fixed inset-0 top-16 w-full h-[calc(100vh-4rem)]">
        <ExoplanetMap3D 
          exoplanets={filteredExoplanets}
          onExoplanetClick={handleExoplanetClick}
          selectedClassification={selectedClassification}
        />
      </div>

      {/* Floating Classification Selector */}
      <div className="fixed top-24 right-6 z-40">
        <select
          value={selectedClassification}
          onChange={(e) => setSelectedClassification(e.target.value)}
          className="bg-black/50 backdrop-blur-sm border border-space-blue/30 rounded-lg px-3 py-2 text-white text-sm font-medium shadow-lg"
        >
          <option value="all">Todos</option>
          <option value="exoplanet">Exoplanetas Confirmados</option>
          <option value="candidate">Candidatos</option>
          <option value="false_positive">Falsos Positivos</option>
        </select>
      </div>

      {/* Floating Analysis Button */}
      <div className="fixed bottom-6 left-6 z-40">
        <button
          onClick={() => setIsAnalysisModalOpen(true)}
          className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-110"
          title="Análisis de Datos"
        >
          <Upload className="h-6 w-6" />
        </button>
      </div>

      {/* Floating Chatbot */}
      <div className="fixed bottom-6 right-6 z-40">
          {!isChatbotOpen ? (
            // Chat Button
            <button
              onClick={() => setIsChatbotOpen(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-110"
              title="Gemini AI Assistant"
            >
              <Bot className="h-6 w-6" />
            </button>
          ) : (
            // Chat Window
            <div className="bg-space-dark border border-space-blue/30 rounded-lg shadow-2xl w-[420px] h-[600px] flex flex-col">
              {/* Chat Header */}
              <div className="flex items-center justify-between p-4 border-b border-space-blue/30 bg-space-dark/80">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <Bot className="h-5 w-5 text-blue-400" />
                    <Sparkles className="h-4 w-4 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Gemini AI</h3>
                    <p className="text-xs text-gray-400">Asistente de Exoplanetas</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsChatbotOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  <Minimize2 className="h-4 w-4" />
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-exoplanet-orange text-white'
                          : 'bg-space-dark/50 text-gray-200 border border-space-blue/20'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-space-dark/50 text-gray-200 border border-space-blue/20 p-3 rounded-lg">
                      <p className="text-sm">Escribiendo...</p>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t border-space-blue/30">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Escribe tu pregunta..."
                    className="flex-1 bg-space-dark/50 border border-space-blue/30 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-exoplanet-orange transition-colors duration-200"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={isLoading}
                    className="bg-exoplanet-orange hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors duration-200"
                  >
                    {isLoading ? (
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

      {/* Modal de Análisis de Datos por Pasos */}
      {isAnalysisModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-space-dark border border-space-blue/30 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-space-blue/30">
              <h2 className="text-xl font-space font-bold text-white flex items-center space-x-2">
                <Upload className="h-5 w-5 text-exoplanet-orange" />
                <span>Análisis de Datos</span>
              </h2>
              <button
                onClick={resetModal}
                className="text-gray-400 hover:text-white transition-colors duration-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Progress Steps */}
            <div className="px-6 py-4 border-b border-space-blue/30">
              <div className="flex items-center justify-between">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      step <= currentStep 
                        ? 'bg-exoplanet-orange text-white' 
                        : 'bg-gray-700 text-gray-400'
                    }`}>
                      {step}
                    </div>
                    <div className="ml-3 hidden sm:block">
                      <p className={`text-sm font-medium ${
                        step <= currentStep ? 'text-white' : 'text-gray-400'
                      }`}>
                        {step === 1 ? 'Seleccionar Modelo' : 
                         step === 2 ? 'Subir Archivo' : 'Ver Resultados'}
                      </p>
                    </div>
                    {step < 3 && (
                      <div className={`w-16 h-0.5 mx-4 ${
                        step < currentStep ? 'bg-exoplanet-orange' : 'bg-gray-700'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Content por Pasos */}
            <div className="p-6">
              {/* Paso 1: Seleccionar Modelo */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-white mb-2">Selecciona el Modelo de IA</h3>
                    <p className="text-gray-400 text-sm">Elige el algoritmo entrenado para tu tipo de datos</p>
                  </div>
                  
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-300">Modelo:</label>
                    <select
                      value={selectedModel || ''}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-600 focus:border-exoplanet-orange focus:outline-none"
                    >
                      <option value="">Selecciona un modelo...</option>
                      {models.map(m => (
                        <option key={m} value={m}>
                          {m.toUpperCase()} - {m === 'tess' ? 'TESS Mission' : m === 'kepler' ? 'Kepler Mission' : m === 'k2' ? 'K2 Mission' : 'Generic Model'}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedModel && (
                    <div className="bg-space-blue/20 rounded-lg p-4">
                      <h4 className="font-semibold text-exoplanet-orange mb-2">Información del Modelo:</h4>
                      <p className="text-sm text-gray-300">
                        {selectedModel === 'tess' && 'Modelo entrenado con datos de la misión TESS de la NASA para detectar exoplanetas en estrellas cercanas.'}
                        {selectedModel === 'kepler' && 'Modelo entrenado con datos de la misión Kepler para identificar tránsitos planetarios.'}
                        {selectedModel === 'k2' && 'Modelo entrenado con datos de la misión K2 para análisis de curvas de luz estelar.'}
                        {selectedModel !== 'tess' && selectedModel !== 'kepler' && selectedModel !== 'k2' && 'Modelo genérico para análisis de exoplanetas.'}
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      onClick={nextStep}
                      disabled={!selectedModel}
                      className="bg-exoplanet-orange hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-semibold transition-colors duration-200"
                    >
                      Continuar
                    </button>
                  </div>
                </div>
              )}

              {/* Paso 2: Subir Archivo */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-white mb-2">Sube tu Archivo CSV</h3>
                    <p className="text-gray-400 text-sm">Selecciona el archivo con los datos del exoplaneta</p>
                  </div>

                  <div className="border-2 border-dashed border-space-blue/50 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept=".csv,.json"
                      onChange={handleFileSelection}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer flex flex-col items-center space-y-3"
                    >
                      <FileText className="h-12 w-12 text-gray-400" />
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {selectedFile ? selectedFile.name : 'Haz clic para seleccionar archivo'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Formatos soportados: CSV, JSON
                        </p>
                      </div>
                    </label>
                  </div>

                  <div className="bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-exoplanet-orange">¿No tienes un archivo?</h4>
                      <button
                        onClick={downloadTemplate}
                        className="text-blue-400 hover:text-blue-300 text-sm underline"
                      >
                        Descargar Plantilla
                      </button>
                    </div>
                    <p className="text-xs text-gray-400">
                      Descarga una plantilla CSV con el formato correcto para {selectedModel?.toUpperCase()} y llénala con tus datos.
                    </p>
                  </div>

                  <div className="flex justify-between">
                    <button
                      onClick={prevStep}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors duration-200"
                    >
                      Anterior
                    </button>
                    <button
                      onClick={handleAIAnalysis}
                      disabled={isUploading || !selectedFile}
                      className="bg-exoplanet-orange hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-semibold transition-colors duration-200"
                    >
                      {isUploading ? 'Analizando...' : 'Analizar con IA'}
                    </button>
                  </div>
                </div>
              )}

              {/* Paso 3: Ver Resultados */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-white mb-2">Resultados del Análisis</h3>
                    <p className="text-gray-400 text-sm">Predicción generada por el modelo de IA</p>
                  </div>

                  {analysisResult ? (
                    <div className="bg-space-blue/20 rounded-lg p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold text-exoplanet-orange mb-3">Predicción Principal</h4>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-300">Clasificación:</span>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                analysisResult.prediction === 'exoplanet' ? 'bg-green-900 text-green-300' :
                                analysisResult.prediction === 'candidate' ? 'bg-yellow-900 text-yellow-300' :
                                'bg-red-900 text-red-300'
                              }`}>
                                {analysisResult.prediction === 'exoplanet' ? 'Exoplaneta Confirmado' :
                                 analysisResult.prediction === 'candidate' ? 'Candidato' :
                                 'Falso Positivo'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-300">Confianza:</span>
                              <span className="text-white font-semibold">
                                {(analysisResult.confidence * 100).toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold text-exoplanet-orange mb-3">Características Analizadas</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Período Orbital:</span>
                              <span className="text-white">{analysisResult.features.orbital_period} días</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Duración Tránsito:</span>
                              <span className="text-white">{analysisResult.features.transit_duration}h</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Profundidad:</span>
                              <span className="text-white">{analysisResult.features.transit_depth}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Radio Estelar:</span>
                              <span className="text-white">{analysisResult.features.stellar_radius} R☉</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-exoplanet-orange mx-auto mb-4"></div>
                      <p className="text-gray-400">Procesando análisis...</p>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <button
                      onClick={prevStep}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors duration-200"
                    >
                      Anterior
                    </button>
                    <div className="space-x-3">
                      <button
                        onClick={handleAddToMap}
                        disabled={isUploading}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-semibold transition-colors duration-200"
                      >
                        {isUploading ? 'Agregando...' : 'Agregar al Mapa'}
                      </button>
                      <button
                        onClick={resetModal}
                        className="bg-exoplanet-orange hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors duration-200"
                      >
                        Nuevo Análisis
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Input oculto para CSV upload */}
      <input
        type="file"
        accept=".csv"
        onChange={handleCSVUpload}
        className="hidden"
        id="csv-upload"
      />

      {/* Upload error modal (missing columns) */}
      {uploadErrorDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-space-dark border border-space-blue/30 rounded-lg max-w-lg w-full mx-4 p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Columnas faltantes en el CSV</h3>
                <p className="text-sm text-gray-400 mt-1">El archivo subido no contiene las columnas requeridas para el análisis.</p>
              </div>
              <button onClick={() => setUploadErrorDetail(null)} className="text-gray-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-gray-900 rounded">
                <h4 className="text-sm font-semibold text-exoplanet-orange">Columnas que faltan</h4>
                <ul className="mt-2 text-sm text-white space-y-1">
                  {(uploadErrorDetail.missing || []).map((m: string, i: number) => (
                    <li key={i} className="pl-2">• {m}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3 bg-gray-900 rounded">
                <h4 className="text-sm font-semibold text-exoplanet-orange">Columnas detectadas en el archivo</h4>
                <div className="mt-2 text-sm text-gray-200 max-h-40 overflow-auto">
                  <pre className="whitespace-pre-wrap">{(uploadErrorDetail.available_columns || []).join(', ')}</pre>
                </div>
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-300 space-y-2">
              <p>Recomendaciones:</p>
              <ul className="list-disc list-inside">
                <li>Revisa el encabezado CSV y asegúrate que incluya: <strong>orbital_period, transit_duration, transit_depth, stellar_radius</strong>.</li>
                <li>Si tus columnas usan otros nombres (por ejemplo <em>period</em>, <em>duration</em>, <em>depth</em>, <em>srad</em>), puedo actualizar la validación para aceptar esos alias; dime los nombres y lo hago.</li>
                <li>Si el CSV tiene líneas de comentario iniciales, remuévelas o sube un CSV limpio que comience en la fila de encabezado.</li>
              </ul>
            </div>

            <div className="mt-6 flex justify-end">
              <button onClick={() => setUploadErrorDetail(null)} className="px-4 py-2 bg-exoplanet-orange hover:bg-orange-600 text-white rounded">Cerrar</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de información del exoplaneta */}
      {isExoplanetModalOpen && selectedExoplanet && (
        <div className="fixed top-20 left-0 right-0 bottom-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="bg-space-dark border border-space-blue/30 rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-space-blue/30">
              <h2 className="text-xl font-space font-bold text-white flex items-center space-x-2">
                <Star className="h-5 w-5 text-exoplanet-orange" />
                <span>Detalles del Exoplaneta</span>
              </h2>
              <button
                onClick={() => setIsExoplanetModalOpen(false)}
                className="text-gray-400 hover:text-white transition-colors duration-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Información Básica */}
                <div className="bg-space-dark/30 rounded-lg p-4 border border-space-blue/20">
                  <h3 className="text-lg font-semibold mb-4 text-exoplanet-orange">Información Básica</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-gray-400 text-sm">Nombre:</span>
                      <p className="text-white font-medium">{selectedExoplanet.name}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm">Clasificación:</span>
                      <div className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        selectedExoplanet.classification === 'exoplanet' ? 'bg-green-900 text-green-300' :
                        selectedExoplanet.classification === 'candidate' ? 'bg-yellow-900 text-yellow-300' :
                        'bg-red-900 text-red-300'
                      }`}>
                        {selectedExoplanet.classification}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm">Radio:</span>
                      <p className="text-white font-medium">{selectedExoplanet.radius.toFixed(2)} R⊕</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm">Período Orbital:</span>
                      <p className="text-white font-medium">{selectedExoplanet.orbitalPeriod.toFixed(1)} días</p>
                    </div>
                  </div>
                </div>

                {/* Descubrimiento */}
                <div className="bg-space-dark/30 rounded-lg p-4 border border-space-blue/20">
                  <h3 className="text-lg font-semibold mb-4 text-exoplanet-orange flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>Descubrimiento</span>
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-gray-400 text-sm">Año:</span>
                      <p className="text-white font-medium">{selectedExoplanet.discoveryYear}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm">Misión:</span>
                      <p className="text-white font-medium flex items-center space-x-1">
                        <Rocket className="h-4 w-4" />
                        <span>{selectedExoplanet.mission}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Coordenadas */}
                <div className="bg-space-dark/30 rounded-lg p-4 border border-space-blue/20">
                  <h3 className="text-lg font-semibold mb-4 text-exoplanet-orange flex items-center space-x-2">
                    <MapPin className="h-4 w-4" />
                    <span>Coordenadas</span>
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-gray-400 text-sm">RA:</span>
                      <p className="text-white font-medium">{selectedExoplanet.coordinates.rightAscension.toFixed(2)}°</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm">Dec:</span>
                      <p className="text-white font-medium">{selectedExoplanet.coordinates.declination.toFixed(2)}°</p>
                    </div>
                  </div>
                </div>

                {/* Estrella Anfitriona */}
                <div className="bg-space-dark/30 rounded-lg p-4 border border-space-blue/20">
                  <h3 className="text-lg font-semibold mb-4 text-exoplanet-orange flex items-center space-x-2">
                    <Thermometer className="h-4 w-4" />
                    <span>Estrella Anfitriona</span>
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-gray-400 text-sm">Temperatura:</span>
                      <p className="text-white font-medium">{selectedExoplanet.stellarTemperature ? selectedExoplanet.stellarTemperature.toFixed(0) + ' K' : 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm">Tipo:</span>
                      <p className="text-white font-medium">F</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-space-blue/30">
              <button
                onClick={() => setIsExoplanetModalOpen(false)}
                className="w-full bg-exoplanet-orange hover:bg-orange-600 text-white py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default Exploration;
