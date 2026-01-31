import React from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import BookingWizard from './components/BookingWizard';
import TechnicianDashboard from './components/TechnicianDashboard';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import BookingsDashboard from './components/BookingsDashboard';
import HomePage from './components/HomePage';
import TrackPage from './components/TrackPage';
import SuccessPage from './components/SuccessPage';
import ProfilePage from './components/ProfilePage';
import TechnicianSignup from './components/TechnicianSignup';
import TechnicianJobs from './components/TechnicianJobs';

// Navigation component
const Navigation = () => {
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  
  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLogout = async () => {
    await logout();
  };

  // Don't show navigation on auth pages
  if (location.pathname === '/login' || location.pathname === '/signup') {
    return null;
  }

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
            {isAuthenticated ? (
              <>
                <Link
                  to="/"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/') ? 'bg-brand text-white' : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  Home
                </Link>
                
                {user?.role === 'technician' ? (
                  <>
                    <Link
                      to="/technician-dashboard"
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        isActive('/technician-dashboard') ? 'bg-brand text-white' : 'text-gray-700 hover:text-gray-900'
                      }`}
                    >
                      Job Feed
                    </Link>
                    <Link
                      to="/my-jobs"
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        isActive('/my-jobs') ? 'bg-brand text-white' : 'text-gray-700 hover:text-gray-900'
                      }`}
                    >
                      My Jobs
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to="/book"
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        isActive('/book') ? 'bg-brand text-white' : 'text-gray-700 hover:text-gray-900'
                      }`}
                    >
                      Book Service
                    </Link>
                    <Link
                      to="/bookings"
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        isActive('/bookings') ? 'bg-brand text-white' : 'text-gray-700 hover:text-gray-900'
                      }`}
                    >
                      My Bookings
                    </Link>
                  </>
                )}
                
                <Link
                  to="/track"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/track') ? 'bg-brand text-white' : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  Track
                </Link>
                <div className="flex items-center space-x-2 border-l pl-4">
                  <Link to="/profile" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                    Welcome, {user?.firstName}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 rounded-md text-sm font-medium text-white bg-brand hover:bg-opacity-90"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 font-sans">
          <Navigation />
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/partner-signup" element={<TechnicianSignup />} />
            <Route path="/track" element={<TrackPage />} />
            <Route path="/success" element={<SuccessPage />} />
            
            {/* Protected routes */}
            <Route path="/book" element={
              <ProtectedRoute>
                <BookingWizard />
              </ProtectedRoute>
            } />
            <Route path="/bookings" element={
              <ProtectedRoute>
                <BookingsDashboard />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />
            <Route path="/technician" element={
              <ProtectedRoute>
                <TechnicianDashboard />
              </ProtectedRoute>
            } />
            <Route path="/technician-dashboard" element={
              <ProtectedRoute>
                <TechnicianDashboard />
              </ProtectedRoute>
            } />
            <Route path="/my-jobs" element={
              <ProtectedRoute>
                <TechnicianJobs />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
