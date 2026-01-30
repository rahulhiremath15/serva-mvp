const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Import database connection
const connectDB = require('./config/db');

// Connect to MongoDB
connectDB();

// Import authentication middleware and routes
const { authenticateToken, optionalAuth } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const servicesRoutes = require('./routes/services');
const { bookingUtils } = require('./utils/dataManager');
const Booking = require('./models/Booking');

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
app.use('/api/services', servicesRoutes);

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

// Diagnostic endpoint to check MongoDB connection and data
app.get('/api/diagnostic', async (req, res, next) => {
  try {
    const User = require('./models/User');
    const Booking = require('./models/Booking');
    
    const diagnostic = {
      database: 'MongoDB',
      connected: require('mongoose').connection.readyState === 1,
      collections: {
        users: 0,
        bookings: 0
      },
      error: null
    };

    if (diagnostic.connected) {
      try {
        diagnostic.collections.users = await User.countDocuments();
        diagnostic.collections.bookings = await Booking.countDocuments();
      } catch (e) {
        diagnostic.error = e.message;
      }
    }

    res.json({ success: true, diagnostic });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test booking creation endpoint
app.post('/api/test-booking', authenticateToken, async (req, res, next) => {
  try {
    console.log('Test booking endpoint called');
    console.log('User:', req.user);
    
    const testBookingData = {
      deviceType: 'laptop',
      issue: 'battery',
      preferredTime: '10:00 AM',
      address: 'Test Address'
    };

    console.log('Test booking data:', testBookingData);
    console.log('Calling bookingUtils.createBooking...');

    const result = await bookingUtils.createBooking(testBookingData, req.user.id);
    console.log('Booking result:', result);

    res.json({ success: true, result });
  } catch (error) {
    console.error('Test booking error:', error);
    next(error);
  }
});

// Use /tmp for uploads on Render (Ephemeral filesystem)
const uploadDir = process.env.RENDER ? '/tmp/uploads' : path.join(__dirname, 'uploads');
// Ensure directory exists immediately
if (!fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('Created upload directory:', uploadDir);
  } catch (err) {
    console.error('Failed to create upload directory:', err);
  }
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Double check existence before every save
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'photo-' + uniqueSuffix + path.extname(file.originalname));
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
app.post('/api/v1/bookings', authenticateToken, upload.single('photo'), async (req, res, next) => {
  try {
    console.log('POST /api/v1/bookings - Request received');
    console.log('User authenticated:', !!req.user);
    console.log('Request body keys:', Object.keys(req.body));
    console.log('Request body:', req.body);
    console.log('Uploaded file:', req.file);
    
    // Defensive check for user
    if (!req.user) {
      console.log('No user found in request - authentication failed');
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userId = req.user.id;
    console.log('User ID:', userId);

    if (!userId) {
      console.log('User ID is missing from authenticated user');
      return res.status(401).json({
        success: false,
        message: 'Invalid user authentication'
      });
    }

    // Extract data from FormData
    const { deviceType, issue, customIssueDescription, preferredTime, address } = req.body;
    
    console.log('Extracted data:', { deviceType, issue, customIssueDescription, preferredTime, address });

    // Validate required fields
    if (!deviceType || !issue || !preferredTime || !address) {
      console.log('Validation failed - missing required fields');
      console.log('Missing fields:', {
        deviceType: !deviceType,
        issue: !issue, 
        preferredTime: !preferredTime,
        address: !address
      });
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
    const bookingDetails = {
      deviceType,
      issue,
      customIssueDescription: issue === 'other' ? customIssueDescription : undefined,
      preferredTime,
      address,
      photo: req.file ? {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        size: req.file.size
      } : null
    };

    const result = await bookingUtils.createBooking(bookingDetails, userId);
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
    next(error);
  }
});

// GET route to retrieve user's bookings (protected)
app.get('/api/v1/bookings', authenticateToken, async (req, res, next) => {
  try {
    console.log('GET /api/v1/bookings - Request received');
    console.log('User authenticated:', !!req.user);
    
    const userId = req.user.id;
    console.log('Fetching bookings for user:', userId);
    
    const bookings = await bookingUtils.getBookingsByUserId(userId);
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
    next(error);
  }
});

// GET route to retrieve specific booking by ID (protected)
app.get('/api/v1/bookings/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    let booking;
    // 1. Try finding by the custom 'bookingId' (e.g., BK-123456)
    booking = await Booking.findOne({ bookingId: id }).populate('user', 'firstName lastName email phone');
    // 2. If not found, and it looks like a MongoDB ID, try that
    if (!booking && id.match(/^[0-9a-fA-F]{24}$/)) {
        booking = await Booking.findById(id).populate('user', 'firstName lastName email phone');
    }
    if (!booking) {
        return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    res.json({ success: true, booking });
  } catch (error) {
    console.error('Error fetching booking:', error);
    next(error);
  }
});

// DELETE a booking
app.delete('/api/v1/bookings/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    // Robustly find the booking using either _id or custom bookingId
    const query = { user: req.user.id || req.user._id };
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      query._id = id;
    } else {
      query.bookingId = id;
    }
    const booking = await Booking.findOne(query);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found or unauthorized' });
    }
    await Booking.deleteOne({ _id: booking._id });
    res.json({ success: true, message: 'Booking deleted successfully' });
  } catch (error) { 
    next(error); 
  }
});

// Serve uploaded files
app.use('/uploads', express.static(uploadDir));

// 404 Handler - Always return JSON
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.url}` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('🔥 Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Bookings API available at http://localhost:${PORT}/api/v1/bookings`);
  console.log('Health check available at /health');
  console.log('Test endpoint available at /api/test');
});
