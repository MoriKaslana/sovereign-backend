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

// 2. GET Endpoints (Users, Quests, Buffs, dll)
const tables = ['users', 'quests', 'buffs', 'debuffs', 'invitations', 'achievements'];
tables.forEach(table => {
  app.get(`/${table}`, async (req, res) => {
    try {
      const result = await pool.query(`SELECT * FROM ${table}`);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
});

// 3. Khusus Chat Messages (dengan Order)
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
// 4. DYNAMIC POST (Untuk INSERT / Daftar)
// =====================================================================
app.post('/:table', async (req, res) => {
  const { table } = req.params;
  console.log(`📩 REQUEST MASUK! Tabel: ${table}`);
  console.log(`📦 Body:`, JSON.stringify(req.body, null, 2));

  try {
    // Supabase SDK sering ngirim data dalam Array [ {} ]
    const data = Array.isArray(req.body) ? req.body[0] : req.body;
    
    if (!data || Object.keys(data).length === 0) {
      console.log("⚠️ Data kosong!");
      return res.status(400).json({ error: "Data tidak boleh kosong" });
    }

    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');

    const query = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`;
    
    const result = await pool.query(query, values);
    console.log("✅ Berhasil Insert:", result.rows[0]);
    
    // Kirim balik dalam Array karena Supabase SDK haus akan Array
    res.status(201).json(result.rows);
  } catch (err) {
    console.error("❌ ERROR INSERT:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// =====================================================================
// 5. DYNAMIC PATCH (Untuk UPDATE / Selesai Quest / Level Up)
// =====================================================================
app.patch('/:table', async (req, res) => {
  const { table } = req.params;
  try {
    const data = Array.isArray(req.body) ? req.body[0] : req.body;
    
    // Supabase biasanya kirim ID di body atau kita butuh filter. 
    // Untuk simplifikasi skripsi, kita asumsikan ID ada di dalam body data.
    if (!data || !data.id) return res.status(400).json({ error: "ID wajib ada untuk Update" });

    const { id, ...updateFields } = data;
    const keys = Object.keys(updateFields);
    const values = Object.values(updateFields);
    
    const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
    values.push(id); // ID jadi parameter terakhir

    const query = `UPDATE ${table} SET ${setClause} WHERE id = $${values.length} RETURNING *`;
    
    console.log(`🔄 UPDATE di ${table} ID: ${id}`);
    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// Setting Port
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server jalan di port ${PORT}`);
});