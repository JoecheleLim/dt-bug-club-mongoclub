require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../frontend/dist')));

let db;

(async () => {
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
})();

app.get('/api/health', (req, res) => res.json({ status: 'ok', db: 'sqlite' }));

// Staff endpoints
app.get('/api/staff', async (req, res) => {
  try {
    const staff = await db.all('SELECT * FROM staff');
    res.json(staff);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/staff', async (req, res) => {
  try {
    const { name, club } = req.body;
    const result = await db.run('INSERT INTO staff (name, club) VALUES (?, ?)', [name, club]);
    res.json({ id: result.lastID, name, club });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/staff/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.run('DELETE FROM staff WHERE id = ?', [id]);
    await db.run('DELETE FROM records WHERE staff_id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/records', async (req, res) => {
  try {
    const { staff_id, month, hours, gifts } = req.body;
    
    const existing = await db.get('SELECT id FROM records WHERE staff_id = ? AND month = ?', [staff_id, month]);
    
    if (existing) {
      await db.run('UPDATE records SET hours = ?, gifts = ? WHERE id = ?', [hours, gifts, existing.id]);
    } else {
      await db.run('INSERT INTO records (staff_id, month, hours, gifts) VALUES (?, ?, ?, ?)', [staff_id, month, hours, gifts]);
    }
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/report/:month', async (req, res) => {
  try {
    const { month } = req.params;
    
    // Calculate previous month
    const [year, m] = month.split('-').map(Number);
    const prevMonthDate = new Date(year, m - 2);
    const prevMonth = prevMonthDate.toISOString().slice(0, 7);
    
    // Fetch all staff
    const staffList = await db.all('SELECT * FROM staff');
    
    // Fetch records for this month
    const records = await db.all('SELECT * FROM records WHERE month = ?', [month]);
    
    // Fetch records for previous month to determine Aces
    const prevRecords = await db.all('SELECT * FROM records WHERE month = ?', [prevMonth]);
    
    // Determine Aces based on PREVIOUS month
    const clubsPrev = { DT: [], Bug: [] };
    staffList.forEach(s => {
      const prevRecord = prevRecords.find(r => r.staff_id === s.id);
      clubsPrev[s.club].push({
        id: s.id,
        hours: prevRecord ? prevRecord.hours : 0
      });
    });

    const aceIds = new Set();
    Object.keys(clubsPrev).forEach(clubName => {
      const staffInClub = clubsPrev[clubName];
      staffInClub.sort((a, b) => b.hours - a.hours);
      // Top 3 with > 0 hours are Aces
      staffInClub.slice(0, 3).forEach(s => {
        if (s.hours > 0) aceIds.add(s.id);
      });
    });

    // Map current records to staff and apply Ace status
    const finalReport = staffList.map(s => {
      const record = records.find(r => r.staff_id === s.id);
      const isAce = aceIds.has(s.id);
      
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
        id: s.id,
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
