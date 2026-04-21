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

// =====================================================================
// 4. DYNAMIC POST (Untuk INSERT / Daftar)
// =====================================================================
app.post('/:table', async (req, res) => {
  const { table } = req.params;
  console.log(`📩 REQUEST POST: ${table}`);

  try {
    const data = Array.isArray(req.body) ? req.body[0] : req.body;
    
    if (!data || Object.keys(data).length === 0) {
      return res.status(400).json({ error: "Data tidak boleh kosong" });
    }

    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');

    const query = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`;
    
    const result = await pool.query(query, values);
    console.log("✅ Berhasil Insert!");
    res.status(201).json(result.rows);
  } catch (err) {
    console.error("❌ ERROR INSERT:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// =====================================================================
// 5. DYNAMIC PATCH (DI-UPGRADE: Bisa baca filter Supabase)
// =====================================================================
app.patch('/:table', async (req, res) => {
  const { table } = req.params;
  console.log(`🔄 REQUEST UPDATE: ${table}`);

  try {
    const data = Array.isArray(req.body) ? req.body[0] : req.body;
    
    // DETEKSI ID: Ambil dari Query String (?id=eq.xxx) ATAU dari Body data
    const idFromUrl = req.query.id ? req.query.id.replace('eq.', '') : null;
    const id = idFromUrl || data.id;

    if (!id) {
      console.log("⚠️ Update gagal: ID tidak ditemukan");
      return res.status(400).json({ error: "ID wajib ada untuk Update (di URL atau Body)" });
    }

    // Pisahkan ID dari data yang mau diupdate agar tidak terjadi 'id = id'
    const { id: _, ...updateFields } = data;
    const keys = Object.keys(updateFields);
    const values = Object.values(updateFields);
    
    if (keys.length === 0) {
      return res.status(400).json({ error: "Tidak ada data yang di-update" });
    }

    const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
    values.push(id); // ID ditaruh di urutan terakhir parameter

    const query = `UPDATE ${table} SET ${setClause} WHERE id = $${values.length} RETURNING *`;
    
    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Data tidak ditemukan" });
    }

    console.log(`✅ ${table} Berhasil Diupdate!`);
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
    // Ambil ID dari query string ?id=eq.xxx
    const id = req.query.id ? req.query.id.replace('eq.', '') : null;

    if (!id) {
      // Jika tidak ada ID, tapi tabelnya chat_messages, kita izinkan hapus semua (fitur lama lu)
      if (table === 'chat_messages') {
        const result = await pool.query('DELETE FROM chat_messages');
        return res.json({ message: "All chats cleared", deletedCount: result.rowCount });
      }
      return res.status(400).json({ error: "ID dibutuhkan untuk menghapus data" });
    }

    const query = `DELETE FROM ${table} WHERE id = $1 RETURNING *`;
    const result = await pool.query(query, [id]);
    
    console.log(`🗑️ Berhasil hapus dari ${table}`);
    res.json({ message: "Deleted successfully", deletedCount: result.rowCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Setting Port
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server jalan di port ${PORT}`);
});