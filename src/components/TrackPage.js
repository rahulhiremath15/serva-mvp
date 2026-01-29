import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const TrackPage = () => {
  // Removed unused 'useLocation' to fix lint error
  const [searchParams] = useSearchParams();
  const { token } = useAuth();

  const [bookingId, setBookingId] = useState('');
  const [trackingResult, setTrackingResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helper: Safe Date Formatting
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      return 'Invalid Date';
    }
  };

  // Define handleTrack FIRST so it can be used in useEffect
  const handleTrack = useCallback(async (idToTrack) => {
    const targetId = idToTrack || bookingId;
    if (!targetId) return;

    setIsLoading(true);
    setError(null);
    setTrackingResult(null);

    try {
      const response = await fetch(`https://serva-backend.onrender.com/api/v1/bookings/${targetId}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setTrackingResult(data.booking);
      } else {
        setError(data.message || 'Booking not found. Please check the ID.');
      }
    } catch (err) {
      console.error('Tracking Error:', err);
      setError('Failed to connect to server. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [bookingId, token]); // Dependencies for useCallback

  // Auto-fetch from URL (e.g., /track?id=BK-123)
  useEffect(() => {
    const urlId = searchParams.get('id');
    if (urlId) {
      setBookingId(urlId);
      handleTrack(urlId);
    }
  }, [searchParams, handleTrack]); // Added handleTrack to fix lint error

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Track Your Repair</h1>

      {/* Search Bar */}
      <div className="flex gap-4 mb-8 max-w-xl mx-auto">
        <input
          type="text"
          value={bookingId}
          onChange={(e) => setBookingId(e.target.value)}
          placeholder="Enter Booking ID (e.g., BK-789...)"
          className="flex-1 p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <button
          onClick={() => handleTrack(bookingId)}
          disabled={isLoading}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
        >
          {isLoading ? 'Searching...' : 'Track Repair'}
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-8 text-center">
          {error}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12 text-gray-500">
          Finding your repair...
        </div>
      )}

      {/* Results State */}
      {trackingResult && !isLoading && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <span className="font-semibold text-gray-700">Booking ID: {trackingResult.bookingId || trackingResult._id}</span>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              {trackingResult.status?.toUpperCase() || 'PENDING'}
            </span>
          </div>

          <div className="p-6 grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Device Details</h3>
              <div className="space-y-3 text-gray-600">
                <p><span className="font-medium text-gray-900">Device:</span> {trackingResult.deviceType}</p>
                <p><span className="font-medium text-gray-900">Issue:</span> {trackingResult.issue}</p>
                <p><span className="font-medium text-gray-900">Received:</span> {formatDate(trackingResult.createdAt)}</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Status Update</h3>
              <div className="relative pt-2">
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                  <div
                    style={{ width: trackingResult.status === 'completed' ? '100%' : trackingResult.status === 'in-progress' ? '50%' : '10%' }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-500"
                  ></div>
                </div>
                <p className="text-sm text-gray-500 text-center">
                  {trackingResult.status === 'completed' ? 'Repair Completed' :
                   trackingResult.status === 'in-progress' ? 'Technician Working' :
                   'Awaiting Technician'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackPage;