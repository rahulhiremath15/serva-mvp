const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  deviceType: {
    type: String,
    required: true,
    trim: true
  },
  issue: {
    type: String,
    required: true,
    trim: true
  },
  customIssueDescription: {
    type: String,
    trim: true
  },
  preferredTime: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  photo: {
    filename: String,
    originalName: String,
    path: String,
    size: Number
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in-progress', 'completed'],
    default: 'pending'
  },
  technician: {
    type: String,
    default: 'John Smith'
  },
  cost: {
    type: Number,
    default: 0
  },
  deviceModel: {
    type: String,
    default: ''
  },
  warrantyToken: {
    type: String,
    unique: true
  },
  warrantyExpiry: {
    type: Date,
    default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
  }
}, {
  timestamps: true
});

// Generate booking ID and warranty token before saving
bookingSchema.pre('save', async function() {
  if (this.isNew && !this.bookingId) {
    // Generate unique booking ID
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    this.bookingId = `BK${timestamp}${random}`.toUpperCase();
  }
  
  if (this.isNew && !this.warrantyToken) {
    // Generate unique warranty token
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    this.warrantyToken = `WT${timestamp}${random}`.toUpperCase();
  }
});

module.exports = mongoose.model('Booking', bookingSchema);
