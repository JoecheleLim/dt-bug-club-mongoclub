

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');

const app = express();
app.use(cors({
  origin: ["https://dt-bug-club-mongoclub-frontend.vercel.app", "http://localhost:3000", "http://localhost:5173"],
  methods: ["GET", "POST", "DELETE", "OPTIONS"],
  credentials: true
}));
app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).send("Bug Club Backend is Live!");
});

app.get('/test-db', async (req, res) => {
  try {
    // This checks if you can actually talk to your MongoDB Atlas cluster
    const state = mongoose.connection.readyState; 
    const status = state === 1 ? "Connected to MongoDB" : "Not Connected";
    res.send(`Server Status: Live | Database: ${status}`);
  } catch (err) {
    res.status(500).send("Database connection error");
  }
});

// Also add a route to check MongoDB
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'online', 
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' 
  });
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

// MongoDB Schemas
const staffSchema = new mongoose.Schema({
  name: { type: String, required: true },
  club: { type: String, required: true, enum: ['DT', 'Bug'] }
});

const recordSchema = new mongoose.Schema({
  staff_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
  month: { type: String, required: true },
  hours: { type: Number, default: 0 },
  gifts: { type: Number, default: 0 }
});

const Staff = mongoose.model('Staff', staffSchema);
const Record = mongoose.model('Record', recordSchema);

const bugSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  status: { type: String, default: 'open' },
  createdAt: { type: Date, default: Date.now }
});

const Bug = mongoose.model('Bug', bugSchema);

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('CRITICAL: MONGODB_URI is not defined in environment variables.');
  process.exit(1);
}

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

app.get('/api/health', (req, res) => res.json({ status: 'ok', db: 'mongodb' }));

// Bug endpoints
app.get('/api/bugs', async (req, res) => {
  try {
    const bugs = await Bug.find().sort({ createdAt: -1 });
    res.json(bugs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/bugs', async (req, res) => {
  try {
    const bug = new Bug(req.body);
    await bug.save();
    res.json(bug);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Staff endpoints
app.get('/api/staff', async (req, res) => {
  try {
    const staff = await Staff.find().lean();
    res.json(staff.map(s => ({ ...s, id: s._id })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/staff', async (req, res) => {
  try {
    const { name, club } = req.body;
    const staff = new Staff({ name, club });
    await staff.save();
    res.json({ ...staff.toObject(), id: staff._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/staff/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Staff.findByIdAndDelete(id);
    await Record.deleteMany({ staff_id: id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/records', async (req, res) => {
  try {
    const { staff_id, month, hours, gifts } = req.body;
    
    await Record.findOneAndUpdate(
      { staff_id, month },
      { hours, gifts },
      { upsert: true, new: true }
    );
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/report/:month', async (req, res) => {
  try {
    const { month } = req.params;
    
    const [year, m] = month.split('-').map(Number);
    const prevMonthDate = new Date(year, m - 2);
    const prevMonth = prevMonthDate.toISOString().slice(0, 7);
    
    const staffList = await Staff.find().lean();
    const records = await Record.find({ month }).lean();
    const prevRecords = await Record.find({ month: prevMonth }).lean();
    
    const clubsPrev = { DT: [], Bug: [] };
    staffList.forEach(s => {
      const sId = s._id.toString();
      const prevRecord = prevRecords.find(r => r.staff_id.toString() === sId);
      clubsPrev[s.club].push({
        id: sId,
        hours: prevRecord ? prevRecord.hours : 0
      });
    });

    const aceIds = new Set();
    Object.keys(clubsPrev).forEach(clubName => {
      const staffInClub = clubsPrev[clubName];
      staffInClub.sort((a, b) => b.hours - a.hours);
      staffInClub.slice(0, 3).forEach(s => {
        if (s.hours > 0) aceIds.add(s.id);
      });
    });

    const finalReport = staffList.map(s => {
      const sId = s._id.toString();
      const record = records.find(r => r.staff_id.toString() === sId);
      const isAce = aceIds.has(sId);
      
      const hours = record ? record.hours : 0;
      const gifts = record ? record.gifts : 0;
      const giftValue = gifts * 12;
      
      let baseSalary, clubCut;
      
      if (isAce) {
        baseSalary = hours * 14;
        const taxableSalary = Math.max(0, baseSalary - (4 * hours));
        clubCut = (0.25 * taxableSalary) + (0.10 * giftValue);
      } else {
        baseSalary = hours * 10;
        clubCut = (0.20 * baseSalary) + (0.10 * giftValue);
      }

      const finalSalary = (baseSalary + giftValue) - clubCut;

      return {
        id: sId,
        name: s.name,
        club: s.club,
        hours,
        gifts,
        isAce,
        baseSalary,
        giftValue,
        clubCut,
        finalSalary
      };
    });

    res.json(finalReport);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Catch-all to serve React app
// app.use((req, res, next) => {
//   if (req.path.startsWith('/api')) return next();
//   res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
// });

// const PORT = process.env.PORT || 3001;
// if (process.env.NODE_ENV !== 'production') {
//   app.listen(PORT, '0.0.0.0', () => {
//     console.log(`Server running on port ${PORT}`);
//   });
// }

module.exports = app;
