import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Components
import Navbar from './components/Navbar.tsx';
import Home from './pages/Home.tsx';
import Exploration from './pages/Exploration.tsx';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-space-dark text-white">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/exploration" element={<Exploration />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
