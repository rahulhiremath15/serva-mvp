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

// Generate booking ID before saving
bookingSchema.pre('save', function(next) {
  if (this.isNew && !this.warrantyToken) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    this.warrantyToken = `WT${timestamp}${random}`.toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
