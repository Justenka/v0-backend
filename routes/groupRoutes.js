// routes/groupRoutes.js
const express = require('express');
const db = require('../db');
// jei turi auth middleware, vėliau:
// const auth = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/api/groups', async (req, res) => {
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
router.get('/api/groups', async (req, res) => {
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
router.get('/api/groups-by-user/:userId', async (req, res) => {
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


// GET /api/groups/:id – pilna grupė su nariais
router.get('/api/groups/:id', async (req, res) => {
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

router.get('/api/debt-parts/:debtId', async (req, res) => {
  const { debtId } = req.params;
  try {
    const [rows] = await db.query(
      `SELECT 
         sd.id_skolos_dalis,
         sd.suma,
         sd.procentas,
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

// ==================================================================
// GRUPIŲ ŽINUTĖS
// ==================================================================

// GET /api/groups/:groupId/messages  – visos grupės žinutės
router.get('/api/groups/:groupId/messages', async (req, res) => {
  const { groupId } = req.params;

  try {
    const [rows] = await db.query(
      `
      SELECT 
        gz.id_grupes_zinute         AS id,
        gz.fk_id_grupe              AS groupId,
        gz.fk_id_grupes_narys       AS groupMemberId,
        v.id_vartotojas             AS senderId,
        CONCAT(v.vardas, ' ', v.pavarde) AS senderName,
        v.avatar_url                AS senderAvatar,
        gz.turinys                  AS content,
        gz.siuntimo_data            AS sentAt,
        gz.redaguota                AS edited,
        gz.redagavimo_data          AS editedAt,
        gz.istrinta                 AS deleted
      FROM grupes_zinutes gz
      JOIN Grupes_nariai gn ON gn.id_grupes_narys = gz.fk_id_grupes_narys
      JOIN Vartotojai v     ON v.id_vartotojas    = gn.fk_id_vartotojas
      WHERE gz.fk_id_grupe = ?
        AND gz.istrinta = 0
      ORDER BY gz.siuntimo_data ASC
      `,
      [groupId]
    );

    res.json(rows);
  } catch (err) {
    console.error('Get group messages error:', err);
    res.status(500).json({ message: 'Nepavyko nuskaityti žinučių' });
  }
});

// POST /api/groups/:groupId/messages – sukurti naują žinutę
router.post('/api/groups/:groupId/messages', async (req, res) => {
  const { groupId } = req.params;
  const { senderId, content } = req.body; 
  // vėliau senderId galėsi imti iš JWT / auth middleware

  if (!content || !content.trim()) {
    return res.status(400).json({ message: 'Tuščia žinutė' });
  }
  if (!senderId) {
    return res.status(400).json({ message: 'Trūksta siuntėjo (senderId)' });
  }

  try {
    // 1) Surandam, ar šis vartotojas yra grupės narys
    const [memberRows] = await db.query(
      `
      SELECT id_grupes_narys
      FROM Grupes_nariai
      WHERE fk_id_grupe = ?
        AND fk_id_vartotojas = ?
      LIMIT 1
      `,
      [groupId, senderId]
    );

    if (memberRows.length === 0) {
      return res
        .status(403)
        .json({ message: 'Vartotojas nėra šios grupės narys' });
    }

    const groupMemberId = memberRows[0].id_grupes_narys;

    // 2) Įrašom žinutę į grupes_zinutes
    const [insertResult] = await db.query(
      `
      INSERT INTO grupes_zinutes
        (fk_id_grupes_narys, fk_id_grupe, turinys, siuntimo_data, redaguota, redagavimo_data, istrinta)
      VALUES (?, ?, ?, NOW(), 0, NOW(), 0)
      `,
      [groupMemberId, groupId, content.trim()]
    );

    const insertId = insertResult.insertId;

    // 3) Parsiunčiam pilną įrašą su vardu/pavarde ir avataru
    const [rows] = await db.query(
      `
      SELECT 
        gz.id_grupes_zinute         AS id,
        gz.fk_id_grupe              AS groupId,
        gz.fk_id_grupes_narys       AS groupMemberId,
        v.id_vartotojas             AS senderId,
        CONCAT(v.vardas, ' ', v.pavarde) AS senderName,
        v.avatar_url                AS senderAvatar,
        gz.turinys                  AS content,
        gz.siuntimo_data            AS sentAt,
        gz.redaguota                AS edited,
        gz.redagavimo_data          AS editedAt,
        gz.istrinta                 AS deleted
      FROM grupes_zinutes gz
      JOIN Grupes_nariai gn ON gn.id_grupes_narys = gz.fk_id_grupes_narys
      JOIN Vartotojai v     ON v.id_vartotojas    = gn.fk_id_vartotojas
      WHERE gz.id_grupes_zinute = ?
      LIMIT 1
      `,
      [insertId]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Create group message error:', err);
    const message =
      err.sqlMessage || err.message || 'Nepavyko išsaugoti žinutės';
    res.status(500).json({ message });
  }
});

/**
 * GET /api/grupes/:groupId/nariai/:userId/role
 * Grąžina vartotojo rolę konkrečioje grupėje
 */
router.get("/api/grupes/:groupId/nariai/:userId/role", async (req, res) => {
  try {
    const { groupId, userId } = req.params

    const [rows] = await db.query(
      `SELECT role, nario_busena
       FROM grupes_nariai
       WHERE fk_id_grupe = ? AND fk_id_vartotojas = ?`,
      [groupId, userId]
    )

    if (rows.length === 0) {
      return res.status(404).json({ message: "Narys grupėje nerastas" })
    }

    const member = rows[0]
    
    // Mapuojame role į tekstinį formatą
    let roleText = "guest"
    if (member.role === 1) roleText = "guest"
    else if (member.role === 2) roleText = "member"
    else if (member.role === 3) roleText = "admin"

    return res.json({
      role: member.role,
      roleText: roleText,
      nario_busena: member.nario_busena
    })
  } catch (err) {
    console.error("Rolės gavimo klaida:", err)
    return res.status(500).json({ message: "Serverio klaida gaunant rolę" })
  }
});


module.exports = router;