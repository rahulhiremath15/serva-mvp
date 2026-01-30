require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { GoogleGenerativeAI } = require("@google/generative-ai");
// Import Routes (Ensure these files exist)
const authRoutes = require('./routes/auth');
const { authenticateToken } = require('./middleware/auth');
const Booking = require('./models/Booking');

const app = express();
const PORT = process.env.PORT || 5000;

// 1. Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 2. Database Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// 3. File Upload Setup (Safe for Render)
const uploadDir = process.env.RENDER ? '/tmp/uploads' : path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const multer = require('multer');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// 4. Static Files
app.use('/uploads', express.static(uploadDir));

// ==========================================
// 🚀 PRIORITY ROUTES (AI & TECHNICIAN)
// ==========================================

// 🤖 AI Analysis Route
app.post('/api/v1/analyze-issue', authenticateToken, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No image uploaded" });

    // Check API Key
    if (!process.env.GEMINI_API_KEY) {
      console.error("❌ Missing GEMINI_API_KEY");
      return res.status(500).json({ success: false, message: "AI Service Not Configured" });
    }
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const deviceType = req.body.deviceType || "device";
    const prompt = `You are a professional repair expert. Analyze this image of a ${deviceType}.
Return a purely JSON object (no markdown) with these keys:
- issue: A short title of the technical problem.
- severity: "Minor", "Moderate", or "Major".
- advice: One sentence of immediate advice.`;
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
    console.error("🔥 AI Analysis Failed:", error);
    res.status(500).json({ success: false, message: "AI Analysis Failed" });
  }
});

// 👨‍🔧 Technician: Available Jobs
app.get('/api/v1/technician/available-jobs', authenticateToken, async (req, res) => {
  try {
    console.log(`👷 Fetching jobs for user role: ${req.user.role}`); // Debug log
    if (req.user.role !== 'technician') {
      return res.status(403).json({ success: false, message: 'Unauthorized: Technicians Only' });
    }
    // Fetch all pending jobs, sorted by newest
    const jobs = await Booking.find({ status: 'pending' })
      .populate('user', 'firstName lastName') // Show customer name
      .sort({ createdAt: -1 });

    res.json({ success: true, jobs });
  } catch (error) {
    console.error("❌ Job Fetch Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch jobs" });
  }
});

// 👨‍🔧 Technician: Accept Job
app.post('/api/v1/bookings/:id/accept', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'technician') return res.status(403).json({ success: false, message: 'Unauthorized' });

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Job not found' });
    if (booking.status !== 'pending') return res.status(400).json({ success: false, message: 'Job already taken' });
    
    booking.status = 'in-progress';
    booking.technician = req.user.id || req.user._id;
    await booking.save();

    res.json({ success: true, message: 'Job accepted!', booking });


  } catch (error) {
    console.error("❌ Accept Job Error:", error);
    res.status(500).json({ success: false, message: "Failed to accept job" });
  }
});

// ==========================================
// 📦 STANDARD ROUTES
// ==========================================

app.use('/api/auth', authRoutes);

// Create Booking (Sanitized)
app.post('/api/v1/bookings', authenticateToken, upload.single('photo'), async (req, res) => {
  try {
    const bookingData = { ...req.body };

    // Sanitization
    delete bookingData.technician; 
    delete bookingData.status;
    bookingData.user = req.user.id || req.user._id;
    bookingData.status = 'pending';
    bookingData.technician = null;

    if (req.file) {
      // Store the full path for easier frontend retrieval
      // Note: We strip the /tmp/ prefix if on Render, or keep simple path
      const filename = path.basename(req.file.path);
      bookingData.photo = `/uploads/${filename}`;
    }

    const newBooking = new Booking(bookingData);
    await newBooking.save();

    res.status(201).json({ success: true, message: 'Booking created', booking: newBooking });


  } catch (error) {
    console.error("❌ Booking Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get User Bookings
app.get('/api/v1/bookings', authenticateToken, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id || req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 🛑 ERROR HANDLERS (MUST BE LAST)
// ==========================================

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.url}` });
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
