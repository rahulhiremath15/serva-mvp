import React, { useState } from 'react';

const TrackPage = () => {
  const [bookingId, setBookingId] = useState('');
  const [trackingResult, setTrackingResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Dummy tracking data
  const dummyTrackingData = {
    'BK001': {
      id: 'BK001',
      deviceType: 'Smartphone',
      deviceModel: 'iPhone 13',
      issue: 'Broken Screen',
      status: 'completed',
      currentStep: 5,
      estimatedCompletion: '2024-01-15T14:00:00Z',
      technician: 'John Smith',
      customerName: 'Alice Johnson',
      timeline: [
        { step: 1, title: 'Booking Confirmed', time: '2024-01-15T09:00:00Z', completed: true },
        { step: 2, title: 'Technician Assigned', time: '2024-01-15T09:30:00Z', completed: true },
        { step: 3, title: 'Device Picked Up', time: '2024-01-15T10:00:00Z', completed: true },
        { step: 4, title: 'Repair in Progress', time: '2024-01-15T11:00:00Z', completed: true },
        { step: 5, title: 'Repair Completed', time: '2024-01-15T13:30:00Z', completed: true },
      ]
    },
    'BK002': {
      id: 'BK002',
      deviceType: 'Laptop',
      deviceModel: 'MacBook Pro 2021',
      issue: 'Battery Replacement',
      status: 'in_progress',
      currentStep: 4,
      estimatedCompletion: '2024-01-22T16:00:00Z',
      technician: 'Sarah Johnson',
      customerName: 'Bob Wilson',
      timeline: [
        { step: 1, title: 'Booking Confirmed', time: '2024-01-22T08:00:00Z', completed: true },
        { step: 2, title: 'Technician Assigned', time: '2024-01-22T08:30:00Z', completed: true },
        { step: 3, title: 'Device Picked Up', time: '2024-01-22T09:00:00Z', completed: true },
        { step: 4, title: 'Repair in Progress', time: '2024-01-22T10:00:00Z', completed: true },
        { step: 5, title: 'Repair Completed', time: null, completed: false },
      ]
    }
  };

  const handleTrack = async () => {
    if (!bookingId.trim()) {
      setError('Please enter a booking ID');
      return;
    }

    setIsLoading(true);
    setError('');
    setTrackingResult(null);

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      
      const result = dummyTrackingData[bookingId.toUpperCase()];
      if (result) {
        setTrackingResult(result);
      } else {
        setError('Booking ID not found. Try BK001 or BK002 for demo.');
      }
    }, 1500);
  };

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

        {/* Demo Info */}
        {!trackingResult && (
          <div className="text-center py-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md mx-auto">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Demo Booking IDs</h3>
              <p className="text-blue-700 mb-4">Try these booking IDs to see the tracking in action:</p>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setBookingId('BK001');
                    handleTrack();
                  }}
                  className="w-full text-left px-4 py-2 bg-white rounded border border-blue-200 hover:bg-blue-50 transition-colors"
                >
                  <span className="font-medium">BK001</span> - Completed Repair
                </button>
                <button
                  onClick={() => {
                    setBookingId('BK002');
                    handleTrack();
                  }}
                  className="w-full text-left px-4 py-2 bg-white rounded border border-blue-200 hover:bg-blue-50 transition-colors"
                >
                  <span className="font-medium">BK002</span> - In Progress
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackPage;
