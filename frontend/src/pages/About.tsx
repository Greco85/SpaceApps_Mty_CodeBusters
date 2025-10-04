import React from 'react';
import { Rocket, Users, Award, BookOpen } from 'lucide-react';

const About: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-space font-bold mb-8 text-center">
        Acerca del Proyecto
      </h1>

      {/* Mission Section */}
      <section className="mb-12">
        <div className="bg-space-dark/50 backdrop-blur-sm border border-space-blue/30 rounded-lg p-8">
          <h2 className="text-2xl font-semibold mb-4 flex items-center space-x-2">
            <Rocket className="h-6 w-6 text-exoplanet-orange" />
            <span>Nuestra Misión</span>
          </h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            En el marco del NASA Space Apps Challenge 2025, nuestro equipo se ha propuesto revolucionar 
            la detección de exoplanetas utilizando inteligencia artificial. El desafío "A World Away: 
            Hunting for Exoplanets with AI" nos inspira a crear herramientas que aceleren el descubrimiento 
            de mundos más allá de nuestro sistema solar.
          </p>
          <p className="text-gray-300 leading-relaxed">
            Nuestro sistema combina el poder del machine learning con datos auténticos de las misiones 
            Kepler, K2 y TESS para identificar automáticamente patrones de tránsito planetario, 
            reduciendo significativamente el tiempo de análisis manual de los astrónomos.
          </p>
        </div>
      </section>

      {/* Team Section */}
      <section className="mb-12">
        <div className="bg-space-dark/50 backdrop-blur-sm border border-space-blue/30 rounded-lg p-8">
          <h2 className="text-2xl font-semibold mb-6 flex items-center space-x-2">
            <Users className="h-6 w-6 text-exoplanet-orange" />
            <span>Nuestro Equipo</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-exoplanet-orange">Desarrollo Frontend</h3>
              <p className="text-gray-300">
                Interfaz web moderna construida con React y Tailwind CSS, 
                diseñada para ser intuitiva tanto para astrónomos expertos como para estudiantes.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-exoplanet-orange">Machine Learning</h3>
              <p className="text-gray-300">
                Modelos de IA entrenados con datasets reales de la NASA, 
                capaces de clasificar exoplanetas con alta precisión.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-exoplanet-orange">Backend & APIs</h3>
              <p className="text-gray-300">
                Servicios robustos en Python con FastAPI para procesamiento 
                de datos y análisis en tiempo real.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-exoplanet-orange">Visualización de Datos</h3>
              <p className="text-gray-300">
                Gráficos interactivos y dashboards que facilitan la 
                interpretación de resultados y estadísticas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="mb-12">
        <div className="bg-space-dark/50 backdrop-blur-sm border border-space-blue/30 rounded-lg p-8">
          <h2 className="text-2xl font-semibold mb-6 flex items-center space-x-2">
            <BookOpen className="h-6 w-6 text-exoplanet-orange" />
            <span>Tecnologías Utilizadas</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-planet-green mb-3">Frontend</h3>
              <ul className="space-y-1 text-gray-300">
                <li>• React 18 + TypeScript</li>
                <li>• Tailwind CSS</li>
                <li>• React Router</li>
                <li>• Recharts</li>
                <li>• Lucide Icons</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-star-yellow mb-3">Backend</h3>
              <ul className="space-y-1 text-gray-300">
                <li>• Python 3.9+</li>
                <li>• FastAPI</li>
                <li>• SQLAlchemy</li>
                <li>• Pydantic</li>
                <li>• Uvicorn</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-cosmic-purple mb-3">Machine Learning</h3>
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

      {/* Data Sources */}
      <section className="mb-12">
        <div className="bg-space-dark/50 backdrop-blur-sm border border-space-blue/30 rounded-lg p-8">
          <h2 className="text-2xl font-semibold mb-6 flex items-center space-x-2">
            <Award className="h-6 w-6 text-exoplanet-orange" />
            <span>Fuentes de Datos</span>
          </h2>
          <div className="space-y-4">
            <div className="border-l-4 border-exoplanet-orange pl-4">
              <h3 className="font-semibold text-white">NASA Exoplanet Archive</h3>
              <p className="text-gray-300 text-sm">
                Datos confirmados de exoplanetas de todas las misiones de la NASA
              </p>
            </div>
            <div className="border-l-4 border-star-yellow pl-4">
              <h3 className="font-semibold text-white">Kepler Mission Data</h3>
              <p className="text-gray-300 text-sm">
                Observaciones de la misión Kepler (2009-2018)
              </p>
            </div>
            <div className="border-l-4 border-planet-green pl-4">
              <h3 className="font-semibold text-white">TESS Mission Data</h3>
              <p className="text-gray-300 text-sm">
                Datos actuales del Transiting Exoplanet Survey Satellite
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="text-center">
        <div className="bg-gradient-to-r from-exoplanet-orange to-cosmic-purple rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4">¿Listo para Descubrir Nuevos Mundos?</h2>
          <p className="text-white/90 mb-6">
            Únete a nosotros en la búsqueda de exoplanetas y contribuye al avance 
            de la exploración espacial.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/analysis"
              className="bg-white text-exoplanet-orange px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200"
            >
              Comenzar Análisis
            </a>
            <a
              href="https://github.com/your-repo"
              className="bg-transparent border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-exoplanet-orange transition-colors duration-200"
            >
              Ver Código
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
