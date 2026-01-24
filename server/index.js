const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Import authentication middleware and routes
const { authenticateToken, optionalAuth } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const { bookingUtils } = require('./utils/dataManager');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://localhost:3000',
    /^https:\/\/.*\.vercel\.app$/,  // Allow all Vercel subdomains
    /^https:\/\/.*\.onrender\.com$/ // Allow all Render subdomains
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  console.log('Headers:', req.headers);
  next();
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: '2.0.0', auth: 'enabled' });
});

// Data cleanup endpoint (admin only - remove old test data)
app.post('/api/admin/cleanup-data', authenticateToken, (req, res) => {
  try {
    // Only allow admin users (you can enhance this with role-based access)
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    // Clear old bookings without user association
    const bookings = bookingUtils.readBookings();
    const userBookings = bookings.filter(booking => booking.userId);
    const orphanedBookings = bookings.filter(booking => !booking.userId);

    // Save only user-associated bookings
    bookingUtils.writeBookings(userBookings);

    res.status(200).json({
      success: true,
      message: 'Data cleanup completed',
      data: {
        removedBookings: orphanedBookings.length,
        remainingBookings: userBookings.length
      }
    });

  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup data'
    });
  }
});

// Helper function to generate mock timeline based on booking data
function generateTimeline(booking) {
  const createdAt = new Date(booking.createdAt);
  const now = new Date();
  const hoursSinceCreation = (now - createdAt) / (1000 * 60 * 60);
  
  // Mock timeline based on hours since creation
  if (hoursSinceCreation < 1) {
    return [
      { step: 1, title: 'Booking Confirmed', time: booking.createdAt, completed: true },
      { step: 2, title: 'Technician Assigned', time: null, completed: false },
      { step: 3, title: 'Device Picked Up', time: null, completed: false },
      { step: 4, title: 'Repair in Progress', time: null, completed: false },
      { step: 5, title: 'Repair Completed', time: null, completed: false }
    ];
  } else if (hoursSinceCreation < 4) {
    const assignedTime = new Date(createdAt.getTime() + 30 * 60 * 1000);
    const pickedUpTime = new Date(createdAt.getTime() + 2 * 60 * 60 * 1000);
    return [
      { step: 1, title: 'Booking Confirmed', time: booking.createdAt, completed: true },
      { step: 2, title: 'Technician Assigned', time: assignedTime.toISOString(), completed: true },
      { step: 3, title: 'Device Picked Up', time: pickedUpTime.toISOString(), completed: true },
      { step: 4, title: 'Repair in Progress', time: null, completed: false },
      { step: 5, title: 'Repair Completed', time: null, completed: false }
    ];
  } else {
    const assignedTime = new Date(createdAt.getTime() + 30 * 60 * 1000);
    const pickedUpTime = new Date(createdAt.getTime() + 2 * 60 * 60 * 1000);
    const inProgressTime = new Date(createdAt.getTime() + 4 * 60 * 60 * 1000);
    const completedTime = new Date(createdAt.getTime() + 6 * 60 * 60 * 1000);
    
    return [
      { step: 1, title: 'Booking Confirmed', time: booking.createdAt, completed: true },
      { step: 2, title: 'Technician Assigned', time: assignedTime.toISOString(), completed: true },
      { step: 3, title: 'Device Picked Up', time: pickedUpTime.toISOString(), completed: true },
      { step: 4, title: 'Repair in Progress', time: inProgressTime.toISOString(), completed: true },
      { step: 5, title: 'Repair Completed', time: completedTime.toISOString(), completed: true }
    ];
  }
}

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 10MB'
      });
    }
  }
  
  if (error.message === 'Only image files are allowed') {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Bookings API available at http://localhost:${PORT}/api/v1/bookings`);
  console.log('Health check available at /health');
});
