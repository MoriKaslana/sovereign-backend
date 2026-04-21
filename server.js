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
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 4. Endpoint Buffs
app.get('/buffs', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM buffs');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 5. Endpoint Achievements
app.get('/achievements', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM achievements');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 6. Endpoint Chat Messages
app.get('/chat_messages', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM chat_messages');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Setting Port untuk Railway
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server jalan di port ${PORT}`);
});