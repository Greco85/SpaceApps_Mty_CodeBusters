import React, { useState } from 'react';
import ExoplanetMap from '../components/ExoplanetMap.tsx';
import { Exoplanet } from '../data/exoplanets.ts';
import { Search, Star, Thermometer, Globe, Zap } from 'lucide-react';

const ExoplanetMapPage: React.FC = () => {
  const [selectedExoplanet, setSelectedExoplanet] = useState<Exoplanet | null>(null);

  const handleExoplanetSelect = (exoplanet: Exoplanet) => {
    setSelectedExoplanet(exoplanet);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Exoplanet Discovery Map
              </h1>
              <p className="text-gray-300">
                Explore discovered exoplanets across the galaxy
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right text-white">
                <div className="text-2xl font-bold">5,000+</div>
                <div className="text-sm text-gray-300">Exoplanets Found</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
          {/* Main Map */}
          <div className="lg:col-span-3">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl overflow-hidden h-full border-0">
              <ExoplanetMap 
                onExoplanetSelect={handleExoplanetSelect}
                selectedExoplanet={selectedExoplanet}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Selected Exoplanet Details */}
            {selectedExoplanet ? (
              <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl p-6 border-0">
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  {selectedExoplanet.name}
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Star className="h-5 w-5 text-yellow-500" />
                    <div>
                      <div className="font-semibold text-gray-800">Discovery Year</div>
                      <div className="text-gray-600">{selectedExoplanet.discoveryYear}</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Globe className="h-5 w-5 text-blue-500" />
                    <div>
                      <div className="font-semibold text-gray-800">Distance</div>
                      <div className="text-gray-600">{selectedExoplanet.distance} light years</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Thermometer className="h-5 w-5 text-red-500" />
                    <div>
                      <div className="font-semibold text-gray-800">Temperature</div>
                      <div className="text-gray-600">{selectedExoplanet.temperature}K</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Zap className="h-5 w-5 text-green-500" />
                    <div>
                      <div className="font-semibold text-gray-800">Habitable</div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        selectedExoplanet.habitable 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedExoplanet.habitable ? 'Yes' : 'No'}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="font-semibold text-gray-800">Mass</div>
                        <div className="text-gray-600">{selectedExoplanet.mass} M⊕</div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">Radius</div>
                        <div className="text-gray-600">{selectedExoplanet.radius} R⊕</div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">Orbital Period</div>
                        <div className="text-gray-600">{selectedExoplanet.orbitalPeriod} days</div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">Star Type</div>
                        <div className="text-gray-600">{selectedExoplanet.starType}</div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="font-semibold text-gray-800 mb-2">Description</div>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {selectedExoplanet.description}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl p-6 border-0">
                <div className="text-center">
                  <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    Select an Exoplanet
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Click on any exoplanet marker on the map to view detailed information.
                  </p>
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl p-6 border-0">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Stats</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Exoplanets</span>
                  <span className="font-semibold">25</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Habitable</span>
                  <span className="font-semibold text-green-600">21</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Transit Method</span>
                  <span className="font-semibold">17</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Radial Velocity</span>
                  <span className="font-semibold">8</span>
                </div>
              </div>
            </div>

            {/* Discovery Timeline */}
            <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl p-6 border-0">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Discovery Timeline</h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">2020</span>
                  <span className="font-medium">TOI-700d</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">2019</span>
                  <span className="font-medium">GJ 357d</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">2017</span>
                  <span className="font-medium">TRAPPIST-1e</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">2016</span>
                  <span className="font-medium">Proxima Centauri b</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">2015</span>
                  <span className="font-medium">Kepler-452b</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">2014</span>
                  <span className="font-medium">Kepler-186f</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">2013</span>
                  <span className="font-medium">Kepler-62e/f</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">2011</span>
                  <span className="font-medium">Kepler-22b</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExoplanetMapPage;
