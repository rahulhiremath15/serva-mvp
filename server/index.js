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

// 📜 Certificate Route (Public & Top Priority)
app.get('/api/v1/bookings/:id/certificate', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'firstName lastName')
      .populate('technician', 'firstName lastName');
      
    if (!booking) return res.status(404).send("<h1>Certificate Not Found</h1>");
    // Simple HTML Certificate
    const html = `
  <div style="font-family: sans-serif; border: 5px solid #2563eb; padding: 40px; max-width: 600px; margin: 20px auto; text-align: center;">
    <h1 style="color: #2563eb;">Serva Digital Warranty</h1>
    <p>This certifies that the device repair is complete.</p>
    <hr/>
    <h2 style="color: #333;">${booking.deviceType.toUpperCase()}</h2>
    <p><strong>Issue:</strong> ${booking.issue}</p>
    <p><strong>Technician:</strong> ${booking.technician ? booking.technician.firstName : 'Serva Pro'}</p>
    <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
    <div style="background: #e0f2fe; padding: 10px; margin-top: 20px;">
      <strong>✅ 6-Month Warranty Active</strong>
    </div>
  </div>
`;
    res.send(html);
  } catch (error) { res.status(500).send("Certificate Generation Error"); }
});

// ==========================================
// 🚀 PRIORITY ROUTES (AI & TECHNICIAN)
// ==========================================

// 💥 NUKE DB ROUTE (Accessible via Browser)
app.get('/api/v1/nuke-db', async (req, res) => {
  try {
    await User.deleteMany({});
    await Booking.deleteMany({});
    res.send("<h1>💥 DATABASE WIPED. Please Sign Up Again.</h1>");
  } catch (e) {
    res.send("Error: " + e.message);
  }
});

// 🔍 AI Model Diagnostics Route
app.get('/api/v1/ai-models', async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.json({ error: "No GEMINI_API_KEY configured" });
    }
    
    // Test direct API calls to find available models
    const results = [];
    
    // Test 1: Direct API call to list models
    try {
      const fetch = require('node-fetch');
      const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`;
      
      const response = await fetch(listUrl);
      const data = await response.json();
      
      if (data.models) {
        const availableModels = data.models.map(model => ({
          name: model.name,
          displayName: model.displayName,
          description: model.description,
          supportedGenerationMethods: model.supportedGenerationMethods
        }));
        
        results.push({ 
          test: "Direct API List Models", 
          status: "WORKS", 
          models: availableModels 
        });
        
        // Test each available model
        for (const modelInfo of availableModels) {
          const modelName = modelInfo.name.split('/').pop(); // Extract model name from full path
          if (modelInfo.supportedGenerationMethods && modelInfo.supportedGenerationMethods.includes('generateContent')) {
            try {
              const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
              const model = genAI.getGenerativeModel({ model: modelName });
              const result = await model.generateContent("Hello");
              results.push({ 
                model: modelName, 
                status: "WORKS", 
                response: result.response.text().substring(0, 100),
                displayName: modelInfo.displayName
              });
            } catch (error) {
              results.push({ 
                model: modelName, 
                status: "FAILED", 
                error: error.message,
                displayName: modelInfo.displayName
              });
            }
          }
        }
      } else {
        results.push({ 
          test: "Direct API List Models", 
          status: "FAILED", 
          error: "No models found in response",
          fullResponse: data 
        });
      }
    } catch (error) {
      results.push({ 
        test: "Direct API List Models", 
        status: "FAILED", 
        error: error.message 
      });
    }
    
    // Test 2: Try older v1 API version
    try {
      const fetch = require('node-fetch');
      const listUrl = `https://generativelanguage.googleapis.com/v1/models?key=${process.env.GEMINI_API_KEY}`;
      
      const response = await fetch(listUrl);
      const data = await response.json();
      
      if (data.models) {
        const v1Models = data.models.map(model => ({
          name: model.name,
          displayName: model.displayName,
          supportedGenerationMethods: model.supportedGenerationMethods
        }));
        
        results.push({ 
          test: "Direct API List Models (v1)", 
          status: "WORKS", 
          models: v1Models 
        });
      }
    } catch (error) {
      results.push({ 
        test: "Direct API List Models (v1)", 
        status: "FAILED", 
        error: error.message 
      });
    }
    
    res.json({ 
      success: true, 
      sdkVersion: require('@google/generative-ai/package.json').version,
      message: "Testing direct API calls to find available models",
      results 
    });
    
  } catch (error) {
    res.json({ 
      success: false, 
      error: error.message,
      stack: error.stack 
    });
  }
});

// 🤖 AI Analysis Route (Fail-Safe)
app.post('/api/v1/analyze-issue', authenticateToken, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No image uploaded" });
    try {
      // 1. Try to use Google AI (Gemini 2.5 Flash is the current working model)
      if (!process.env.GEMINI_API_KEY) throw new Error("No API Key configured");
      
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const prompt = `Analyze this device repair issue. Return JSON: { "issue": "string", "severity": "string", "advice": "string" }`;
      const imagePart = {
        inlineData: {
          data: fs.readFileSync(req.file.path).toString("base64"),
          mimeType: req.file.mimetype
        },
      };
      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text().replace(/```json|```/g, '').trim();
      
      // Success!
      res.json({ success: true, diagnosis: JSON.parse(text) });
    } catch (aiError) {
      console.error("⚠️ AI Failed (Switching to Manual Mode):", aiError.message);
      
      // 2. FALLBACK: Return a dummy diagnosis so the app DOES NOT CRASH
      res.json({ 
        success: true, 
        diagnosis: { 
          issue: "Manual Inspection Required", 
          severity: "Moderate", 
          advice: "Our technician will diagnose the specific issue upon arrival." 
        } 
      });
    }
  } catch (error) { 
    console.error("Server Error:", error); 
    res.status(500).json({ success: false, message: "Server Error" }); 
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

// 🔍 Get Single Booking (For Tracking)
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
