const express = require('express');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../frontend/dist')));

const dbPromise = open({
  filename: path.join(__dirname, 'database.sqlite'),
  driver: sqlite3.Database
});

async function setup() {
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
}

setup();

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Staff endpoints
app.get('/api/staff', async (req, res) => {
  const db = await dbPromise;
  const staff = await db.all('SELECT * FROM staff');
  res.json(staff);
});

app.post('/api/staff', async (req, res) => {
  const { name, club } = req.body;
  const db = await dbPromise;
  const result = await db.run('INSERT INTO staff (name, club) VALUES (?, ?)', [name, club]);
  res.json({ id: result.lastID, name, club });
});

app.delete('/api/staff/:id', async (req, res) => {
  const db = await dbPromise;
  await db.run('DELETE FROM staff WHERE id = ?', [req.params.id]);
  await db.run('DELETE FROM records WHERE staff_id = ?', [req.params.id]);
  res.json({ success: true });
});

// Record endpoints
app.post('/api/records', async (req, res) => {
  const { staff_id, month, hours, gifts } = req.body;
  const db = await dbPromise;
  const existing = await db.get('SELECT id FROM records WHERE staff_id = ? AND month = ?', [staff_id, month]);
  
  if (existing) {
    await db.run('UPDATE records SET hours = ?, gifts = ? WHERE id = ?', [hours, gifts, existing.id]);
  } else {
    await db.run('INSERT INTO records (staff_id, month, hours, gifts) VALUES (?, ?, ?, ?)', [staff_id, month, hours, gifts]);
  }
  res.json({ success: true });
});

// Report endpoint
app.get('/api/report/:month', async (req, res) => {
  const { month } = req.params;
  const db = await dbPromise;

  const data = await db.all(`
    SELECT s.id, s.name, s.club, r.hours, r.gifts
    FROM staff s
    LEFT JOIN records r ON s.id = r.staff_id AND r.month = ?
  `, [month]);

  const clubs = { DT: [], Bug: [] };
  data.forEach(row => {
    const hours = row.hours || 0;
    const gifts = row.gifts || 0;
    clubs[row.club].push({ ...row, hours, gifts });
  });

  const finalReport = [];

  Object.keys(clubs).forEach(clubName => {
    const staffInClub = clubs[clubName];
    staffInClub.sort((a, b) => b.hours - a.hours);

    staffInClub.forEach((staff, index) => {
      const isAce = index < 3 && staff.hours > 0;
      const hours = staff.hours;
      const gifts = staff.gifts;
      const giftValue = gifts * 12;
      
      let baseSalary, clubCut;
      
      if (isAce) {
        baseSalary = hours * 14;
        const taxableSalary = baseSalary - (4 * hours);
        clubCut = (0.25 * taxableSalary) + (0.10 * giftValue);
      } else {
        baseSalary = hours * 10;
        clubCut = (0.20 * baseSalary) + (0.10 * giftValue);
      }

      const finalSalary = (baseSalary + giftValue) - clubCut;

      finalReport.push({
        ...staff,
        isAce,
        baseSalary,
        giftValue,
        clubCut,
        finalSalary
      });
    });
  });

  res.json(finalReport);
});

// Catch-all to serve React app for any other routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Unified Server running on port ${PORT}`);
});
