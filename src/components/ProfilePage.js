import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const ProfilePage = () => {
  const { user, logout, token } = useAuth();
  const [stats, setStats] = useState({ totalBookings: 0, activeRepairs: 0 });

  // Fetch simple stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('https://serva-backend.onrender.com/api/v1/bookings', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const bookings = data.bookings || [];
          setStats({
            totalBookings: bookings.length,
            activeRepairs: bookings.filter(b => b.status !== 'completed' && b.status !== 'cancelled').length
          });
        }
      } catch (err) {
        console.error(err);
      }
    };
    if (token) fetchStats();
  }, [token]);

  if (!user) return <div className="p-8">Please log in.</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-8">
        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
          <div className="bg-blue-600 h-32"></div>
          <div className="px-8 pb-8 relative">
            <div className="absolute -top-16 left-8">
              <div className="h-32 w-32 rounded-full border-4 border-white bg-white shadow-md flex items-center justify-center text-5xl font-bold text-blue-600 uppercase">
                {user.firstName ? user.firstName[0] : 'U'}
              </div>
            </div>
            <div className="mt-20 flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{user.firstName} {user.lastName}</h1>
                <p className="text-gray-500 font-medium">{user.email}</p>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-2">
                  Member
                </span>
              </div>
              <button 
                onClick={logout}
                className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-medium transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Repairs</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalBookings}</p>
            </div>
            <div className="h-12 w-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 text-xl">
              🔧
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Active Repairs</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.activeRepairs}</p>
            </div>
            <div className="h-12 w-12 bg-green-50 rounded-full flex items-center justify-center text-green-600 text-xl">
              🔄
            </div>
          </div>
        </div>

        {/* Personal Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Personal Information</h2>
            <button className="text-blue-600 text-sm font-medium hover:underline">Edit</button>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Full Name</label>
              <p className="text-gray-900 font-medium">{user.firstName} {user.lastName}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Email Address</label>
              <p className="text-gray-900 font-medium">{user.email}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Phone Number</label>
              <p className="text-gray-900 font-medium">{user.phone || 'No phone number added'}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Member Since</label>
              <p className="text-gray-900 font-medium">
                {new Date(user.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
