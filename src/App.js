import React from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import BookingWizard from './components/BookingWizard';
import TechnicianDashboard from './components/TechnicianDashboard';
import OTPLogin from './components/OTPLogin';
import BookingsDashboard from './components/BookingsDashboard';
import HomePage from './components/HomePage';
import TrackPage from './components/TrackPage';
import SuccessPage from './components/SuccessPage';

// Navigation component
const Navigation = () => {
  const location = useLocation();
  
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-brand hover:text-opacity-80 transition-colors">
              Serva
            </Link>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Link
              to="/"
              className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                isActive('/')
                  ? 'bg-brand text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Home
            </Link>
            <Link
              to="/book"
              className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                isActive('/book')
                  ? 'bg-brand text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Book Repair
            </Link>
            <Link
              to="/track"
              className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                isActive('/track')
                  ? 'bg-brand text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Track
            </Link>
            <Link
              to="/repairs"
              className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                isActive('/repairs')
                  ? 'bg-brand text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              My Bookings
            </Link>
            <Link
              to="/login"
              className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                isActive('/login')
                  ? 'bg-brand text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 font-sans">
        <Navigation />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/book" element={<BookingWizard />} />
          <Route path="/track" element={<TrackPage />} />
          <Route path="/repairs" element={<BookingsDashboard />} />
          <Route path="/login" element={<OTPLogin />} />
          <Route path="/technician" element={<TechnicianDashboard />} />
          <Route path="/success" element={<SuccessPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
