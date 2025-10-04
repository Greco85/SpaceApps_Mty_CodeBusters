import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Home, BarChart3, Info, Map } from 'lucide-react';

const Navbar: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Inicio', icon: Home },
    { path: '/analysis', label: 'Análisis', icon: Search },
    { path: '/map', label: 'Mapa', icon: Map },
    { path: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { path: '/about', label: 'Acerca de', icon: Info },
  ];

  return (
    <nav className="bg-space-dark/90 backdrop-blur-sm border-b border-space-blue/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Search className="h-8 w-8 text-exoplanet-orange" />
            <span className="text-xl font-space font-bold text-white">
              Exoplanet Hunter
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex space-x-8">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors duration-200 ${
                  location.pathname === path
                    ? 'bg-exoplanet-orange text-white'
                    : 'text-gray-300 hover:text-white hover:bg-space-blue/50'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
