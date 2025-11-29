// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// ------------------------------------------
// Health check
// ------------------------------------------
app.get('/api/health', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT 1 AS ok');
    res.json({ status: 'ok', db: rows[0].ok });
  } catch (err) {
    console.error('Health check error:', err);
    res.status(500).json({ status: 'error', error: 'DB connection failed' });
  }
});

// ------------------------------------------
// LOGIN (labai paprastas demo variantas)
// el_pastas + slaptazodis_hash (kol kas tiesiog tekstas)
// ------------------------------------------
app.post('/api/login', async (req, res) => {
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

// ------------------------------------------
// Gauti VISAS grupes (admin/overview variantas)
// ------------------------------------------
app.get('/api/groups', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
         g.id_grupe,
         g.pavadinimas,
         g.aprasas,
         g.sukurimo_data,
         g.privatumo_lygis,
         g.fk_id_vartotojas AS owner_id,
         v.vardas AS owner_vardas,
         v.pavarde AS owner_pavarde
       FROM Grupes g
       JOIN Vartotojai v ON g.fk_id_vartotojas = v.id_vartotojas
       ORDER BY g.sukurimo_data DESC`
    );

    res.json(rows);
  } catch (err) {
    console.error('Get groups error:', err);
    res.status(500).json({ message: 'Serverio klaida' });
  }
});

// ------------------------------------------
// Gauti grupes, kuriose konkretus vartotojas yra narys
// (pagal Grupes_nariai)
// ------------------------------------------
app.get('/api/groups-by-user/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const [rows] = await db.query(
      `SELECT 
         g.id_grupe,
         g.pavadinimas,
         g.aprasas,
         g.sukurimo_data,
         gn.role,
         gn.nario_busena,
         v.vardas AS owner_vardas,
         v.pavarde AS owner_pavarde
       FROM Grupes_nariai gn
       JOIN Grupes g ON gn.fk_id_grupe = g.id_grupe
       JOIN Vartotojai v ON g.fk_id_vartotojas = v.id_vartotojas
       WHERE gn.fk_id_vartotojas = ?`,
      [userId]
    );

    res.json(rows);
  } catch (err) {
    console.error('Get user groups error:', err);
    res.status(500).json({ message: 'Serverio klaida' });
  }
});

// ------------------------------------------
// Gauti skolas grupėje (Skolos)
// ------------------------------------------
app.get('/api/debts-by-group/:groupId', async (req, res) => {
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
app.get('/api/debt-parts/:debtId', async (req, res) => {
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
// Serverio paleidimas
// ------------------------------------------
app.listen(PORT, () => {
  console.log(`Backend serveris veikia ant http://localhost:${PORT}`);
});
