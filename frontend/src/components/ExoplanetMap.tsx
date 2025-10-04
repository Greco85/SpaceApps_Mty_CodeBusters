import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { sampleExoplanets, Exoplanet, convertToMapCoordinates } from '../data/exoplanets.ts';

// Fix for default markers in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Custom icons for different exoplanet types
const createCustomIcon = (habitable: boolean, radius: number) => {
  const size = Math.max(20, Math.min(40, radius * 15)); // Scale based on radius
  const color = habitable ? '#10b981' : '#ef4444'; // Green for habitable, red for not habitable
  
  return L.divIcon({
    className: 'custom-exoplanet-icon',
    html: `<div style="
      width: ${size}px;
      height: ${size}px;
      background-color: ${color};
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: ${size > 25 ? '12px' : '8px'};
      color: white;
      font-weight: bold;
    ">★</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

// Component to handle map updates
const MapUpdater: React.FC<{ selectedExoplanet: Exoplanet | null }> = ({ selectedExoplanet }) => {
  const map = useMap();

  useEffect(() => {
    if (selectedExoplanet) {
      const [lat, lng] = convertToMapCoordinates(
        selectedExoplanet.coordinates.rightAscension,
        selectedExoplanet.coordinates.declination
      );
      map.setView([lat, lng], 8);
    }
  }, [selectedExoplanet, map]);

  return null;
};

interface ExoplanetMapProps {
  onExoplanetSelect?: (exoplanet: Exoplanet) => void;
  selectedExoplanet?: Exoplanet | null;
}

const ExoplanetMap: React.FC<ExoplanetMapProps> = ({ 
  onExoplanetSelect, 
  selectedExoplanet 
}) => {
  const [filteredExoplanets, setFilteredExoplanets] = useState<Exoplanet[]>(sampleExoplanets);
  const [showHabitableOnly, setShowHabitableOnly] = useState(false);

  // Filter exoplanets based on habitable status
  useEffect(() => {
    if (showHabitableOnly) {
      setFilteredExoplanets(sampleExoplanets.filter(planet => planet.habitable));
    } else {
      setFilteredExoplanets(sampleExoplanets);
    }
  }, [showHabitableOnly]);

  const handleMarkerClick = (exoplanet: Exoplanet) => {
    if (onExoplanetSelect) {
      onExoplanetSelect(exoplanet);
    }
  };

  return (
    <div className="w-full h-full relative">
      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-[1000] bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-4 space-y-3 border-0">
        <h3 className="font-semibold text-gray-800">Map Controls</h3>
        
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={showHabitableOnly}
            onChange={(e) => setShowHabitableOnly(e.target.checked)}
            className="rounded border-gray-300 text-exoplanet-blue focus:ring-exoplanet-blue"
          />
          <span className="text-sm text-gray-700">Show habitable only</span>
        </label>

        <div className="text-xs text-gray-600 space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Habitable</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Non-habitable</span>
          </div>
        </div>
      </div>

      {/* Map */}
      <MapContainer
        center={[0, 0]} // Galactic center
        zoom={2}
        minZoom={0}
        maxZoom={6}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg border-0"
        zoomControl={true}
        scrollWheelZoom={true}
        doubleClickZoom={true}
        dragging={true}
      >
        <TileLayer
          url="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0ic3RhcnMiIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48Y2lyY2xlIGN4PSIxMCIgY3k9IjEwIiByPSIxIiBmaWxsPSIjZmZmZmZmIiBvcGFjaXR5PSIwLjgiLz48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIwLjUiIGZpbGw9IiNmZmZmZmYiIG9wYWNpdHk9IjAuNiIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iMjAiIHI9IjAuOCIgZmlsbD0iI2ZmZmZmZiIgb3BhY2l0eT0iMC43Ii8+PGNpcmNsZSBjeD0iODAiIGN5PSI4MCIgcj0iMC4zIiBmaWxsPSIjZmZmZmZmIiBvcGFjaXR5PSIwLjUiLz48Y2lyY2xlIGN4PSIyMCIgY3k9IjgwIiByPSIxLjIiIGZpbGw9IiNmZmZmZmYiIG9wYWNpdHk9IjAuOSIvPjxjaXJjbGUgY3g9IjkwIiBjeT0iMTUiIHI9IjAuNCIgZmlsbD0iI2ZmZmZmZiIgb3BhY2l0eT0iMC42Ii8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMDAwMDAwIi8+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNzdGFycykiLz48L3N2Zz4="
          attribution=""
        />
        
        <MapUpdater selectedExoplanet={selectedExoplanet} />

        {filteredExoplanets.map((exoplanet) => {
          const [lat, lng] = convertToMapCoordinates(
            exoplanet.coordinates.rightAscension,
            exoplanet.coordinates.declination
          );

          return (
            <Marker
              key={exoplanet.id}
              position={[lat, lng]}
              icon={createCustomIcon(exoplanet.habitable, exoplanet.radius)}
              eventHandlers={{
                click: () => handleMarkerClick(exoplanet),
              }}
            >
              <Popup className="custom-popup">
                <div className="p-2 min-w-[250px]">
                  <h3 className="font-bold text-lg text-gray-800 mb-2">
                    {exoplanet.name}
                  </h3>
                  
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="font-semibold text-gray-600">Discovery:</span>
                        <span className="ml-1">{exoplanet.discoveryYear}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-600">Distance:</span>
                        <span className="ml-1">{exoplanet.distance} ly</span>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-600">Mass:</span>
                        <span className="ml-1">{exoplanet.mass} M⊕</span>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-600">Radius:</span>
                        <span className="ml-1">{exoplanet.radius} R⊕</span>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-600">Period:</span>
                        <span className="ml-1">{exoplanet.orbitalPeriod} days</span>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-600">Temp:</span>
                        <span className="ml-1">{exoplanet.temperature}K</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-semibold text-gray-600">Habitable:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          exoplanet.habitable 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {exoplanet.habitable ? 'Yes' : 'No'}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 text-xs leading-relaxed">
                        {exoplanet.description}
                      </p>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Map Info */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3 border-0">
        <div className="text-xs text-gray-600">
          <div className="font-semibold mb-1">🌌 Galactic Exoplanet Map</div>
          <div>Total exoplanets: {filteredExoplanets.length}</div>
          <div>Habitable: {filteredExoplanets.filter(p => p.habitable).length}</div>
          <div className="mt-1 text-gray-500">
            Click markers for details
          </div>
          <div className="mt-1 text-gray-400 text-xs">
            Coordinates: RA & Dec
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExoplanetMap;
