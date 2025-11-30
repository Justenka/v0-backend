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

app.post('/api/groups', async (req, res) => {
  const { title, description, ownerId } = req.body;

  if (!title || !ownerId) {
    return res
      .status(400)
      .json({ message: 'Reikalingas pavadinimas ir ownerId' });
  }

  try {
    console.log('Creating group with body:', req.body);

    const [result] = await db.query(
      `INSERT INTO Grupes 
         (pavadinimas, aprasas, sukurimo_data, fk_id_vartotojas)
       VALUES (?, ?, NOW(), ?)`,
      [title, description || null, ownerId]
    );

    const groupId = result.insertId;
    console.log('New group id:', groupId);

    // 2) Pridedam kūrėją į Grupes_nariai kaip owner/admin
    await db.query(
    `INSERT INTO Grupes_nariai 
        (fk_id_grupe, fk_id_vartotojas, role, nario_busena, fk_id_sistemos_istorija)
    VALUES (?, ?, ?, ?, NULL)`,
    [groupId, ownerId, 1, 1]
    );

    // 3) Parsiunčiam pilną grupės info (kaip groups-by-user)
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
       WHERE gn.fk_id_vartotojas = ? AND g.id_grupe = ?`,
      [ownerId, groupId]
    );

    const group = rows[0];

    res.status(201).json(group);
  } catch (err) {
    console.error('Create group error:', err);
    //kad frontend matytų realią SQL klaidą (kol debugini)
    const message =
      err.sqlMessage || err.message || 'Nepavyko sukurti grupės';
    res.status(500).json({ message });
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
// GET /api/categories – gauna visas kategorijas
app.get('/api/categories', async (req, res) => {
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
// GET /api/groups/:id – grąžina grupę + narius + SKOLAS (išlaidas)
app.get('/api/groups/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Grupės info
    const [groupRows] = await db.query(
      `SELECT g.*, v.vardas AS owner_vardas, v.pavarde AS owner_pavarde
       FROM Grupes g
       JOIN Vartotojai v ON g.fk_id_vartotojas = v.id_vartotojas
       WHERE g.id_grupe = ?`, [id]
    );

    if (groupRows.length === 0) {
      return res.status(404).json({ message: "Grupė nerasta" });
    }

    // 2. Nariai
    const [memberRows] = await db.query(
      `SELECT v.id_vartotojas AS id, v.vardas AS name, gn.role
       FROM Grupes_nariai gn
       JOIN Vartotojai v ON gn.fk_id_vartotojas = v.id_vartotojas
       WHERE gn.fk_id_grupe = ?`, [id]
    );

    // 3. VISOS SKOLOS (išlaidos)
    const [debtsRows] = await db.query(
      `SELECT 
         s.id_skola AS id,
         s.pavadinimas AS title,
         s.suma AS amount,
         s.sukurimo_data AS createdAt,
         s.valiutos_kodas,
         v.vardas AS paidByName
       FROM Skolos s
       JOIN Vartotojai v ON s.fk_id_vartotojas = v.id_vartotojas
       WHERE s.fk_id_grupe = ?
       ORDER BY s.sukurimo_data DESC`, [id]
    );

    res.json({
      ...groupRows[0],
      members: memberRows.map(m => ({
        id: m.id,
        name: m.name,
        role: m.role === 1 ? "admin" : "member"
      })),
      debts: debtsRows.map(d => ({
        id: d.id,
        title: d.title,
        amount: Number(d.amount),
        currency: d.valiutos_kodas === 1 ? "EUR" : d.valiutos_kodas === 2 ? "USD" : "PLN",
        paidBy: d.paidByName,
        createdAt: d.createdAt
      }))
    });
  } catch (err) {
    console.error('Klaida gaunant grupę:', err);
    res.status(500).json({ message: 'Serverio klaida' });
  }
});
// GET /api/groups/:id – pilna grupė su nariais
app.get('/api/groups/:id', async (req, res) => {
  const { id } = req.params

  try {
    // 1. Pati grupė
    const [groupRows] = await db.query(
      `SELECT 
         g.*,
         v.vardas AS owner_vardas,
         v.pavarde AS owner_pavarde
       FROM Grupes g
       JOIN Vartotojai v ON g.fk_id_vartotojas = v.id_vartotojas
       WHERE g.id_grupe = ?`,
      [id]
    )

    if (groupRows.length === 0) {
      return res.status(404).json({ message: "Grupė nerasta" })
    }

    // 2. Visi nariai
    const [memberRows] = await db.query(
      `SELECT 
         v.id_vartotojas AS id,
         v.vardas AS name,
         v.el_pastas AS email,
         gn.role
       FROM Grupes_nariai gn
       JOIN Vartotojai v ON gn.fk_id_vartotojas = v.id_vartotojas
       WHERE gn.fk_id_grupe = ?`,
      [id]
    )

    res.json({
      ...groupRows[0],
      members: memberRows.map(m => ({
        id: m.id,
        name: m.name,
        email: m.email || `${m.name.toLowerCase()}@example.com`,
        role: m.role === 1 ? "admin" : "member"
      }))
    })
  } catch (err) {
    console.error('Klaida gaunant grupę:', err)
    res.status(500).json({ message: 'Serverio klaida' })
  }
});
// ------------------------------------------
// Sukurti naują skolą (išlaidą)
// ------------------------------------------
// POST /api/debts – sukuria naują išlaidą (skolą)
// POST /api/debts – sukuria naują išlaidą (skolą)
app.post('/api/debts', async (req, res) => {
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
// ------------------------------------------
// Serverio paleidimas
// ------------------------------------------
app.listen(PORT, () => {
  console.log(`Backend serveris veikia ant http://localhost:${PORT}`);
});
