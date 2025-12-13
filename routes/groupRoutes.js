// routes/groupRoutes.js
const express = require('express');
const db = require('../db');
const crypto = require("crypto")
const { addGroupHistoryEntry } = require('../lib/groupHistory');
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
        (fk_id_grupe, fk_id_vartotojas, role, nario_busena)
    VALUES (?, ?, ?, ?)`,
    [groupId, ownerId, 3, 1]
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

    // 4) Istorija: grupė sukurta
    await addGroupHistoryEntry(
      groupId,
      ownerId,
      "group_created",
      `Grupė "${title}" sukurta.`,
      { ownerId }
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
  
  // Galima pridėti papildomą "public" parametrą URL
  const isPublicView = req.query.public === 'true'

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
       WHERE gn.fk_id_grupe = ? AND gn.nario_busena = 1`,
      [id]
    )

    const mapRole = (roleInt) => {
      switch (roleInt) {
        case 3: return "admin"
        case 2: return "member"
        case 1:
        default: return "guest"
      }
    }

    const members = memberRows.map(m => {
      const email = m.email || `${m.name.toLowerCase().replace(/\s+/g, '.')}@example.com`
      return {
        id: m.id,
        name: m.name,
        email,
        role: mapRole(m.role),
      }
    })

    // 3. NAUJAS: Gauti visas skolos (išlaidas) šiai grupei
    const [debtRows] = await db.query(
      `SELECT 
         s.id_skola AS id,
         s.pavadinimas AS title,
         s.aprasymas AS description,
         s.suma AS amount,
         s.sukurimo_data AS date,
         s.valiutos_kodas,
         s.kategorija AS categoryId,
         k.name AS categoryName,
         CONCAT(v.vardas, ' ', v.pavarde) AS paidByName
       FROM Skolos s
       JOIN Vartotojai v ON s.fk_id_vartotojas = v.id_vartotojas
       LEFT JOIN kategorijos k ON s.kategorija = k.id_kategorija
       WHERE s.fk_id_grupe = ?
       ORDER BY s.sukurimo_data DESC`,
      [id]
    )

    // Konvertuojame į frontend formatą
    const transactions = await Promise.all(
      debtRows.map(async (debt) => {
        // Gauname split type
        const [parts] = await db.query(
          `SELECT procentas, suma, vaidmuo FROM Skolos_dalys WHERE fk_id_skola = ?`,
          [debt.id]
        )

        let splitType = "Lygiai"
        if (parts.length > 0) {
          const hasPercent = parts.some(p => p.procentas > 0)
          const hasCustomAmount = parts.some(p => p.suma > 0 && p.vaidmuo === 1)

          if (hasPercent) splitType = "Procentais"
          else if (hasCustomAmount) splitType = "Pagal sumas"
        }

        return {
          id: debt.id,
          title: debt.title,
          description: debt.description || "",
          amount: Number(debt.amount),
          currency: debt.valiutos_kodas === 1 ? "EUR" : 
                   debt.valiutos_kodas === 2 ? "USD" : 
                   debt.valiutos_kodas === 3 ? "PLN" : 
                   debt.valiutos_kodas === 4 ? "GBP" : "JPY",
          date: debt.date,
          paidBy: debt.paidByName,
          categoryId: debt.categoryId ? String(debt.categoryId) : null,
          categoryName: debt.categoryName || "Be kategorijos",
          splitType
        }
      })
    )

    res.json({
      ...groupRows[0],
      members,
      transactions
    })
  } catch (err) {
    console.error('Klaida gaunant grupę:', err)
    res.status(500).json({ message: 'Serverio klaida' })
  }
});

// POST /api/groups/:groupId/members – pridėti narį į grupę
router.post("/api/groups/:groupId/members", async (req, res) => {
  const { groupId } = req.params
  const { email, name } = req.body
  const actorId = Number(req.header("x-user-id")) || null

  if (!email && !name) {
    return res.status(400).json({ message: "Nurodykite vardą arba el. paštą" })
  }

  try {
    let userRows = []

    // Jei email yra — ieškome pagal email
    if (email) {
      const [rows] = await db.query(
        "SELECT id_vartotojas, vardas, pavarde, el_pastas FROM Vartotojai WHERE el_pastas = ?",
        [email]
      )
      userRows = rows
    }

    // Jei vardas yra — ieškome pagal vardą
    if (!email && name) {
      const [rows] = await db.query(
        "SELECT id_vartotojas, vardas, pavarde, el_pastas FROM Vartotojai WHERE LOWER(vardas) = LOWER(?)",
        [name]
      )
      userRows = rows
    }

    if (userRows.length === 0) {
      return res.status(404).json({ message: "Vartotojas nerastas" })
    }

    const user = userRows[0]
    const userId = user.id_vartotojas

    // Tikrinam ar jau grupės narys
    const [existing] = await db.query(
      "SELECT id_grupes_narys FROM Grupes_nariai WHERE fk_id_grupe = ? AND fk_id_vartotojas = ? AND nario_busena = 1",
      [groupId, userId]
    )

    if (existing.length > 0) {
      return res.status(400).json({ message: "Vartotojas jau yra grupėje" })
    }

    // Įdedam į grupes_nariai kaip narį (role = 2)
    await db.query(
      `INSERT INTO Grupes_nariai
         (fk_id_grupe, fk_id_vartotojas, prisijungimo_data, role, nario_busena)
       VALUES (?, ?, CURDATE(), 2, 1)`,
      [groupId, userId]
    )

    // === ČIA PRIDEDAM ISTORIJOS ĮRAŠĄ ===
    const memberFullName = `${user.vardas} ${user.pavarde || ""}`.trim()

    await addGroupHistoryEntry(
      Number(groupId),
      actorId,
      "member_added",
      `Pridėtas narys "${memberFullName}".`,
      {
        memberId: userId,
        memberName: memberFullName,
        memberEmail: user.el_pastas,
      }
    )

    // Grąžinam atnaujintą grupę
    const [groupRows] = await db.query(
      `SELECT 
         g.*, 
         v.vardas AS owner_vardas,
         v.pavarde AS owner_pavarde
       FROM Grupes g
       JOIN Vartotojai v ON g.fk_id_vartotojas = v.id_vartotojas
       WHERE g.id_grupe = ?`,
      [groupId]
    )

    const [memberRows] = await db.query(
      `SELECT 
         v.id_vartotojas AS id,
         v.vardas AS name,
         v.el_pastas AS email,
         gn.role
       FROM Grupes_nariai gn
       JOIN Vartotojai v ON gn.fk_id_vartotojas = v.id_vartotojas
       WHERE gn.fk_id_grupe = ? AND gn.nario_busena = 1`,
      [groupId]
    )

    const mapRole = (roleInt) => {
      switch (roleInt) {
        case 3: return "admin"
        case 2: return "member"
        default: return "guest"
      }
    }

    const members = memberRows.map(m => ({
      id: m.id,
      name: m.name,
      email: m.email,
      role: mapRole(m.role)
    }))

    res.status(201).json({ ...groupRows[0], members })

  } catch (err) {
    console.error("Add member error:", err)
    res.status(500).json({ message: err.message || "Serverio klaida" })
  }
});

// ------------------------------
// INVITES
// ------------------------------

function generateToken10() {
  // 10 chars base62-ish (0-9a-zA-Z)
  const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
  const bytes = crypto.randomBytes(10)
  let out = ""
  for (let i = 0; i < 10; i++) out += chars[bytes[i] % chars.length]
  return out
}

// POST /api/groups/:groupId/invites – sukurti kvietimą (sugeneruoja tokeną serveryje)
router.post("/api/groups/:groupId/invites", async (req, res) => {
  const { groupId } = req.params
  const actorId = Number(req.header("x-user-id")) || null
  
  try {

    // 1) ar kviečiantis vartotojas yra grupėje (reikia id_grupes_narys)
// Jei nėra - bet jis yra grupės savininkas (grupes.fk_id_vartotojas) - sukurti jam įrašą grupes_nariai.
let creatorGroupMemberId = null

const [memberRows] = await db.query(
  `SELECT id_grupes_narys, role, nario_busena
   FROM grupes_nariai
   WHERE fk_id_grupe = ? AND fk_id_vartotojas = ? AND nario_busena = 1
   LIMIT 1`,
  [groupId, actorId]
)

if (memberRows.length > 0) {
  creatorGroupMemberId = memberRows[0].id_grupes_narys
} else {
  // nėra nario įrašo - tikrinam ar jis grupės savininkas
  const [ownerRows] = await db.query(
    `SELECT fk_id_vartotojas
     FROM grupes
     WHERE id_grupe = ?
     LIMIT 1`,
    [groupId]
  )

  if (ownerRows.length === 0) {
    return res.status(404).json({ message: "Grupė nerasta" })
  }

  const ownerId = Number(ownerRows[0].fk_id_vartotojas)
  if (ownerId !== actorId) {
    return res.status(403).json({ message: "Neturite teisės kurti kvietimo šiai grupei" })
  }

  // savininkas, bet nėra grupes_nariai įrašo – sukuriam
  // role: 3 = 'grupes sukurejas', nario_busena: 1 = 'aktyvus'
  const [ins] = await db.query(
    `INSERT INTO grupes_nariai
       (fk_id_grupe, fk_id_vartotojas, prisijungimo_data, role, nario_busena)
     VALUES (?, ?, CURDATE(), 3, 1)`,
    [groupId, actorId]
  )

  creatorGroupMemberId = ins.insertId
}

if (!creatorGroupMemberId) {
  return res.status(403).json({ message: "Neturite teisės kurti kvietimo šiai grupei" })
}

    // 2) kuriam tokeną ir įrašom į kvietimai
    // galiojimas: 7 dienos
    const token = generateToken10()

    // statusai iš kvietimo_busenos: 1 aktyvus, 2 pasibaiges, 3 panaudotas
    const ACTIVE = 1

    const [insertInvite] = await db.query(
      `INSERT INTO Kvietimai (tokenas, sukurimo_data, galiojimo_trukme, kvietimo_busena)
       VALUES (?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 7 DAY), ?)`,
      [token, ACTIVE]
    )

    const inviteId = insertInvite.insertId

    // 3) sujungiam per sukuria (kvietimas -> grupes_narys, iš jo gaunasi grupė)
    await db.query(
      `INSERT INTO Sukuria (fk_id_kvietimas, fk_id_grupes_narys)
       VALUES (?, ?)`,
      [inviteId, creatorGroupMemberId]
    )

    // (optional) istorija
    await addGroupHistoryEntry(
      Number(groupId),
      actorId,
      "invite_created",
      `Sugeneruota kvietimo nuoroda.`,
      { inviteId }
    )

    return res.json({
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    })
  } catch (err) {
    console.error("Create invite error:", err)
    return res.status(500).json({ message: "Nepavyko sukurti kvietimo" })
  }
})

// POST /api/groups/:groupId/join – prisijungti į grupę su tokenu
router.post("/api/groups/:groupId/join", async (req, res) => {
  const { groupId } = req.params
  const { token } = req.body || {}
  const actorId = Number(req.header("x-user-id")) || null

  if (!actorId) return res.status(401).json({ message: "Trūksta x-user-id" })
  if (!token) return res.status(400).json({ message: "Trūksta token" })

  try {
    // 1) randam kvietimą ir jo grupę per sukuria -> grupes_nariai
    const [rows] = await db.query(
      `SELECT 
         k.id_kvietimas,
         k.tokenas,
         k.galiojimo_trukme,
         k.kvietimo_busena,
         gn.fk_id_grupe AS invite_group_id
       FROM Kvietimai k
       JOIN Sukuria s ON s.fk_id_kvietimas = k.id_kvietimas
       JOIN Grupes_nariai gn ON gn.id_grupes_narys = s.fk_id_grupes_narys
       WHERE k.tokenas = ?
       LIMIT 1`,
      [token]
    )

    if (rows.length === 0) {
      return res.status(400).json({ message: "Neteisingas kvietimo tokenas" })
    }

    const invite = rows[0]

    if (Number(invite.invite_group_id) !== Number(groupId)) {
      return res.status(400).json({ message: "Šis kvietimas nepriklauso šiai grupei" })
    }

    const ACTIVE = 1
    const EXPIRED = 2
    const USED = 3

    // 2) patikrinam statusą
    if (invite.kvietimo_busena !== ACTIVE) {
      return res.status(400).json({ message: "Kvietimas nebegalioja" })
    }

    // 3) patikrinam galiojimą
    const [expCheck] = await db.query(
      `SELECT (galiojimo_trukme < CURDATE()) AS is_expired
       FROM Kvietimai
       WHERE id_kvietimas = ?
       LIMIT 1`,
      [invite.id_kvietimas]
    )

    if (expCheck[0]?.is_expired) {
      // pažymim kaip pasibaigęs
      await db.query(
        `UPDATE Kvietimai SET kvietimo_busena = ? WHERE id_kvietimas = ?`,
        [EXPIRED, invite.id_kvietimas]
      )
      return res.status(400).json({ message: "Kvietimo galiojimas pasibaigęs" })
    }

    // 4) jei jau yra grupėje – grąžinam ok (idempotentiška)
    const [existing] = await db.query(
      `SELECT id_grupes_narys
       FROM Grupes_nariai
       WHERE fk_id_grupe = ? AND fk_id_vartotojas = ? AND nario_busena = 1
       LIMIT 1`,
      [groupId, actorId]
    )

    if (existing.length > 0) {
      return res.json({ ok: true, alreadyMember: true })
    }

    // 5) įdedam narį
    await db.query(
      `INSERT INTO Grupes_nariai
         (fk_id_grupe, fk_id_vartotojas, prisijungimo_data, role, nario_busena)
       VALUES (?, ?, CURDATE(), 2, 1)`,
      [groupId, actorId]
    )

    // 6) pažymim kvietimą panaudotu
    await db.query(
      `UPDATE Kvietimai SET kvietimo_busena = ? WHERE id_kvietimas = ?`,
      [USED, invite.id_kvietimas]
    )

    // (optional) istorija
    await addGroupHistoryEntry(
      Number(groupId),
      actorId,
      "invite_accepted",
      `Prisijungta prie grupės per kvietimą.`,
      { inviteId: invite.id_kvietimas }
    )

    return res.json({ ok: true })
  } catch (err) {
    console.error("Join by invite error:", err)
    return res.status(500).json({ message: "Nepavyko prisijungti prie grupės" })
  }
})



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

// DELETE /api/groups/:groupId/members/:memberId – pašalinti narį
router.delete("/api/groups/:groupId/members/:memberId", async (req, res) => {
  const { groupId, memberId } = req.params
  const actorId = Number(req.header("x-user-id")) || null

  try {
    // Pasiimam info apie pašalinamą narį
    const [userRows] = await db.query(
      `SELECT vardas, pavarde, el_pastas 
       FROM Vartotojai 
       WHERE id_vartotojas = ?`,
      [memberId]
    )

    const member = userRows[0] || null
    const memberName = member
      ? `${member.vardas} ${member.pavarde || ""}`.trim()
      : `ID ${memberId}`
    const memberEmail = member ? member.el_pastas : null

    // Pažymim kaip neaktyvų
    const [result] = await db.query(
      "UPDATE Grupes_nariai SET nario_busena = 3 WHERE fk_id_grupe = ? AND fk_id_vartotojas = ?",
      [groupId, memberId]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Narys nerastas" })
    }

    // Istorija – kas ką pašalino
    await addGroupHistoryEntry(
      Number(groupId),
      actorId, // tas, kas daro veiksmą
      "member_removed",
      `Pašalintas narys "${memberName}".`,
      {
        memberId: Number(memberId),
        memberName,
        memberEmail,
      }
    )

    res.json({ success: true })
  } catch (err) {
    console.error("Remove member error:", err)
    const message = err.sqlMessage || err.message || "Serverio klaida"
    res.status(500).json({ message })
  }
})

// DELETE /api/groups/:groupId – ištrinti grupę ir susijusius duomenis
router.delete("/api/groups/:groupId", async (req, res) => {
  const groupId = Number(req.params.groupId)
  if (!Number.isInteger(groupId) || groupId <= 0) {
    return res.status(400).json({ message: "Blogas groupId" })
  }

  const conn = await db.getConnection()
  try {
    await conn.beginTransaction()

    const [memberRows] = await conn.query(
      `SELECT id_grupes_narys FROM grupes_nariai WHERE fk_id_grupe = ?`,
      [groupId]
    )
    const memberIds = memberRows.map(r => r.id_grupes_narys)

    let inviteIds = []
    if (memberIds.length > 0) {
      const [inviteRows] = await conn.query(
        `SELECT DISTINCT fk_id_kvietimas AS id
         FROM sukuria
         WHERE fk_id_grupes_narys IN (?)`,
        [memberIds]
      )
      inviteIds = inviteRows.map(r => r.id)

      await conn.query(
        `DELETE FROM sukuria WHERE fk_id_grupes_narys IN (?)`,
        [memberIds]
      )
    }

    if (inviteIds.length > 0) {
      await conn.query(
        `DELETE FROM kvietimai WHERE id_kvietimas IN (?)`,
        [inviteIds]
      )
    }

    await conn.query(`DELETE FROM grupes_zinutes WHERE fk_id_grupe = ?`, [groupId])
    await conn.query(`DELETE FROM skolos WHERE fk_id_grupe = ?`, [groupId])
    await conn.query(`DELETE FROM grupes_nariai WHERE fk_id_grupe = ?`, [groupId])

    const [del] = await conn.query(`DELETE FROM grupes WHERE id_grupe = ?`, [groupId])
    if (del.affectedRows === 0) {
      await conn.rollback()
      return res.status(404).json({ message: "Grupė nerasta" })
    }

    await conn.commit()
    return res.json({ ok: true })
  } catch (err) {
    await conn.rollback()
    console.error("Delete group error:", err)
    return res.status(500).json({ message: "Nepavyko ištrinti grupės" })
  } finally {
    conn.release()
  }
})


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

  if (!content || !content.trim()) {
    return res.status(400).json({ message: 'Tuščia žinutė' });
  }
  if (!senderId) {
    return res.status(400).json({ message: 'Trūksta siuntėjo (senderId)' });
  }

  try {
    // 1) patikrinam, ar useris yra grupės narys
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

    // 2) įrašom žinutę
    const [insertResult] = await db.query(
      `
      INSERT INTO grupes_zinutes
        (fk_id_grupes_narys, fk_id_grupe, turinys, siuntimo_data, redaguota, redagavimo_data, istrinta)
      VALUES (?, ?, ?, NOW(), 0, NOW(), 0)
      `,
      [groupMemberId, groupId, content.trim()]
    );

    const insertId = insertResult.insertId;

    // 3) pasiimam pilną eilutę (su senderName ir avataru)
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

    const msgRow = rows[0];

    // 4) sukurti pranešimus kitiems grupės nariams (varpelis)
    await createGroupMessageNotifications(groupId, senderId, msgRow);

    // 5) grąžinam žinutę frontendui
    res.status(201).json({
      id: msgRow.id,
      groupId: msgRow.groupId,
      groupMemberId: msgRow.groupMemberId,
      senderId: msgRow.senderId,
      senderName: msgRow.senderName,
      senderAvatar: msgRow.senderAvatar || null,
      content: msgRow.content,
      sentAt: msgRow.sentAt,
      edited: msgRow.edited,
      editedAt: msgRow.editedAt,
      deleted: msgRow.deleted,
    });
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

// === Helperis: kurti pranešimus, kai atsiranda nauja žinutė grupėje ===
async function createGroupMessageNotifications(groupId, senderId, messageRow) {
  try {
    // 1) grupės pavadinimas
    const [groupRows] = await db.query(
      `SELECT pavadinimas 
       FROM Grupes 
       WHERE id_grupe = ?`,
      [groupId]
    );
    const groupName = groupRows[0]?.pavadinimas || "Grupė";

    // 2) visi KITI nariai, aktyvūs ir su įjungtais "žinutės" notifais
    const [userRows] = await db.query(
      `
      SELECT 
        v.id_vartotojas AS userId
      FROM Grupes_nariai gn
      JOIN Vartotojai v ON v.id_vartotojas = gn.fk_id_vartotojas
      LEFT JOIN pranesimu_nustatymai pn 
        ON pn.fk_id_vartotojas = v.id_vartotojas
      WHERE gn.fk_id_grupe = ?
        AND v.id_vartotojas <> ?
        AND gn.nario_busena = 1
        AND (pn.zinutes = 1 OR pn.zinutes IS NULL)
      `,
      [groupId, senderId]
    );

    if (userRows.length === 0) {
      // nėra kam siųsti – ok
      return;
    }

    const preview =
      (messageRow.content || "").length > 80
        ? messageRow.content.slice(0, 77) + "..."
        : (messageRow.content || "");

    const metadata = JSON.stringify({
      type: "group_message",
      groupId: Number(groupId),
      messageId: messageRow.id,
      senderId: messageRow.senderId,
    });

    // 3) įrašom po vieną notifą kiekvienam vartotojui (stabilesnis variantas)
    for (const u of userRows) {
      await db.query(
        `
        INSERT INTO Pranesimai
          (fk_id_vartotojas, tipas, pavadinimas, tekstas, nuskaityta, sukurta, action_url, metadata)
        VALUES
          (?, 'group_message', ?, ?, 0, NOW(), ?, ?)
        `,
        [
          u.userId,
          `Nauja žinutė grupėje "${groupName}"`,
          `${messageRow.senderName}: ${preview}`,
          `/groups/${groupId}?tab=chat`,
          metadata,
        ]
      );
    }
  } catch (err) {
    console.error("Klaida kuriant grupės žinučių pranešimus:", err);
    // notifai – ne kritiniai, request'o nenukertam
  }
}

// =====================================================
// GRUPĖS ISTORIJA
// GET /api/groups/:groupId/history
// =====================================================

// GET /api/groups/:groupId/history – konkrečios grupės istorija
router.get("/api/groups/:groupId/history", async (req, res) => {
  const { groupId } = req.params

  try {
    const [rows] = await db.query(
      `
      SELECT
        gi.id_istorija              AS id,
        gi.fk_id_grupe              AS groupId,
        gi.fk_id_vartotojas         AS userId,
        CONCAT(v.vardas, ' ', v.pavarde) AS userName,
        v.avatar_url                AS userAvatar,
        gi.tipas                    AS type,
        gi.aprasymas                AS description,
        gi.sukurta                  AS timestamp,
        gi.metadata                 AS metadata
      FROM Grupes_istorija gi
      LEFT JOIN Vartotojai v 
        ON v.id_vartotojas = gi.fk_id_vartotojas
      WHERE gi.fk_id_grupe = ?
      ORDER BY gi.sukurta DESC
      `,
      [groupId]
    )

    res.json({ activities: rows })
  } catch (err) {
    console.error("Get group history error:", err)
    res.status(500).json({ message: "Nepavyko gauti grupės istorijos" })
  }
})

module.exports = router;