const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");

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
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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

// Create a new booking
app.post('/api/v1/bookings', authenticateToken, upload.single('photo'), async (req, res) => {
  try {
    const bookingData = { ...req.body };
    
    // 🧹 SANITIZATION: Remove any client-side attempts to set these fields
    delete bookingData.technician; 
    delete bookingData.status;
    
    // Add server-controlled fields
    bookingData.user = req.user.id || req.user._id;
    bookingData.status = 'pending';
    bookingData.technician = null; // Explicitly null to prevent "John Smith" errors
    
    // Handle file upload if present
    if (req.file) {
      // Use the relative path for the frontend
      bookingData.photo = `/uploads/${req.file.filename}`;
    }
const newBooking = new Booking(bookingData);
await newBooking.save();
res.status(201).json({ 
  success: true, 
  message: 'Booking created successfully', 
  booking: newBooking 
});
} catch (error) { console.error("Booking Error:", error); res.status(500).json({ success: false, message: error.message || "Failed to create booking" }); } });

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

// --- 🤖 AI ANALYSIS ROUTE (Must be here!) ---
app.post('/api/v1/analyze-issue', authenticateToken, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No image uploaded" });
    
    const deviceType = req.body.deviceType || "device";
    // Initialize Gemini (Ensure GoogleGenerativeAI is imported at top)
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
const prompt = `You are a professional repair expert. Analyze this image of a ${deviceType}.
Return a purely JSON object (no markdown) with these keys:
- issue: A short title of the technical problem.
- severity: "Minor", "Moderate", or "Major".
- advice: One sentence of immediate advice.`;
// Convert buffer to Google format
const imagePart = {
  inlineData: {
    data: fs.readFileSync(req.file.path).toString("base64"),
    mimeType: req.file.mimetype
  },
};
const result = await model.generateContent([prompt, imagePart]);
const response = await result.response;
const text = response.text();
const cleanText = text.replace(/```json|```/g, '').trim();
res.json({ success: true, diagnosis: JSON.parse(cleanText) });


} catch (error) {
console.error("AI Error:", error);
res.status(500).json({ success: false, message: "AI Analysis failed" });
}
});
// --- 👨‍🔧 TECHNICIAN ROUTES (Must be here!) --- app.get('/api/v1/technician/available-jobs', authenticateToken, async (req, res) => { try { // Strict Role Check if (req.user.role !== 'technician') return res.status(403).json({ success: false, message: 'Unauthorized' }); const jobs = await Booking.find({ status: 'pending' }).sort({ createdAt: -1 }); res.json({ success: true, jobs }); } catch (error) { console.error(error); res.status(500).json({ success: false, message: "Server Error" }); } });

app.post('/api/v1/bookings/:id/accept', authenticateToken, async (req, res) => { try { if (req.user.role !== 'technician') return res.status(403).json({ success: false, message: 'Unauthorized' }); const booking = await Booking.findById(req.params.id); if (!booking) return res.status(404).json({ success: false, message: 'Job not found' });

booking.status = 'in-progress';
booking.technician = req.user.id || req.user._id;
await booking.save();
res.json({ success: true, message: 'Job accepted!', booking });
} catch (error) { console.error(error); res.status(500).json({ success: false, message: "Server Error" }); } });

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

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper to convert file to GoogleGenerativeAI format
function fileToGenerativePart(path, mimeType) {
  return {
    inlineData: {
      data: fs.readFileSync(path).toString("base64"),
      mimeType
    },
  };
}

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Bookings API available at http://localhost:${PORT}/api/v1/bookings`);
  console.log('Health check available at /health');
  console.log('Test endpoint available at /api/test');
});
