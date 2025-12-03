// routes/categoryRoutes.js
const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/api/categories', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id_kategorija as id, name FROM kategorijos ORDER BY id_kategorija`
    );
    // Konvertuojame id į string
    const categoriesWithStringId = rows.map(row => ({
      id: String(row.id),
      name: row.name
    }));
    res.json(categoriesWithStringId);
  } catch (err) {
    console.error('Klaida gaunant kategorijas:', err);
    res.status(500).json({ message: 'Serverio klaida' });
  }
});

module.exports = router;