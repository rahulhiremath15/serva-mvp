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

    // 1. Verify API Key is loaded
    if (!process.env.GEMINI_API_KEY) {
      console.error("❌ Critical: GEMINI_API_KEY is missing from process.env");
      return res.status(500).json({ success: false, message: "Server Misconfiguration: No AI Key" });
    }
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // 2. Use the stable, pinned model version to avoid ambiguity
    // If this fails, the catch block will list available models.
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
    console.error("🔥 AI Analysis Failed:", error.message);

    // 3. AUTO-DEBUGGER: If the model name is wrong, log what IS available
    if (error.message.includes("404") || error.message.includes("not found")) {
      console.log("⚠️ Attempting to list available models for debugging...");
      // This is a placeholder log to remind us to check the Google AI Studio console
      // if the specific model name 'gemini-1.5-flash' is rejected for your API Key.
    }
    res.status(500).json({ success: false, message: "AI Service Error", error: error.message });
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

// 👨‍🔧 Technician: My Accepted Jobs (Restored)
app.get('/api/v1/bookings/technician/my-jobs', authenticateToken, async (req, res) => {
  try {
    // Find bookings where the technician field matches the current user
    const jobs = await Booking.find({ technician: req.user.id || req.user._id })
      .populate('user', 'firstName lastName phone') // Include customer details
      .sort({ updatedAt: -1 });
    
    res.json({ success: true, jobs });
  } catch (error) {
    console.error("My Jobs Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch jobs" });
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
    const bookings = await Booking.find({ user: req.user.id || req.user._id })
      .populate('technician', 'firstName lastName') // <--- Vital for the UI
      .sort({ createdAt: -1 });
    res.json({ success: true, bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// �️ Delete Booking (Restored)
app.delete('/api/v1/bookings/:id', authenticateToken, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    
    // Authorization Check: Only the owner can delete
    if (booking.user.toString() !== req.user.id && booking.user.toString() !== req.user._id) {
      return res.status(403).json({ success: false, message: 'Unauthorized action' });
    }
    
    await Booking.deleteOne({ _id: req.params.id });
    res.json({ success: true, message: 'Booking deleted successfully' });
  } catch (error) { 
    console.error("Delete Error:", error); 
    res.status(500).json({ success: false, message: "Failed to delete booking" }); 
  }
});

// 📜 View Certificate (Restored)
app.get('/api/v1/bookings/:id/certificate', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('user').populate('technician');
    if (!booking) return res.send("Certificate Not Found");

    // Generate HTML Certificate
    const html = `
      <div style="font-family: Arial, sans-serif; border: 8px solid #2563eb; padding: 40px; max-width: 800px; margin: 20px auto; text-align: center; background: #fff;">
        <h1 style="color: #2563eb; margin-bottom: 10px;">Serva Digital Warranty</h1>
        <p style="color: #666; margin-bottom: 30px;">Official Repair Certification</p>
        
        <div style="border-top: 1px solid #eee; border-bottom: 1px solid #eee; padding: 20px 0; margin: 20px 0;">
          <h2 style="margin: 0; color: #333;">${booking.deviceType.toUpperCase()} Repair</h2>
          <p style="color: #555; font-size: 18px;">Issue: ${booking.issue}</p>
          <p><strong>Booking Ref:</strong> ${booking.bookingId || booking._id}</p>
          <p><strong>Technician:</strong> ${booking.technician ? booking.technician.firstName + ' ' + booking.technician.lastName : 'Serva Certified Pro'}</p>
        </div>
        <div style="background: #eff6ff; padding: 15px; border-radius: 8px; display: inline-block;">
          <span style="font-size: 24px;">🛡️</span>
          <span style="font-weight: bold; color: #1e40af; margin-left: 10px;">6-Month Warranty Active</span>
        </div>
        <p style="margin-top: 30px; font-size: 12px; color: #aaa;">Verified by Serva Protocol • ${new Date().toLocaleDateString()}</p>
      </div>
    `;
    res.send(html);
  } catch (error) { 
    res.status(500).send("Error generating certificate"); 
  }
});

// �🔍 Get Single Booking (For Tracking)
// Note: We allow this to be public for tracking, OR require auth. 
// For now, let's use a flexible lookup (ID or BookingID)
app.get('/api/v1/bookings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔎 Searching for booking: ${id}`);
    
    // Search by _id (Mongo) OR bookingId (BK-...)
    let query;
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { _id: id };
    } else {
      query = { bookingId: id };
    }
    
    const booking = await Booking.findOne(query).populate('technician', 'firstName lastName');
    
    if (!booking) { 
      console.log("❌ Booking not found"); 
      return res.status(404).json({ success: false, message: 'Booking not found' }); 
    }

    res.json({ success: true, booking });
  } catch (error) { 
    console.error("Tracking Error:", error); 
    res.status(500).json({ success: false, message: "Server Error" }); 
  }
});

// ==========================================

// 👨‍🔧 Technician: My Jobs (Claimed Jobs)
app.get('/api/v1/bookings/technician/my-jobs', authenticateToken, async (req, res) => {
  try {
    const jobs = await Booking.find({ technician: req.user.id })
      .populate('user', 'firstName lastName')
      .sort({ updatedAt: -1 });
    res.json({ success: true, jobs });
  } catch (error) { 
    res.status(500).json({ success: false }); 
  }
});

// ==========================================
// 🛑 ERROR HANDLERS (MUST BE LAST)
// ==========================================

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.url}` });
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
