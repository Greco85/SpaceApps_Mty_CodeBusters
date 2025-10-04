import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Components
import Navbar from './components/Navbar.tsx';
import Home from './pages/Home.tsx';
import Analysis from './pages/Analysis.tsx';
import Dashboard from './pages/Dashboard.tsx';
import About from './pages/About.tsx';
import ExoplanetMapPage from './pages/ExoplanetMapPage.tsx';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-space-dark text-white">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/analysis" element={<Analysis />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/map" element={<ExoplanetMapPage />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
