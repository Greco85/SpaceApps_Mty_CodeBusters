import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Upload, BarChart3, Zap } from 'lucide-react';

const Home: React.FC = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="text-center py-20">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-space font-bold mb-6">
            <span className="text-white">Caza</span>
            <span className="text-exoplanet-orange"> Exoplanetas</span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Descubre planetas fuera de nuestro sistema solar usando inteligencia artificial 
            y datos de las misiones Kepler, K2 y TESS de la NASA.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/analysis"
              className="bg-exoplanet-orange hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <Search className="h-5 w-5" />
              <span>Analizar Datos</span>
            </Link>
            <Link
              to="/dashboard"
              className="bg-space-blue hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <BarChart3 className="h-5 w-5" />
              <span>Ver Estadísticas</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-space font-bold text-center mb-12">
            Características del Sistema
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={Zap}
              title="IA Avanzada"
              description="Modelos de machine learning entrenados con datos reales de la NASA"
            />
            <FeatureCard
              icon={Upload}
              title="Análisis en Tiempo Real"
              description="Sube tus propios datos y obtén resultados instantáneos"
            />
            <FeatureCard
              icon={BarChart3}
              title="Visualización"
              description="Gráficos interactivos de curvas de luz y análisis estadístico"
            />
            <FeatureCard
              icon={Search}
              title="Datos Auténticos"
              description="Basado en misiones reales: Kepler, K2 y TESS"
            />
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-20 bg-space-blue/10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-space font-bold text-center mb-12">
            ¿Cómo Funciona?
          </h2>
          <div className="space-y-8">
            <StepCard
              step="1"
              title="Carga de Datos"
              description="Sube archivos CSV con datos de curvas de luz estelar o utiliza nuestros datasets pre-cargados"
            />
            <StepCard
              step="2"
              title="Procesamiento IA"
              description="Nuestro modelo analiza patrones en los datos para identificar tránsitos planetarios"
            />
            <StepCard
              step="3"
              title="Resultados"
              description="Recibe clasificaciones detalladas: exoplaneta confirmado, candidato o falso positivo"
            />
          </div>
        </div>
      </section>
    </div>
  );
};

interface FeatureCardProps {
  icon: React.ComponentType<any>;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, title, description }) => (
  <div className="bg-space-dark/50 backdrop-blur-sm border border-space-blue/30 rounded-lg p-6 hover:border-exoplanet-orange/50 transition-colors duration-200">
    <Icon className="h-12 w-12 text-exoplanet-orange mb-4" />
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-gray-300">{description}</p>
  </div>
);

interface StepCardProps {
  step: string;
  title: string;
  description: string;
}

const StepCard: React.FC<StepCardProps> = ({ step, title, description }) => (
  <div className="flex items-start space-x-4">
    <div className="flex-shrink-0 w-12 h-12 bg-exoplanet-orange text-white rounded-full flex items-center justify-center font-bold text-lg">
      {step}
    </div>
    <div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-300">{description}</p>
    </div>
  </div>
);

export default Home;
