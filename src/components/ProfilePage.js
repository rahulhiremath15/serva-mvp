import React from 'react';
import { useAuth } from '../context/AuthContext';

const ProfilePage = () => {
  const { user, logout } = useAuth();

  if (!user) return <div className="p-8">Please log in.</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Account Details</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="text-xs text-gray-500 uppercase font-semibold">User ID</label>
              <p className="font-mono text-sm text-gray-700 break-all">{user.id || user._id}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="text-xs text-gray-500 uppercase font-semibold">Phone</label>
              <p className="text-gray-700">{user.phone || 'Not provided'}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="text-xs text-gray-500 uppercase font-semibold">Account Created</label>
              <p className="text-gray-700">{new Date(user.createdAt || Date.now()).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="mt-10 border-t pt-8">
            <button
              onClick={logout}
              className="bg-red-50 text-red-600 px-6 py-3 rounded-lg hover:bg-red-100 font-medium transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
