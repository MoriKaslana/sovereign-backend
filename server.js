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
      console.error(`❌ GET Error (${table}):`, err.message);
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

// =====================================================================
// 4. DYNAMIC POST (Untuk INSERT / Daftar)
// =====================================================================
app.post('/:table', async (req, res) => {
  const { table } = req.params;
  console.log(`📩 REQUEST POST: ${table}`);

  try {
    // Handle data jika dibungkus dalam array oleh Supabase SDK
    const data = Array.isArray(req.body) ? req.body[0] : req.body;
    
    if (!data || Object.keys(data).length === 0) {
      return res.status(400).json({ error: "Data tidak boleh kosong" });
    }

    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');

    const query = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`;
    
    const result = await pool.query(query, values);
    console.log(`✅ Berhasil Insert ke ${table}`);
    res.status(201).json(result.rows); // Selalu kirim result.rows (Array)
  } catch (err) {
    console.error("❌ ERROR INSERT:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// =====================================================================
// 5. DYNAMIC PATCH (Fix 400 Bad Request)
// =====================================================================
app.patch('/:table', async (req, res) => {
  const { table } = req.params;
  console.log(`🔄 REQUEST UPDATE: ${table}`);

  try {
    const data = Array.isArray(req.body) ? req.body[0] : req.body;
    
    // 🔍 RADAR ID LEBIH TELITI
    // 1. Cek dari query params (misal: ?id=eq.123 atau ?id=123)
    let id = req.query.id ? req.query.id.toString().replace('eq.', '') : null;
    
    // 2. Kalau di URL gak ada, cek di dalam Body data
    if (!id) id = data.id;

    // 3. Kalau masih gak ada, cek semua query params (siapa tahu namanya bukan 'id')
    if (!id && Object.keys(req.query).length > 0) {
      id = Object.values(req.query)[0].toString().replace('eq.', '');
    }

    if (!id) {
      console.log("⚠️ Update gagal: ID beneran gak ada di URL maupun Body");
      return res.status(400).json({ error: "ID wajib ada! Periksa .eq('id', questId) di FE lu." });
    }

    // Pisahkan ID agar tidak ikut masuk ke SET query
    const updateFields = { ...data };
    delete updateFields.id; 

    const keys = Object.keys(updateFields);
    const values = Object.values(updateFields);
    
    if (keys.length === 0) {
      return res.status(400).json({ error: "Data update kosong" });
    }

    const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
    values.push(id); 

    const query = `UPDATE ${table} SET ${setClause} WHERE id = $${values.length} RETURNING *`;
    
    console.log(`🚀 Menjalankan Update untuk ID: ${id}`);
    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      console.log("❌ Data tidak ditemukan di DB");
      return res.status(404).json({ error: "Data tidak ditemukan" });
    }

    console.log(`✅ Success Update ${table}!`);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ PATCH Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});
// =====================================================================
// 6. DYNAMIC DELETE (Untuk Hapus Chat atau Kick Member)
// =====================================================================
app.delete('/:table', async (req, res) => {
  const { table } = req.params;
  try {
    const id = req.query.id ? req.query.id.replace('eq.', '') : null;

    if (!id) {
      if (table === 'chat_messages') {
        const result = await pool.query('DELETE FROM chat_messages');
        return res.json({ message: "All chats cleared", deletedCount: result.rowCount });
      }
      return res.status(400).json({ error: "ID dibutuhkan untuk menghapus data" });
    }

    const query = `DELETE FROM ${table} WHERE id = $1 RETURNING *`;
    const result = await pool.query(query, [id]);
    
    console.log(`🗑️ Berhasil hapus dari ${table} (ID: ${id})`);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ DELETE Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Setting Port
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server jalan di port ${PORT}`);
});