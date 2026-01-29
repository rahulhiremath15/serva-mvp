import React from 'react';
import { useLocation, Link } from 'react-router-dom';

const SuccessPage = () => {
  const location = useLocation();
  const bookingData = location.state?.bookingData;

  if (!bookingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Booking Not Found</h1>
          <p className="text-gray-600 mb-6">Please try booking again.</p>
          <Link
            to="/book"
            className="px-6 py-3 bg-brand text-white rounded-lg hover:bg-opacity-90 transition-colors"
          >
            Book Again
          </Link>
        </div>
      </div>
    );
  }

  const { bookingId, deviceType, issue, preferredTime } = bookingData;
  
  // Ensure bookingId is a string for URL navigation
  const trackingId = bookingId?.bookingId || bookingId?._id || bookingId?.id || bookingId;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>

        {/* Success Message */}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
        <p className="text-gray-600 mb-8">
          Your device repair booking has been successfully submitted. We'll contact you soon.
        </p>

        {/* Booking Details Card */}
        <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Booking Details</h2>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Booking ID:</span>
              <span className="font-mono font-semibold text-brand">{trackingId}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Device:</span>
              <span className="font-medium text-gray-900 capitalize">{deviceType}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Issue:</span>
              <span className="font-medium text-gray-900 capitalize">
                {issue === 'other' ? 'Other' : issue.replace('-', ' ')}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Preferred Time:</span>
              <span className="font-medium text-gray-900">{preferredTime}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link
            to={`/track?id=${trackingId}`}
            className="w-full block px-6 py-3 bg-brand text-white rounded-lg hover:bg-opacity-90 transition-colors font-medium"
          >
            Track Repair
          </Link>
          
          <Link
            to="/bookings"
            className="w-full block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            View My Bookings
          </Link>
          
          <Link
            to="/"
            className="w-full block px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Back to Home
          </Link>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-sm text-gray-500">
          <p>Save your booking ID for future reference.</p>
          <p className="mt-1">You'll receive a confirmation email shortly.</p>
        </div>
      </div>
    </div>
  );
};

export default SuccessPage;
