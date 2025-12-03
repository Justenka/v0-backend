// routes/authRoutes.js
const express = require('express');
const db = require('../db');
// const bcrypt = require('bcrypt');
// const jwt = require('jsonwebtoken');

const router = express.Router();

// ------------------------------------------
// LOGIN (labai paprastas demo variantas)
// el_pastas + slaptazodis_hash (kol kas tiesiog tekstas)
// ------------------------------------------
router.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: 'Reikalingi el. paštas ir slaptažodis' });
  }

  try {
    const [rows] = await db.query(
      `SELECT 
         id_vartotojas,
         vardas,
         pavarde,
         el_pastas,
         valiutos_kodas,
         sukurimo_data,
         paskutinis_prisijungimas
       FROM Vartotojai
       WHERE el_pastas = ? AND slaptazodis_hash = ?`,
      [email, password]
    );

    if (rows.length === 0) {
      return res
        .status(401)
        .json({ message: 'Neteisingas el. paštas arba slaptažodis' });
    }

    const user = rows[0];

    await db.query(
      'UPDATE Vartotojai SET paskutinis_prisijungimas = NOW() WHERE id_vartotojas = ?',
      [user.id_vartotojas]
    );

    // Vėliau čia galima dėti JWT tokeną
    res.json({ user });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Serverio klaida' });
  }
});

// jei turi /api/register – irgi čia.

module.exports = router;