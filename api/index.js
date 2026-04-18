const express = require('express');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors({
  origin: 'https://dt-bug-club-frontend.vercel.app' 
}));
app.use(express.json());

// Log requests for debugging in Vercel dashboard
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

const dbPath = process.env.VERCEL ? '/tmp/database.sqlite' : path.join(__dirname, 'database.sqlite');

const dbPromise = open({
  filename: dbPath,
  driver: sqlite3.Database
});

async function ensureDb() {
  const db = await dbPromise;
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
  return db;
}

// Support both /api/health and /health
const healthHandler = (req, res) => res.json({ status: 'ok', env: process.env.VERCEL ? 'vercel' : 'local', time: new Date().toISOString() });
app.get('/api/health', healthHandler);
app.get('/health', healthHandler);

// Staff endpoints
app.get(['/api/staff', '/staff'], async (req, res) => {
  try {
    const db = await ensureDb();
    const staff = await db.all('SELECT * FROM staff');
    res.json(staff);
  } catch (err) {
    console.error('Error fetching staff:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post(['/api/staff', '/staff'], async (req, res) => {
  try {
    const { name, club } = req.body;
    const db = await ensureDb();
    const result = await db.run('INSERT INTO staff (name, club) VALUES (?, ?)', [name, club]);
    res.json({ id: result.lastID, name, club });
  } catch (err) {
    console.error('Error creating staff:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete(['/api/staff/:id', '/staff/:id'], async (req, res) => {
  try {
    const db = await ensureDb();
    await db.run('DELETE FROM staff WHERE id = ?', [req.params.id]);
    await db.run('DELETE FROM records WHERE staff_id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting staff:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post(['/api/records', '/records'], async (req, res) => {
  try {
    const { staff_id, month, hours, gifts } = req.body;
    const db = await ensureDb();
    const existing = await db.get('SELECT id FROM records WHERE staff_id = ? AND month = ?', [staff_id, month]);
    
    if (existing) {
      await db.run('UPDATE records SET hours = ?, gifts = ? WHERE id = ?', [hours, gifts, existing.id]);
    } else {
      await db.run('INSERT INTO records (staff_id, month, hours, gifts) VALUES (?, ?, ?, ?)', [staff_id, month, hours, gifts]);
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating records:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get(['/api/report/:month', '/report/:month'], async (req, res) => {
  try {
    const { month } = req.params;
    const db = await ensureDb();

    const data = await db.all(`
      SELECT s.id, s.name, s.club, r.hours, r.gifts
      FROM staff s
      LEFT JOIN records r ON s.id = r.staff_id AND r.month = ?
    `, [month]);

    const clubs = { DT: [], Bug: [] };
    data.forEach(row => {
      const hours = row.hours || 0;
      const gifts = row.gifts || 0;
      if (clubs[row.club]) {
        clubs[row.club].push({ ...row, hours, gifts });
      }
    });

    const finalReport = [];
    const sortedAll = [...data].sort((a, b) => (b.hours || 0) - (a.hours || 0));
    const aceIds = new Set(sortedAll.slice(0, 3).filter(s => (s.hours || 0) > 0).map(s => s.id));

    data.forEach(staff => {
      const hours = staff.hours || 0;
      const gifts = staff.gifts || 0;
      const giftValue = gifts * 12;
      const isAce = aceIds.has(staff.id);
      
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

      finalReport.push({
        ...staff,
        hours,
        gifts,
        isAce,
        baseSalary,
        giftValue,
        clubCut,
        finalSalary
      });
    });

    res.json(finalReport);
  } catch (err) {
    console.error('Error generating report:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = app;
