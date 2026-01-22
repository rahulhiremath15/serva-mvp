import React, { useState } from 'react';

const BookingsDashboard = () => {
  const [bookings] = useState([
    {
      id: 'BK001',
      date: '2024-01-15',
      deviceType: 'Smartphone',
      deviceModel: 'iPhone 13',
      issue: 'Broken Screen',
      technician: 'John Smith',
      warrantyToken: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b',
      warrantyExpiry: '2025-01-15',
      status: 'completed',
      cost: 299.99,
    },
    {
      id: 'BK002',
      date: '2024-01-10',
      deviceType: 'Laptop',
      deviceModel: 'MacBook Pro 2021',
      issue: 'Battery Replacement',
      technician: 'Sarah Johnson',
      warrantyToken: '0x8ba1f109551bD432803012645Hac136c8C69C4b4',
      warrantyExpiry: '2025-01-10',
      status: 'completed',
      cost: 199.99,
    },
    {
      id: 'BK003',
      date: '2024-01-05',
      deviceType: 'Smartphone',
      deviceModel: 'Samsung Galaxy S22',
      issue: 'Charging Port Repair',
      technician: 'Mike Wilson',
      warrantyToken: '0x3f5CE599Fe13D5324834C5bBbC3bC4b4d8b4C9db',
      warrantyExpiry: '2025-01-05',
      status: 'completed',
      cost: 89.99,
    },
    {
      id: 'BK004',
      date: '2023-12-28',
      deviceType: 'Laptop',
      deviceModel: 'Dell XPS 15',
      issue: 'Software Issues',
      technician: 'Emily Davis',
      warrantyToken: '0x5aAeb6053f3E94C9b9A09f33669435E7Ef1BeAed',
      warrantyExpiry: '2024-12-28',
      status: 'completed',
      cost: 149.99,
    },
    {
      id: 'BK005',
      date: '2023-12-20',
      deviceType: 'Smartphone',
      deviceModel: 'Google Pixel 7',
      issue: 'Camera Replacement',
      technician: 'David Brown',
      warrantyToken: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b',
      warrantyExpiry: '2024-12-20',
      status: 'completed',
      cost: 179.99,
    },
    {
      id: 'BK006',
      date: '2023-12-15',
      deviceType: 'Tablet',
      deviceModel: 'iPad Air 2022',
      issue: 'Screen Replacement',
      technician: 'Lisa Anderson',
      warrantyToken: '0x8ba1f109551bD432803012645Hac136c8C69C4b4',
      warrantyExpiry: '2024-12-15',
      status: 'completed',
      cost: 249.99,
    },
  ]);

  const [filter, setFilter] = useState('all');

  const getDeviceIcon = (deviceType) => {
    switch (deviceType) {
      case 'Smartphone':
        return '📱';
      case 'Laptop':
        return '💻';
      case 'Tablet':
        return '📱';
      default:
        return '🔧';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isWarrantyValid = (expiryDate) => {
    return new Date(expiryDate) > new Date();
  };

  const formatToken = (token) => {
    return `${token.slice(0, 6)}...${token.slice(-4)}`;
  };

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true;
    if (filter === 'warranty') return isWarrantyValid(booking.warrantyExpiry);
    return true;
  });

  const handleWarrantyClick = (token) => {
    // In a real app, this would open a blockchain explorer or warranty details page
    console.log('View warranty token:', token);
    alert(`Warranty Token: ${token}\n\nThis would open the warranty details page.`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Past Bookings</h1>
        <p className="text-gray-600">View your repair history and digital warranties</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-blue-600">{bookings.length}</div>
          <div className="text-sm text-gray-600 mt-1">Total Repairs</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-green-600">
            {bookings.filter(b => isWarrantyValid(b.warrantyExpiry)).length}
          </div>
          <div className="text-sm text-gray-600 mt-1">Active Warranties</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-purple-600">
            ${bookings.reduce((sum, b) => sum + b.cost, 0).toFixed(2)}
          </div>
          <div className="text-sm text-gray-600 mt-1">Total Spent</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-orange-600">
            {bookings.filter(b => b.deviceType === 'Smartphone').length}
          </div>
          <div className="text-sm text-gray-600 mt-1">Phone Repairs</div>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            All Bookings ({bookings.length})
          </button>
          <button
            onClick={() => setFilter('warranty')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'warranty'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            With Warranty ({bookings.filter(b => isWarrantyValid(b.warrantyExpiry)).length})
          </button>
        </div>
      </div>

      {/* Bookings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBookings.map((booking) => (
          <div key={booking.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getDeviceIcon(booking.deviceType)}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">{booking.id}</h3>
                    <p className="text-sm text-gray-600">{booking.deviceModel}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">{formatDate(booking.date)}</div>
                  <div className="text-lg font-semibold text-gray-900">${booking.cost}</div>
                </div>
              </div>

              {/* Issue */}
              <div className="mb-4">
                <div className="text-sm font-medium text-gray-700 mb-1">Issue Fixed</div>
                <div className="text-gray-900">{booking.issue}</div>
              </div>

              {/* Technician */}
              <div className="mb-4">
                <div className="text-sm font-medium text-gray-700 mb-1">Technician</div>
                <div className="text-gray-900">{booking.technician}</div>
              </div>

              {/* Digital Warranty Badge */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      isWarrantyValid(booking.warrantyExpiry) ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                    <span className="text-sm font-medium text-gray-700">Digital Warranty</span>
                  </div>
                  {isWarrantyValid(booking.warrantyExpiry) && (
                    <span className="text-xs text-green-600 font-medium">
                      Valid until {formatDate(booking.warrantyExpiry)}
                    </span>
                  )}
                </div>
                
                <button
                  onClick={() => handleWarrantyClick(booking.warrantyToken)}
                  className={`w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isWarrantyValid(booking.warrantyExpiry)
                      ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                      : 'bg-gray-50 text-gray-500 cursor-not-allowed border border-gray-200'
                  }`}
                  disabled={!isWarrantyValid(booking.warrantyExpiry)}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                  </svg>
                  <span>{formatToken(booking.warrantyToken)}</span>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredBookings.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No bookings found</h3>
          <p className="text-gray-600">No bookings match your current filter.</p>
        </div>
      )}
    </div>
  );
};

export default BookingsDashboard;
