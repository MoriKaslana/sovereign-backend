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
  ssl: { rejectUnauthorized: false } // Wajib buat cloud
});

// Endpoint Testing (Biar tau server jalan)
app.get('/', (req, res) => {
  res.send('API Sovereign Guild Is Running!');
});

// Contoh Endpoint ambil data Users (Sesuai tabel lu)
app.get('/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Database Error');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server jalan di port ${PORT}`);
});