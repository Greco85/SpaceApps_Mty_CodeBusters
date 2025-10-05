import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Compass, Zap, Search, Rocket, Users, Award, BookOpen, Map, Brain, Code, Database, Download } from 'lucide-react';

const Home: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return (
    <div className="min-h-screen pt-16">
      {/* Hero Section */}
      <section className="relative text-center py-32 overflow-hidden">
        {/* Space Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1446776877081-d282a0f896e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80")'
          }}
        />
        
        {/* Dark Overlay for Text Readability */}
        <div className="absolute inset-0 bg-black/60" />
        
        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-6">
          <h1 className="text-5xl md:text-7xl font-space font-bold mb-6">
            <span className="text-white">Caza</span>
            <span className="text-exoplanet-orange"> Exoplanetas</span>
          </h1>
          <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
            Descubre planetas fuera de nuestro sistema solar usando inteligencia artificial 
            y datos de las misiones Kepler, K2 y TESS de la NASA.
          </p>
          <div className="flex justify-center">
            <Link
              to="/exploration"
              className="bg-exoplanet-orange hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Compass className="h-5 w-5" />
              <span>Explorar Exoplanetas</span>
            </Link>
          </div>
        </div>
        
        {/* Floating Stars Effect */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-gradient-to-br from-space-blue/5 to-cosmic-purple/5">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-space-dark/30 backdrop-blur-sm border border-space-blue/20 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center space-x-2">
              <Rocket className="h-6 w-6 text-exoplanet-orange" />
              <span>Nuestra Misión</span>
            </h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              En el marco del <strong className="text-exoplanet-orange">NASA Space Apps Challenge 2025</strong>, nuestro equipo se ha propuesto revolucionar 
              la detección de exoplanetas utilizando inteligencia artificial. El desafío <strong>"A World Away: 
              Hunting for Exoplanets with AI"</strong> nos inspira a crear herramientas que aceleren el descubrimiento 
              de mundos más allá de nuestro sistema solar.
            </p>
            <p className="text-gray-300 leading-relaxed">
              Nuestro sistema combina el poder del machine learning con datos auténticos de las misiones 
              Kepler, K2 y TESS para identificar automáticamente patrones de tránsito planetario, 
              reduciendo significativamente el tiempo de análisis manual de los astrónomos.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-space-dark/30 backdrop-blur-sm border border-space-blue/20 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-3 flex items-center space-x-2">
                <Rocket className="h-5 w-5 text-exoplanet-orange" />
                <span>Objetivo del Desafío</span>
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Desarrollar herramientas de IA para acelerar el descubrimiento de exoplanetas 
                usando datos reales de las misiones Kepler, K2 y TESS de la NASA.
              </p>
            </div>
            
            <div className="bg-space-dark/30 backdrop-blur-sm border border-space-blue/20 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-3 flex items-center space-x-2">
                <Brain className="h-5 w-5 text-exoplanet-orange" />
                <span>Nuestra Solución</span>
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Sistema completo de análisis con IA, visualización interactiva y 
                interfaz educativa para científicos y estudiantes.
              </p>
            </div>
          </div>
        </div>
      </section>


      {/* Team Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto">
          <div className="bg-space-dark/50 backdrop-blur-sm border border-space-blue/30 rounded-lg p-8">
                <h2 className="text-2xl font-semibold mb-6 flex items-center space-x-2">
                  <Users className="h-6 w-6 text-exoplanet-orange" />
                  <span>Nuestro Equipo - Code Busters</span>
                </h2>
            
            {/* Team Members */}
            <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              <div className="text-center">
                <div className="w-20 h-20 bg-exoplanet-orange/20 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <span className="text-exoplanet-orange font-bold text-lg">G</span>
                </div>
                <h3 className="font-semibold text-white text-sm">Greco Joseth</h3>
                <p className="text-gray-400 text-xs">Rodriguez Gonzalez</p>
                <p className="text-exoplanet-orange text-xs mt-1">Full-Stack Dev</p>
                <button className="mt-2 px-2 py-1 bg-exoplanet-orange/20 hover:bg-exoplanet-orange/30 text-exoplanet-orange text-xs rounded-full transition-colors duration-200 flex items-center space-x-1 mx-auto">
                  <Download className="h-3 w-3" />
                  <span>CV</span>
                </button>
              </div>
              
              <div className="text-center">
                <div className="w-20 h-20 bg-star-yellow/20 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <span className="text-star-yellow font-bold text-lg">J</span>
                </div>
                <h3 className="font-semibold text-white text-sm">Juan Pablo</h3>
                <p className="text-gray-400 text-xs">Developer</p>
                <p className="text-star-yellow text-xs mt-1">Full-Stack Dev</p>
                <button className="mt-2 px-2 py-1 bg-star-yellow/20 hover:bg-star-yellow/30 text-star-yellow text-xs rounded-full transition-colors duration-200 flex items-center space-x-1 mx-auto">
                  <Download className="h-3 w-3" />
                  <span>CV</span>
                </button>
              </div>
              
              <div className="text-center">
                <div className="w-20 h-20 bg-planet-green/20 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <span className="text-planet-green font-bold text-lg">C</span>
                </div>
                <h3 className="font-semibold text-white text-sm">Carlos</h3>
                <p className="text-gray-400 text-xs">Developer</p>
                <p className="text-planet-green text-xs mt-1">Frontend</p>
                <button className="mt-2 px-2 py-1 bg-planet-green/20 hover:bg-planet-green/30 text-planet-green text-xs rounded-full transition-colors duration-200 flex items-center space-x-1 mx-auto">
                  <Download className="h-3 w-3" />
                  <span>CV</span>
                </button>
              </div>
              
              <div className="text-center">
                <div className="w-20 h-20 bg-cosmic-purple/20 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <span className="text-cosmic-purple font-bold text-lg">E</span>
                </div>
                <h3 className="font-semibold text-white text-sm">Evelyn</h3>
                <p className="text-gray-400 text-xs">Developer</p>
                <p className="text-cosmic-purple text-xs mt-1">UI/UX</p>
                <button className="mt-2 px-2 py-1 bg-cosmic-purple/20 hover:bg-cosmic-purple/30 text-cosmic-purple text-xs rounded-full transition-colors duration-200 flex items-center space-x-1 mx-auto">
                  <Download className="h-3 w-3" />
                  <span>CV</span>
                </button>
              </div>
              
              <div className="text-center">
                <div className="w-20 h-20 bg-blue-400/20 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <span className="text-blue-400 font-bold text-lg">A</span>
                </div>
                <h3 className="font-semibold text-white text-sm">Arely Bernal</h3>
                <p className="text-gray-400 text-xs">Developer</p>
                <p className="text-blue-400 text-xs mt-1">UI/UX</p>
                <button className="mt-2 px-2 py-1 bg-blue-400/20 hover:bg-blue-400/30 text-blue-400 text-xs rounded-full transition-colors duration-200 flex items-center space-x-1 mx-auto">
                  <Download className="h-3 w-3" />
                  <span>CV</span>
                </button>
              </div>
              
              <div className="text-center">
                <div className="w-20 h-20 bg-pink-400/20 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <span className="text-pink-400 font-bold text-lg">L</span>
                </div>
                <h3 className="font-semibold text-white text-sm">Linda Margarita</h3>
                <p className="text-gray-400 text-xs">Developer</p>
                <p className="text-pink-400 text-xs mt-1">Data Science</p>
                <button className="mt-2 px-2 py-1 bg-pink-400/20 hover:bg-pink-400/30 text-pink-400 text-xs rounded-full transition-colors duration-200 flex items-center space-x-1 mx-auto">
                  <Download className="h-3 w-3" />
                  <span>CV</span>
                </button>
              </div>
            </div>

            {/* Team Roles */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-exoplanet-orange flex items-center space-x-2">
                  <Map className="h-5 w-5" />
                  <span>Visualización Espacial</span>
                </h3>
                <p className="text-gray-300 text-sm">
                  Mapa interactivo de exoplanetas con datos reales de la NASA, 
                  diseñado para exploración educativa y científica.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-star-yellow flex items-center space-x-2">
                  <Brain className="h-5 w-5" />
                  <span>Machine Learning</span>
                </h3>
                <p className="text-gray-300 text-sm">
                  Modelos de IA entrenados con datasets reales, 
                  capaces de clasificar exoplanetas con alta precisión.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-planet-green flex items-center space-x-2">
                  <Code className="h-5 w-5" />
                  <span>Desarrollo Full-Stack</span>
                </h3>
                <p className="text-gray-300 text-sm">
                  React + FastAPI para una experiencia web moderna, 
                  con APIs robustas para análisis en tiempo real.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-cosmic-purple flex items-center space-x-2">
                  <Database className="h-5 w-5" />
                  <span>Análisis de Datos</span>
                </h3>
                <p className="text-gray-300 text-sm">
                  Procesamiento de +9,600 exoplanetas reales, 
                  con curvas de luz y métricas detalladas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>


        {/* Technologies Section */}
        <section className="py-16 bg-gradient-to-br from-space-blue/5 to-cosmic-purple/5">
          <div className="max-w-6xl mx-auto px-6">
            <h3 className="text-2xl font-bold text-center mb-8 flex items-center justify-center space-x-2">
              <BookOpen className="h-6 w-6 text-exoplanet-orange" />
              <span>Tecnologías Utilizadas</span>
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-space-dark/30 backdrop-blur-sm border border-space-blue/20 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-planet-green mb-3">Frontend</h4>
                <ul className="space-y-1 text-gray-300">
                  <li>• React 18 + TypeScript</li>
                  <li>• Tailwind CSS</li>
                  <li>• React Router</li>
                  <li>• Recharts</li>
                  <li>• Lucide Icons</li>
                </ul>
              </div>
              <div className="bg-space-dark/30 backdrop-blur-sm border border-space-blue/20 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-star-yellow mb-3">Backend</h4>
                <ul className="space-y-1 text-gray-300">
                  <li>• Python 3.9+</li>
                  <li>• FastAPI</li>
                  <li>• SQLAlchemy</li>
                  <li>• Pydantic</li>
                  <li>• Uvicorn</li>
                </ul>
              </div>
              <div className="bg-space-dark/30 backdrop-blur-sm border border-space-blue/20 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-cosmic-purple mb-3">Machine Learning</h4>
                <ul className="space-y-1 text-gray-300">
                  <li>• Scikit-learn</li>
                  <li>• TensorFlow/PyTorch</li>
                  <li>• Pandas</li>
                  <li>• NumPy</li>
                  <li>• Jupyter Notebooks</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-black py-8">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center">
              <p className="text-gray-400">
                © 2025 <span className="text-white font-semibold">Code</span> <span className="text-exoplanet-orange font-semibold">Busters</span> - NASA Space Apps Challenge. Desarrollado con ❤️ en Monterrey, México.
              </p>
            </div>
          </div>
        </footer>
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
