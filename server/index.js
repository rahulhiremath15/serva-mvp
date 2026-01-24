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

// Test route to verify server is working
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working!', timestamp: new Date().toISOString() });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: '2.0.0', auth: 'enabled' });
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
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
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

// Helper function to generate mock timeline based on booking data
function generateTimeline(booking) {
  const createdAt = new Date(booking.createdAt);
  const now = new Date();
  const hoursSinceCreation = (now - createdAt) / (1000 * 60 * 60);
  
  // Mock timeline based on hours since creation
  if (hoursSinceCreation < 1) {
    return [
      { step: 1, title: 'Booking Confirmed', time: booking.createdAt, completed: true },
      { step: 2, title: 'Diagnostic Assessment', time: new Date(createdAt.getTime() + 30 * 60 * 1000).toISOString(), completed: false },
      { step: 3, title: 'Device Picked Up', time: new Date(createdAt.getTime() + 2 * 60 * 60 * 1000).toISOString(), completed: false },
      { step: 4, title: 'Repair in Progress', time: new Date(createdAt.getTime() + 4 * 60 * 60 * 1000).toISOString(), completed: false },
      { step: 5, title: 'Repair Completed', time: new Date(createdAt.getTime() + 6 * 60 * 60 * 1000).toISOString(), completed: false }
    ];
  } else if (hoursSinceCreation < 4) {
    const diagnosticTime = new Date(createdAt.getTime() + 30 * 60 * 1000);
    const pickedUpTime = new Date(createdAt.getTime() + 2 * 60 * 60 * 1000);
    return [
      { step: 1, title: 'Booking Confirmed', time: booking.createdAt, completed: true },
      { step: 2, title: 'Diagnostic Assessment', time: diagnosticTime.toISOString(), completed: true },
      { step: 3, title: 'Device Picked Up', time: pickedUpTime.toISOString(), completed: hoursSinceCreation >= 2 },
      { step: 4, title: 'Repair in Progress', time: new Date(createdAt.getTime() + 4 * 60 * 60 * 1000).toISOString(), completed: false },
      { step: 5, title: 'Repair Completed', time: new Date(createdAt.getTime() + 6 * 60 * 60 * 1000).toISOString(), completed: false }
    ];
  } else if (hoursSinceCreation < 8) {
    const diagnosticTime = new Date(createdAt.getTime() + 30 * 60 * 1000);
    const pickedUpTime = new Date(createdAt.getTime() + 2 * 60 * 60 * 1000);
    const inProgressTime = new Date(createdAt.getTime() + 4 * 60 * 60 * 1000);
    return [
      { step: 1, title: 'Booking Confirmed', time: booking.createdAt, completed: true },
      { step: 2, title: 'Diagnostic Assessment', time: diagnosticTime.toISOString(), completed: true },
      { step: 3, title: 'Device Picked Up', time: pickedUpTime.toISOString(), completed: true },
      { step: 4, title: 'Repair in Progress', time: inProgressTime.toISOString(), completed: true },
      { step: 5, title: 'Repair Completed', time: new Date(createdAt.getTime() + 6 * 60 * 60 * 1000).toISOString(), completed: false }
    ];
  } else {
    const diagnosticTime = new Date(createdAt.getTime() + 30 * 60 * 1000);
    const pickedUpTime = new Date(createdAt.getTime() + 2 * 60 * 60 * 1000);
    const inProgressTime = new Date(createdAt.getTime() + 4 * 60 * 60 * 1000);
    const completedTime = new Date(createdAt.getTime() + 6 * 60 * 60 * 1000);
    return [
      { step: 1, title: 'Booking Confirmed', time: booking.createdAt, completed: true },
      { step: 2, title: 'Diagnostic Assessment', time: diagnosticTime.toISOString(), completed: true },
      { step: 3, title: 'Device Picked Up', time: pickedUpTime.toISOString(), completed: true },
      { step: 4, title: 'Repair in Progress', time: inProgressTime.toISOString(), completed: true },
      { step: 5, title: 'Repair Completed', time: completedTime.toISOString(), completed: true }
    ];
  }
}

// POST route for booking submissions (protected)
app.post('/api/v1/bookings', authenticateToken, upload.single('photo'), (req, res) => {
  try {
    console.log('POST /api/v1/bookings - Request received');
    console.log('User authenticated:', !!req.user);
    console.log('Request body:', req.body);
    console.log('Uploaded file:', req.file);
    
    const { deviceType, issue, preferredTime, address } = req.body;
    const customIssueDescription = req.body.customIssueDescription;
    const photoFile = req.file;
    const userId = req.user.id; // Get user ID from authenticated token

    console.log('Extracted data:', { deviceType, issue, preferredTime, address, userId });

    // Validate required fields
    if (!deviceType || !issue || !preferredTime || !address) {
      console.log('Validation failed - missing fields');
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Validate custom issue description if "other" is selected
    if (issue === 'other' && !customIssueDescription) {
      console.log('Validation failed - missing custom issue description');
      return res.status(400).json({
        success: false,
        message: 'Custom issue description is required when "Other" is selected'
      });
    }

    console.log('Creating booking...');
    // Create booking with user association
    const result = bookingUtils.createBooking({
      deviceType,
      issue,
      customIssueDescription: issue === 'other' ? customIssueDescription : undefined,
      preferredTime,
      address,
      photo: photoFile ? {
        filename: photoFile.filename,
        originalName: photoFile.originalname,
        path: photoFile.path,
        size: photoFile.size
      } : null
    }, userId);

    console.log('Booking creation result:', result);

    if (!result.success) {
      console.log('Booking creation failed:', result.message);
      return res.status(500).json({
        success: false,
        message: result.message || 'Failed to create booking'
      });
    }

    console.log('Booking created successfully');
    // Return success response
    res.status(200).json({
      success: true,
      message: 'Booking created successfully',
      bookingId: result.booking.bookingId,
      booking: {
        bookingId: result.booking.bookingId,
        deviceType: result.booking.deviceType,
        issue: result.booking.issue,
        preferredTime: result.booking.preferredTime,
        status: result.booking.status
      }
    });

  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET route to retrieve user's bookings (protected)
app.get('/api/v1/bookings', authenticateToken, (req, res) => {
  try {
    console.log('GET /api/v1/bookings - Request received');
    console.log('User authenticated:', !!req.user);
    
    const userId = req.user.id;
    console.log('Fetching bookings for user:', userId);
    
    const bookings = bookingUtils.getBookingsByUserId(userId);
    console.log('Found bookings:', bookings.length);
    
    // Sort bookings by date (newest first)
    const sortedBookings = bookings.sort((a, b) => 
      new Date(b.createdAt || b.date) - new Date(a.createdAt || b.date)
    );
    
    res.status(200).json({
      success: true,
      bookings: sortedBookings
    });
  } catch (error) {
    console.error('Error retrieving bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET route to retrieve specific booking by ID (protected)
app.get('/api/v1/bookings/:id', authenticateToken, (req, res) => {
  try {
    console.log('GET /api/v1/bookings/:id - Request received');
    console.log('User authenticated:', !!req.user);
    
    const { id } = req.params;
    const userId = req.user.id;
    console.log('Fetching booking:', id, 'for user:', userId);
    
    const bookings = bookingUtils.readBookings();
    
    // Find booking that belongs to the authenticated user
    const booking = bookings.find(b => b.bookingId === id.toUpperCase() && b.userId === userId);
    
    if (!booking) {
      console.log('Booking not found or access denied');
      return res.status(404).json({
        success: false,
        message: 'Booking not found or access denied'
      });
    }

    // Generate mock timeline based on creation date and status
    const timeline = generateTimeline(booking);
    
    // Return full booking object with timeline
    const bookingWithTimeline = {
      ...booking,
      timeline,
      id: booking.bookingId,
      deviceModel: booking.deviceType === 'smartphone' ? 'iPhone 13' : 'MacBook Pro 2021',
      technician: booking.technician || 'John Smith',
      customerName: `${req.user.firstName} ${req.user.lastName}`
    };

    res.status(200).json({
      success: true,
      booking: bookingWithTimeline
    });
  } catch (error) {
    console.error('Error retrieving booking:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// 404 handler for undefined routes
app.use('*', (req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error occurred:', error);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 10MB'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files uploaded'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected file field'
      });
    }
  }
  
  if (error.message === 'Only image files are allowed') {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  // Handle JSON parsing errors
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON in request body'
    });
  }

  // Handle JWT errors specifically
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
  
  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }

  // Handle validation errors
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      details: error.message
    });
  }

  // Default error handler
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: error.message })
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Bookings API available at http://localhost:${PORT}/api/v1/bookings`);
  console.log('Health check available at /health');
  console.log('Test endpoint available at /api/test');
});
