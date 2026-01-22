const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

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

// Helper function to generate unique booking ID
function generateBookingId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `BK${timestamp}${random}`.toUpperCase();
}

// Helper function to read bookings from file
function readBookings() {
  try {
    if (fs.existsSync('bookings.json')) {
      const data = fs.readFileSync('bookings.json', 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error reading bookings:', error);
    return [];
  }
}

// Helper function to write bookings to file
function writeBookings(bookings) {
  try {
    fs.writeFileSync('bookings.json', JSON.stringify(bookings, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing bookings:', error);
    return false;
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.1' });
});

// Test route to verify server is working
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working!', timestamp: new Date().toISOString() });
});

// POST route for booking submissions
app.post('/api/v1/bookings', upload.single('photo'), (req, res) => {
  try {
    const { deviceType, issue, preferredTime, address } = req.body;
    const customIssueDescription = req.body.customIssueDescription;
    const photoFile = req.file;

    // Validate required fields
    if (!deviceType || !issue || !preferredTime || !address) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Validate custom issue description if "other" is selected
    if (issue === 'other' && !customIssueDescription) {
      return res.status(400).json({
        success: false,
        message: 'Custom issue description is required when "Other" is selected'
      });
    }

    // Create booking object
    const booking = {
      bookingId: generateBookingId(),
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
      } : null,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };

    // Read existing bookings
    const bookings = readBookings();

    // Add new booking
    bookings.push(booking);

    // Save to file
    if (!writeBookings(bookings)) {
      return res.status(500).json({
        success: false,
        message: 'Failed to save booking'
      });
    }

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Booking created successfully',
      bookingId: booking.bookingId,
      booking: {
        bookingId: booking.bookingId,
        deviceType: booking.deviceType,
        issue: booking.issue,
        preferredTime: booking.preferredTime,
        status: booking.status
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

// GET route to retrieve all bookings (for testing)
app.get('/api/v1/bookings', (req, res) => {
  try {
    const bookings = readBookings();
    res.status(200).json({
      success: true,
      bookings: bookings
    });
  } catch (error) {
    console.error('Error retrieving bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET route to retrieve specific booking by ID
app.get('/api/v1/bookings/:id', (req, res) => {
  try {
    const { id } = req.params;
    const bookings = readBookings();
    const booking = bookings.find(b => b.bookingId === id.toUpperCase());
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
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
      customerName: 'Customer Name'
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
});
