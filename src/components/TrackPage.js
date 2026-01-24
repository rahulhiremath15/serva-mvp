import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

const TrackPage = () => {
  const location = useLocation();
  const [bookingId, setBookingId] = useState('');
  const [trackingResult, setTrackingResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = useCallback(async (id = null) => {
    const trackingId = id || bookingId;
    
    if (!trackingId.trim()) {
      setError('Please enter a booking ID');
      return;
    }

    setIsLoading(true);
    setError('');
    setTrackingResult(null);

    try {
      // Call real API instead of using dummy data
      const apiUrl = process.env.REACT_APP_API_URL || 'https://serva-backend.onrender.com';
      console.log('Tracking booking ID:', trackingId);
      const response = await fetch(`${apiUrl}/api/v1/bookings/${trackingId}`);
      console.log('Track response status:', response.status);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Booking ID not found. Please check your booking ID and try again.');
        } else {
          setError('Failed to track booking. Please try again later.');
        }
        setIsLoading(false);
        return;
      }

      const result = await response.json();
      console.log('Track result:', result);
      
      if (result.success) {
        setTrackingResult(result.booking);
      } else {
        setError(result.message || 'Failed to track booking.');
      }
    } catch (error) {
      console.error('Error tracking booking:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  }, [bookingId]);

  // Extract booking ID from URL query parameters
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const id = queryParams.get('id');
    if (id) {
      setBookingId(id);
      // Auto-track if ID is provided in URL
      handleTrack(id);
    }
  }, [location.search, handleTrack]);

  const formatTime = (timeString) => {
    if (!timeString) return 'Pending';
    const date = new Date(timeString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'in_progress':
        return 'bg-blue-100 text-blue-700';
      case 'assigned':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getDeviceIcon = (deviceType) => {
    return deviceType === 'Smartphone' ? '📱' : '💻';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Track Your Repair</h1>
          <p className="text-gray-600">Enter your booking ID to check the status of your device repair</p>
        </div>

        {/* Tracking Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              value={bookingId}
              onChange={(e) => setBookingId(e.target.value)}
              placeholder="Enter Booking ID (e.g., BK001)"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && handleTrack()}
            />
            <button
              onClick={handleTrack}
              disabled={isLoading || !bookingId.trim()}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                isLoading || !bookingId.trim()
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-brand text-white hover:bg-opacity-90'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Tracking...
                </div>
              ) : (
                'Track Repair'
              )}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Tracking Result */}
        {trackingResult && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Status Header */}
            <div className="bg-gradient-to-r from-brand to-blue-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-3xl">{getDeviceIcon(trackingResult.deviceType)}</span>
                  <div>
                    <h2 className="text-2xl font-bold">{trackingResult.id}</h2>
                    <p className="opacity-90">{trackingResult.deviceModel}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(trackingResult.status)}`}>
                    {trackingResult.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Device Info */}
            <div className="p-6 border-b">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">Issue</div>
                  <div className="text-gray-900">{trackingResult.issue}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">Technician</div>
                  <div className="text-gray-900">{trackingResult.technician}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">Est. Completion</div>
                  <div className="text-gray-900">{formatTime(trackingResult.estimatedCompletion)}</div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Repair Timeline</h3>
              <div className="space-y-4">
                {trackingResult.timeline.map((item, index) => (
                  <div key={item.step} className="flex items-start space-x-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      item.completed 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      {item.completed ? (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                        </svg>
                      ) : (
                        <span className="text-xs font-medium">{item.step}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className={`font-medium ${
                        item.completed ? 'text-gray-900' : 'text-gray-500'
                      }`}>
                        {item.title}
                      </div>
                      <div className="text-sm text-gray-500">{formatTime(item.time)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackPage;
