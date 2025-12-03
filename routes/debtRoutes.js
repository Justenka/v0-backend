// routes/debtRoutes.js
const express = require('express');
const db = require('../db');

const router = express.Router();

// ... čia pridėk maršrutus susijusius su skolomis ...

// ------------------------------------------
// Gauti skolas grupėje (Skolos)
// ------------------------------------------
router.get('/api/debts-by-group/:groupId', async (req, res) => {
  const { groupId } = req.params;

  try {
    const [rows] = await db.query(
      `SELECT 
         s.id_skola,
         s.pavadinimas,
         s.aprasymas,
         s.suma,
         s.kursas_eurui,
         s.sukurimo_data,
         s.paskutinio_keitimo_data,
         s.terminas,
         s.valiutos_kodas,
         s.skolos_statusas,
         s.kategorija,
         v.vardas AS creator_vardas,
         v.pavarde AS creator_pavarde
       FROM Skolos s
       JOIN Vartotojai v ON s.fk_id_vartotojas = v.id_vartotojas
       WHERE s.fk_id_grupe = ?`,
      [groupId]
    );

    res.json(rows);
  } catch (err) {
    console.error('Get debts by group error:', err);
    res.status(500).json({ message: 'Serverio klaida' });
  }
});

// ------------------------------------------
// (Papildomai) Gauti skolos dalis (participants)
// ------------------------------------------
router.get('/api/debt-parts/:debtId', async (req, res) => {
  const { debtId } = req.params;

  try {
    const [rows] = await db.query(
      `SELECT 
         sd.id_skolos_dalis,
         sd.suma,
         sd.procentas,
         sd.apmoketa,
         sd.delspinigiai,
         sd.vaidmuo,
         v.vardas,
         v.pavarde
       FROM Skolos_dalys sd
       JOIN Vartotojai v ON sd.fk_id_vartotojas = v.id_vartotojas
       WHERE sd.fk_id_skola = ?`,
      [debtId]
    );

    res.json(rows);
  } catch (err) {
    console.error('Get debt parts error:', err);
    res.status(500).json({ message: 'Serverio klaida' });
  }
});

// ------------------------------------------
// Sukurti naują skolą (išlaidą)
// ------------------------------------------
// POST /api/debts – sukuria naują išlaidą (skolą)
router.post('/api/debts', async (req, res) => {
  const {
    groupId,
    title,
    description,
    amount,
    currencyCode = 'EUR',
    paidByUserId,
    categoryId,
    splits = [],
    lateFeeAmount,
    lateFeeAfterDays = 30
  } = req.body;

  if (!groupId || !title || !amount || !paidByUserId || splits.length === 0) {
    return res.status(400).json({ message: 'Trūksta privalomų laukų' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const today = new Date().toISOString().slice(0, 10);
    const termDate = new Date();
    termDate.setDate(termDate.getDate() + lateFeeAfterDays);
    const termDateStr = termDate.toISOString().slice(0, 10);

    // --- PATIKIMAS VALIUTOS NUSTATYMAS ---
    let valiutos_kodas = 1; // default EUR

    if (currencyCode) {
      const code = currencyCode.trim().toUpperCase();
      const currencyMap = { 'EUR': 1, 'USD': 2, 'PLN': 3 };
      
      if (currencyMap[code]) {
        valiutos_kodas = currencyMap[code];
      } else {
        try {
          const [rows] = await connection.query(
            `SELECT id_valiuta FROM valiutos WHERE UPPER(name) = ? LIMIT 1`,
            [code]
          );
          if (rows.length > 0) {
            valiutos_kodas = rows[0].id_valiuta;
          } else {
            console.log(`Valiuta nerasta: ${code}, naudojamas default EUR (1)`);
            valiutos_kodas = 1;
          }
        } catch (e) {
          console.error('Klaida ieškant valiutos:', e);
          valiutos_kodas = 1;
        }
      }
    }

    console.log('Naudojamas valiutos_kodas:', valiutos_kodas);

    // *** FIX: Konvertuojame categoryId į skaičių arba null ***
    let kategorijaId = null;
    if (categoryId) {
      const parsed = parseInt(categoryId, 10);
      if (!isNaN(parsed)) {
        // Patikriname, ar tokia kategorija egzistuoja
        const [catRows] = await connection.query(
          `SELECT id_kategorija FROM kategorijos WHERE id_kategorija = ? LIMIT 1`,
          [parsed]
        );
        if (catRows.length > 0) {
          kategorijaId = parsed;
        } else {
          console.warn(`Kategorija su ID ${parsed} nerasta, naudojamas NULL`);
        }
      }
    }

    // 1. Sukuriame skolą
    const [debtResult] = await connection.query(
      `INSERT INTO Skolos 
        (fk_id_grupe, fk_id_vartotojas, pavadinimas, aprasymas, suma, kursas_eurui,
         sukurimo_data, paskutinio_keitimo_data, terminas, valiutos_kodas,
         skolos_statusas, kategorija)
       VALUES (?, ?, ?, ?, ?, 1.0000, ?, ?, ?, ?, 1, ?)`,
      [
        groupId,
        paidByUserId,
        title,
        description || null,
        amount,
        today,
        today,
        termDateStr,
        valiutos_kodas,
        kategorijaId  // *** NAUDOJAME PATIKRINTĄ REIKŠMĘ ***
      ]
    );

    const debtId = debtResult.insertId;

    // 2. Sukuriame skolos dalis
    for (const split of splits) {
      const role = Number(split.userId) === Number(paidByUserId) ? 2 : 1;
      
      await connection.query(
        `INSERT INTO Skolos_dalys 
          (fk_id_skola, fk_id_vartotojas, suma, procentas, apmoketa, delspinigiai, vaidmuo)
         VALUES (?, ?, ?, ?, 0, ?, ?)`,
        [
          debtId,
          split.userId,
          split.amount || 0,
          split.percentage || 0,
          lateFeeAmount > 0 ? 1 : 0,
          role
        ]
      );
    }

    await connection.commit();
    res.status(201).json({ message: 'Išlaida sėkmingai pridėta!', debtId });
  } catch (err) {
    await connection.rollback();
    console.error('Klaida kuriant skolą:', err);
    res.status(500).json({ message: err.sqlMessage || 'Serverio klaida' });
  } finally {
    connection.release();
  }
});

module.exports = router;