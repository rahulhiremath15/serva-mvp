import React from 'react';
import QRCode from 'qrcode.react';

const DigitalWarrantyModal = ({ booking, isOpen, onClose }) => {
  if (!booking) return null;

  const warrantyUrl = `${window.location.origin}/warranty/${booking.warrantyToken}`;
  
  return (
    isOpen && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Digital Warranty Certificate</h2>
                <p className="text-blue-100 text-sm mt-1">Blockchain-Backed Protection</p>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:bg-blue-800 p-2 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Certificate Content */}
          <div className="p-6">
            {/* Certificate Details */}
            <div className="mb-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-sm text-gray-600">Certificate ID</div>
                  <div className="font-mono font-semibold text-lg">{booking.warrantyToken}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Issue Date</div>
                  <div className="font-semibold">{new Date(booking.date).toLocaleDateString()}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-sm text-gray-600">Device</div>
                  <div className="font-semibold">{booking.deviceModel}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Repair Type</div>
                  <div className="font-semibold">{booking.issue}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-sm text-gray-600">Technician</div>
                  <div className="font-semibold">{booking.technician}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Valid Until</div>
                  <div className="font-semibold">{new Date(booking.warrantyExpiry).toLocaleDateString()}</div>
                </div>
              </div>

              <div className="text-center mb-6">
                <div className="text-sm text-gray-600">Total Repair Cost</div>
                <div className="text-2xl font-bold text-blue-600">${booking.cost}</div>
              </div>
            </div>

            {/* QR Code Section */}
            <div className="border-t pt-6">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Verify Authenticity</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Scan this QR code to verify the warranty certificate on the blockchain
                </p>
              </div>
              
              <div className="flex justify-center mb-4">
                <div className="bg-white p-4 rounded-lg shadow-inner border-2 border-gray-200">
                  <QRCode 
                    value={warrantyUrl}
                    size={200}
                    level="M"
                    renderAs="svg"
                    className="w-full h-full"
                  />
                </div>
              </div>
              
              <div className="text-center">
                <div className="bg-gray-100 rounded-lg px-4 py-3 mb-4">
                  <div className="text-xs text-gray-600 mb-2">Verification URL</div>
                  <div className="font-mono text-xs break-all">{warrantyUrl}</div>
                </div>
                
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Cryptographically Secured</span>
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 012 2v6a2 2 0 01-2-2H6a2 2 0 00-2-2v6a2 2 0 002 2h3zm0 0h14v3h-14v-3z" />
                  </svg>
                  <span>Blockchain Verified</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t pt-4">
              <div className="text-center text-sm text-gray-600">
                <p>This certificate is permanently recorded on the blockchain</p>
                <p className="mt-1">© 2024 Serva Digital Warranty System</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DigitalWarrantyModal;