const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Koneksi ke Database Railway
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } 
});

// 1. Endpoint Testing
app.get('/', (req, res) => {
  res.send('API Sovereign Guild Is Running! 🚀');
});

// 2. Endpoint Users
app.get('/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 3. Endpoint Quests
app.get('/quests', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM quests');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Endpoint Buffs & Debuffs
app.get('/buffs', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM buffs');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/debuffs', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM debuffs');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Endpoint Invitations
app.get('/invitations', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM invitations');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Endpoint Achievements
app.get('/achievements', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM achievements');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Endpoint Chat Messages (GET & DELETE)
app.get('/chat_messages', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM chat_messages ORDER BY created_at ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/chat_messages', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM chat_messages');
    res.json({ message: "Chat messages cleared", deletedCount: result.rowCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =====================================================================
// 8. DYNAMIC POST (Fungsi Asli untuk Insert Data, termasuk Register)
// =====================================================================
app.post('/:table', async (req, res) => {
  const { table } = req.params;
  
  // Keamanan: Hanya izinkan tabel-tabel ini
  const allowedTables = ['users', 'quests', 'buffs', 'debuffs', 'achievements', 'chat_messages', 'invitations'];
  if (!allowedTables.includes(table)) {
    return res.status(403).json({ error: "Tabel tidak dikenali." });
  }

  try {
    // Frontend Supabase kadang ngirim data di dalam array, kadang object biasa
    const data = Array.isArray(req.body) ? req.body[0] : req.body;
    
    // Tarik nama kolom (keys) dan isi datanya (values)
    const keys = Object.keys(data);
    const values = Object.values(data);
    
    // Bikin format $1, $2, $3 buat query SQL
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    
    const query = `
      INSERT INTO ${table} (${keys.join(', ')}) 
      VALUES (${placeholders}) 
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    
    // Supabase di frontend expect balikan datanya dibungkus array
    res.status(201).json(result.rows);
    
  } catch (err) {
    console.error(`❌ Error INSERT ke ${table}:`, err.message);
    
    // Kalau error kode 23505 (Constraint Violation / Duplikat Email atau Username)
    if (err.code === '23505') {
      return res.status(400).json({ error: "Username atau Email ini sudah dipakai. Cari yang lain, ksatria!" });
    }
    
    res.status(500).json({ error: err.message });
  }
});

// =====================================================================
// 9. DYNAMIC PATCH (Placeholder buat Update Data nanti)
// =====================================================================
app.patch('/:table', async (req, res) => {
  console.log(`⚠️ Frontend mencoba UPDATE data di tabel ${req.params.table}`, req.body);
  res.status(501).json({ message: "Fitur UPDATE belum dirakit di backend." });
});

// Setting Port untuk Railway
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server jalan di port ${PORT}`);
});