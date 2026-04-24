require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../frontend/dist')));

let db; // SQLite connection
let isMongoDB = false;

// Schemas for Mongoose
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

(async () => {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (MONGODB_URI) {
    try {
      await mongoose.connect(MONGODB_URI);
      isMongoDB = true;
      console.log('Connected to MongoDB Atlas');
    } catch (err) {
      console.error('MongoDB connection error, falling back to SQLite:', err);
    }
  }

  if (!isMongoDB) {
    db = await open({
      filename: path.join(__dirname, 'database.sqlite'),
      driver: sqlite3.Database
    });

    await db.exec(`
      CREATE TABLE IF NOT EXISTS staff (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        club TEXT NOT NULL CHECK(club IN ('DT', 'Bug'))
      );
      CREATE TABLE IF NOT EXISTS records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        staff_id INTEGER NOT NULL,
        month TEXT NOT NULL,
        hours REAL DEFAULT 0,
        gifts INTEGER DEFAULT 0,
        FOREIGN KEY(staff_id) REFERENCES staff(id)
      );
    `);
    console.log('Connected to SQLite database');
  }
})();

app.get('/api/health', (req, res) => res.json({ status: 'ok', db: isMongoDB ? 'mongodb' : 'sqlite' }));

// Staff endpoints
app.get('/api/staff', async (req, res) => {
  try {
    if (isMongoDB) {
      const staff = await Staff.find().lean();
      res.json(staff.map(s => ({ ...s, id: s._id })));
    } else {
      const staff = await db.all('SELECT * FROM staff');
      res.json(staff);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/staff', async (req, res) => {
  try {
    const { name, club } = req.body;
    if (isMongoDB) {
      const staff = new Staff({ name, club });
      await staff.save();
      res.json({ ...staff.toObject(), id: staff._id });
    } else {
      const result = await db.run('INSERT INTO staff (name, club) VALUES (?, ?)', [name, club]);
      res.json({ id: result.lastID, name, club });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/staff/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (isMongoDB) {
      await Staff.findByIdAndDelete(id);
      await Record.deleteMany({ staff_id: id });
    } else {
      await db.run('DELETE FROM staff WHERE id = ?', [id]);
      await db.run('DELETE FROM records WHERE staff_id = ?', [id]);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/records', async (req, res) => {
  try {
    const { staff_id, month, hours, gifts } = req.body;
    
    if (isMongoDB) {
      await Record.findOneAndUpdate(
        { staff_id, month },
        { hours, gifts },
        { upsert: true, new: true }
      );
    } else {
      const existing = await db.get('SELECT id FROM records WHERE staff_id = ? AND month = ?', [staff_id, month]);
      if (existing) {
        await db.run('UPDATE records SET hours = ?, gifts = ? WHERE id = ?', [hours, gifts, existing.id]);
      } else {
        await db.run('INSERT INTO records (staff_id, month, hours, gifts) VALUES (?, ?, ?, ?)', [staff_id, month, hours, gifts]);
      }
    }
    
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
    
    let staffList, records, prevRecords;

    if (isMongoDB) {
      staffList = await Staff.find().lean();
      records = await Record.find({ month }).lean();
      prevRecords = await Record.find({ month: prevMonth }).lean();
    } else {
      staffList = await db.all('SELECT * FROM staff');
      records = await db.all('SELECT * FROM records WHERE month = ?', [month]);
      prevRecords = await db.all('SELECT * FROM records WHERE month = ?', [prevMonth]);
    }
    
    const clubsPrev = { DT: [], Bug: [] };
    staffList.forEach(s => {
      const sId = isMongoDB ? s._id.toString() : s.id;
      const prevRecord = prevRecords.find(r => (isMongoDB ? r.staff_id.toString() : r.staff_id) === sId);
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
      const sId = isMongoDB ? s._id.toString() : s.id;
      const record = records.find(r => (isMongoDB ? r.staff_id.toString() : r.staff_id) === sId);
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
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
