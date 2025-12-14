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
       WHERE gn.fk_id_vartotojas = ? 
       AND gn.nario_busena = 1`,
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



// PUT /api/groups/:groupId/members/:userId/role
router.put("/api/groups/:groupId/members/:userId/role", async (req, res) => {
  const groupId = Number(req.params.groupId)
  const targetUserId = Number(req.params.userId)
  const actorId = Number(req.header("x-user-id")) || null
  const { role } = req.body || {} // expects 1|2|3
  const roleText = (r) => {
    const n = Number(r)
    if (n === 3) return "Administratorius"
    if (n === 2) return "Narys"
    return "Svečias"
  }

  if (!actorId) return res.status(401).json({ message: "Trūksta x-user-id" })
  if (!groupId || !targetUserId) return res.status(400).json({ message: "Blogi parametrai" })
  if (![1, 2, 3].includes(Number(role))) return res.status(400).json({ message: "Neteisinga rolė" })

  const ROLE_GUEST = 1
  const ROLE_MEMBER = 2
  const ROLE_ADMIN = 3
  const ACTIVE = 1

  const [targetUserRows] = await db.query(
      `SELECT vardas, pavarde, el_pastas 
       FROM Vartotojai 
       WHERE id_vartotojas = ?
       LIMIT 1`,
      [targetUserId]
    )

  const targetUser = targetUserRows[0] || null
  const targetName = targetUser
    ? `${targetUser.vardas} ${targetUser.pavarde || ""}`.trim()
    : `ID ${targetUserId}`
  const targetEmail = targetUser?.el_pastas || null

  try {
    // 1) actor must be admin in this group
    const [actorRows] = await db.query(
      `SELECT role
       FROM Grupes_nariai
       WHERE fk_id_grupe = ? AND fk_id_vartotojas = ? AND nario_busena = ?
       LIMIT 1`,
      [groupId, actorId, ACTIVE]
    )
    if (actorRows.length === 0) return res.status(403).json({ message: "Nesate grupės narys" })
    if (Number(actorRows[0].role) !== ROLE_ADMIN) {
      return res.status(403).json({ message: "Tik administratorius gali keisti roles" })
    }

    // 2) target must be active member
    const [targetRows] = await db.query(
      `SELECT role
       FROM Grupes_nariai
       WHERE fk_id_grupe = ? AND fk_id_vartotojas = ? AND nario_busena = ?
       LIMIT 1`,
      [groupId, targetUserId, ACTIVE]
    )
    if (targetRows.length === 0) return res.status(404).json({ message: "Narys nerastas" })

    // 3) safety: prevent removing the last admin (unless we're transferring admin)
    const [adminCountRows] = await db.query(
      `SELECT COUNT(*) AS cnt
       FROM Grupes_nariai
       WHERE fk_id_grupe = ? AND role = ? AND nario_busena = ?`,
      [groupId, ROLE_ADMIN, ACTIVE]
    )
    const adminCount = Number(adminCountRows[0]?.cnt || 0)

    const targetCurrentRole = Number(targetRows[0].role)
    const newRole = Number(role)

    // If demoting an admin and NOT transferring admin to someone else -> block last admin demotion
    if (targetCurrentRole === ROLE_ADMIN && newRole !== ROLE_ADMIN && adminCount <= 1) {
      return res.status(400).json({ message: "Grupėje privalo likti bent vienas administratorius" })
    }

    // 4) If assigning admin to someone else => treat as "transfer":
    //    target becomes admin, actor becomes member.
    if (newRole === ROLE_ADMIN && targetUserId !== actorId) {
      await db.query("START TRANSACTION")

      await db.query(
        `UPDATE grupes_nariai
         SET role = ?
         WHERE fk_id_grupe = ? AND fk_id_vartotojas = ? AND nario_busena = ?`,
        [ROLE_ADMIN, groupId, targetUserId, ACTIVE]
      )

      await db.query(
        `UPDATE grupes
        SET fk_id_vartotojas = ?
        WHERE id_grupe = ?`,
        [targetUserId, groupId]
      )

      await db.query(
        `UPDATE grupes_nariai
         SET role = ?
         WHERE fk_id_grupe = ? AND fk_id_vartotojas = ? AND nario_busena = ?`,
        [ROLE_MEMBER, groupId, actorId, ACTIVE]
      )

      await db.query("COMMIT")

      await addGroupHistoryEntry(
        groupId,
        actorId,
        "role_changed",
        `Perduotos administratoriaus teisės nariui "${targetName}" (owner perkeltas).`,
        {
          memberId: targetUserId,
          memberName: targetName,
          memberEmail: targetEmail,
          oldRole: targetCurrentRole,
          newRole: ROLE_ADMIN,
          oldRoleText: roleText(targetCurrentRole),
          newRoleText: roleText(ROLE_ADMIN),
          transferred: true,
          previousAdminId: actorId,
        }
      )

      return res.json({ ok: true, transferred: true })
    }

    // 5) Normal role change (including changing someone to guest/member, or admin changing self role if you allow it)
    await db.query(
      `UPDATE Grupes_nariai
       SET role = ?
       WHERE fk_id_grupe = ? AND fk_id_vartotojas = ? AND nario_busena = ?`,
      [newRole, groupId, targetUserId, ACTIVE]
    )

    await addGroupHistoryEntry(
    groupId,
    actorId,
    "role_changed",
    `Pakeista nario "${targetName}" rolė: ${roleText(targetCurrentRole)} → ${roleText(newRole)}.`,
    {
      memberId: targetUserId,
      memberName: targetName,
      memberEmail: targetEmail,
      oldRole: targetCurrentRole,
      newRole,
      oldRoleText: roleText(targetCurrentRole),
      newRoleText: roleText(newRole),
    }
  )

    return res.json({ ok: true })
  } catch (err) {
    try { await db.query("ROLLBACK") } catch {}
    console.error("Change role error:", err)
    return res.status(500).json({ message: "Nepavyko pakeisti rolės" })
  }
})


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

    const [upd] = await db.query(
  `UPDATE Kvietimai
   SET kvietimo_busena = ?
   WHERE id_kvietimas = ? AND kvietimo_busena = ?`,
  [USED, invite.id_kvietimas, ACTIVE]
)

if (upd.affectedRows === 0) {
  return res.status(400).json({ message: "Kvietimas nebegalioja" })
}


    // 5) įdedam narį
const [ins] = await db.query(
  `INSERT IGNORE INTO Grupes_nariai
     (fk_id_grupe, fk_id_vartotojas, prisijungimo_data, role, nario_busena)
   VALUES (?, ?, CURDATE(), 2, 1)`,
  [groupId, actorId]
)

if (ins.affectedRows === 0) {
      // 6) pažymim kvietimą panaudotu
  await db.query(
    `UPDATE Kvietimai SET kvietimo_busena = ? WHERE id_kvietimas = ?`,
    [USED, invite.id_kvietimas]
  )
  return res.json({ ok: true, alreadyMember: true })
}

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

async function computeUserNetBalanceEUR(groupId, userId) {
  const [rows] = await db.query(
    `
    SELECT 
      COALESCE(SUM(
        CASE
          -- kiti skolingi man (aš mokėtojas)
          WHEN s.fk_id_vartotojas = ? 
            AND sd.vaidmuo = 1
            AND sd.fk_id_vartotojas <> ?
            AND (sd.suma - sd.sumoketa) > 0
          THEN (sd.suma - sd.sumoketa)

          -- aš skolingas kitiems (aš skolininkas)
          WHEN sd.fk_id_vartotojas = ?
            AND sd.vaidmuo = 1
            AND s.fk_id_vartotojas <> ?
            AND (sd.suma - sd.sumoketa) > 0
          THEN -(sd.suma - sd.sumoketa)

          ELSE 0
        END
      ), 0) AS netEUR
    FROM Skolos s
    JOIN Skolos_dalys sd ON sd.fk_id_skola = s.id_skola
    WHERE s.fk_id_grupe = ?
      AND s.skolos_statusas = 1
    `,
    [userId, userId, userId, userId, groupId]
  )

  // DEBUG
  console.log("[LEAVE][BALANCE] raw rows:", rows)

  const netEUR = Number(rows?.[0]?.netEUR ?? 0)

  // DEBUG
  console.log(`[LEAVE][BALANCE] groupId=${groupId} userId=${userId} netEUR=${netEUR}`)

  return netEUR
}

router.post("/api/groups/:groupId/leave", async (req, res) => {
  const groupId = Number(req.params.groupId)
  const actorId = Number(req.header("x-user-id"))

  if (!actorId) return res.status(401).json({ message: "Trūksta x-user-id" })
  if (!groupId) return res.status(400).json({ message: "Blogas groupId" })

  try {
    // 1) turi būti grupės narys
    const [meRows] = await db.query(
      `SELECT role 
       FROM grupes_nariai
       WHERE fk_id_grupe = ? AND fk_id_vartotojas = ? AND nario_busena = 1
       LIMIT 1`,
      [groupId, actorId]
    )
    if (!meRows.length) return res.status(403).json({ message: "Nesate grupės narys" })

    // 2) NEGALIMA išeiti, jei balansas ne 0
    const netEUR = await computeUserNetBalanceEUR(groupId, actorId)
    if (Math.abs(netEUR) > 0.01) {
      return res.status(400).json({
        message: "Negalite palikti grupės, kol neatsiskaitėte (balansas turi būti 0).",
        netBalanceEUR: Number(netEUR.toFixed(2)),
      })
    }

    // 3) papildoma taisyklė: jei esi vienintelis adminas – neleisti išeiti
    const ROLE_ADMIN = 3
    if (Number(meRows[0].role) === ROLE_ADMIN) {
      const [adminCntRows] = await db.query(
        `SELECT COUNT(*) AS cnt
         FROM grupes_nariai
         WHERE fk_id_grupe = ? AND role = ? AND nario_busena = 1`,
        [groupId, ROLE_ADMIN]
      )
      const adminCount = Number(adminCntRows?.[0]?.cnt || 0)
      if (adminCount <= 1) {
        return res.status(400).json({
          message: "Negalite palikti grupės, nes esate vienintelis administratorius. Pirma perduokite admin teises kitam nariui."
        })
      }
    }

    // 4) pažymim kaip išėjęs
    await db.query(
      `UPDATE grupes_nariai
       SET nario_busena = 3
       WHERE fk_id_grupe = ? AND fk_id_vartotojas = ? AND nario_busena = 1`,
      [groupId, actorId]
    )

    // (optional) istorija
    await addGroupHistoryEntry(
      groupId,
      actorId,
      "member_left",
      `Narys paliko grupę.`,
      { userId: actorId }
    )

    return res.json({ ok: true })
  } catch (err) {
    console.error("Leave group error:", err)
    return res.status(500).json({ message: "Serverio klaida" })
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

// POST /api/groups/:groupId/invite-friend
router.post("/api/groups/:groupId/invite-friend", async (req, res) => {
  const { groupId } = req.params
  const actorId = Number(req.header("x-user-id"))
  const toUserId = Number(req.body?.toUserId)

  if (!actorId) return res.status(401).json({ message: "Trūksta x-user-id" })
  if (!toUserId) return res.status(400).json({ message: "Trūksta toUserId" })
  if (actorId === toUserId) return res.status(400).json({ message: "Negalite pakviesti savęs" })

  const conn = await db.getConnection()
  try {
    await conn.beginTransaction()

    // 1) actor must be admin in this group
    const [actorMemberRows] = await conn.query(
      `SELECT id_grupes_narys, role
       FROM grupes_nariai
       WHERE fk_id_grupe = ? AND fk_id_vartotojas = ? AND nario_busena = 1
       LIMIT 1`,
      [groupId, actorId],
    )

    if (actorMemberRows.length === 0 || Number(actorMemberRows[0].role) !== 3) {
      await conn.rollback()
      return res.status(403).json({ message: "Tik adminas gali kviesti į grupę" })
    }

    // 2) must be friends (accepted)
    const [friendRows] = await conn.query(
      `SELECT id_draugyste
       FROM Vartotoju_draugystes
       WHERE status = 'accepted'
         AND (
           (fk_requester_id = ? AND fk_addressee_id = ?)
           OR
           (fk_requester_id = ? AND fk_addressee_id = ?)
         )
       LIMIT 1`,
      [actorId, toUserId, toUserId, actorId],
    )

    if (friendRows.length === 0) {
      await conn.rollback()
      return res.status(403).json({ message: "Galite kviesti tik draugus" })
    }

    // 3) don't invite if already in group
    const [alreadyMember] = await conn.query(
      `SELECT id_grupes_narys
       FROM grupes_nariai
       WHERE fk_id_grupe = ? AND fk_id_vartotojas = ? AND nario_busena = 1
       LIMIT 1`,
      [groupId, toUserId],
    )

    // 3.5) don't send another invite if there's already a pending one for this user in this group
const [pendingInviteRows] = await conn.query(
  `SELECT 
     k.id_kvietimas AS inviteId,
     k.tokenas      AS token
   FROM Kvietimai k
   JOIN Sukuria s         ON s.fk_id_kvietimas = k.id_kvietimas
   JOIN grupes_nariai gn  ON gn.id_grupes_narys = s.fk_id_grupes_narys
   JOIN sisteminiai_pranesimai sp ON sp.fk_id_vartotojas = ?
   WHERE gn.fk_id_grupe = ?
     AND k.kvietimo_busena = 1
     AND sp.metadata IS NOT NULL
     AND JSON_UNQUOTE(JSON_EXTRACT(sp.metadata, '$.type')) = 'group_invite'
     AND JSON_UNQUOTE(JSON_EXTRACT(sp.metadata, '$.groupId')) = ?
     AND JSON_UNQUOTE(JSON_EXTRACT(sp.metadata, '$.inviteId')) = CAST(k.id_kvietimas AS CHAR)
   ORDER BY k.id_kvietimas DESC
   LIMIT 1`,
  [toUserId, groupId, String(groupId)]
)

if (pendingInviteRows.length > 0) {
  const existing = pendingInviteRows[0]
  const actionUrl = `/groups/${groupId}/join?token=${encodeURIComponent(existing.token)}`
  await conn.rollback()
  return res.status(200).json({
    ok: true,
    alreadyInvited: true,
    inviteId: existing.inviteId,
    token: existing.token,
    actionUrl,
  })
}

    if (alreadyMember.length > 0) {
      await conn.rollback()
      return res.status(409).json({ message: "Vartotojas jau yra grupėje" })
    }

    // 4) create invite token (same as your /invites route)
    const token = generateToken10()
    const ACTIVE = 1

    const [insertInvite] = await conn.query(
      `INSERT INTO Kvietimai (tokenas, sukurimo_data, galiojimo_trukme, kvietimo_busena)
       VALUES (?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 7 DAY), ?)`,
      [token, ACTIVE],
    )

    const inviteId = insertInvite.insertId
    const actorGroupMemberId = actorMemberRows[0].id_grupes_narys

    await conn.query(
      `INSERT INTO Sukuria (fk_id_kvietimas, fk_id_grupes_narys)
       VALUES (?, ?)`,
      [inviteId, actorGroupMemberId],
    )

    // 5) create notification for the invited user
    const [groupRows] = await conn.query(
      `SELECT pavadinimas FROM grupes WHERE id_grupe = ? LIMIT 1`,
      [groupId],
    )
    const groupName = groupRows.length ? groupRows[0].pavadinimas : "grupę"

    const [actorRows] = await conn.query(
      `SELECT vardas, pavarde FROM vartotojai WHERE id_vartotojas = ? LIMIT 1`,
      [actorId],
    )
    const actorName = actorRows.length
      ? `${actorRows[0].vardas} ${actorRows[0].pavarde || ""}`.trim()
      : "Vartotojas"

    const actionUrl = `/groups/${groupId}/join?token=${encodeURIComponent(token)}`
    const metadata = JSON.stringify({
      type: "group_invite",
      groupId: Number(groupId),
      inviteId,
      token,
      inviterId: actorId,
    })

    await conn.query(
      `INSERT INTO sisteminiai_pranesimai
        (fk_id_vartotojas, tipas, pavadinimas, tekstas, action_url, metadata)
       VALUES (?, 'group_invite', ?, ?, ?, ?)`,
      [
        toUserId,
        "Kvietimas į grupę",
        `${actorName} pakvietė jus prisijungti prie grupės „${groupName}“`,
        actionUrl,
        metadata,
      ],
    )

    await conn.commit()

    return res.status(201).json({
      ok: true,
      token,
      inviteId,
      actionUrl,
    })
  } catch (err) {
    await conn.rollback()
    console.error("Invite friend to group error:", err)
    return res.status(500).json({ message: "Serverio klaida kviečiant į grupę" })
  } finally {
    conn.release()
  }
})

// POST /api/groups/invites/:inviteId/accept
router.post("/api/groups/invites/:inviteId/accept", async (req, res) => {
  const inviteId = Number(req.params.inviteId)
  const userId = Number(req.header("x-user-id"))

  if (!userId) return res.status(401).json({ message: "Unauthorized" })

  const conn = await db.getConnection()
  try {
    await conn.beginTransaction()

    // 1) validate invite
    const [inviteRows] = await conn.query(
      `SELECT k.id_kvietimas, k.kvietimo_busena, s.fk_id_grupes_narys
       FROM Kvietimai k
       JOIN Sukuria s ON s.fk_id_kvietimas = k.id_kvietimas
       WHERE k.id_kvietimas = ?`,
      [inviteId]
    )

    if (!inviteRows.length || inviteRows[0].kvietimo_busena !== 1) {
      await conn.rollback()
      return res.status(400).json({ message: "Kvietimas negalioja" })
    }

    // 2) get group
    const [groupRows] = await conn.query(
      `SELECT fk_id_grupe
       FROM grupes_nariai
       WHERE id_grupes_narys = ?`,
      [inviteRows[0].fk_id_grupes_narys]
    )

    const groupId = groupRows[0].fk_id_grupe

    // 3) add user to group
    await conn.query(
      `INSERT INTO grupes_nariai (fk_id_grupe, fk_id_vartotojas, role, nario_busena)
       VALUES (?, ?, 2, 1)`,
      [groupId, userId]
    )

    // 4) mark invite accepted
    await conn.query(
      `UPDATE Kvietimai SET kvietimo_busena = 2 WHERE id_kvietimas = ?`,
      [inviteId]
    )

    await conn.commit()
    res.json({ ok: true })
  } catch (e) {
    await conn.rollback()
    res.status(500).json({ message: "Serverio klaida" })
  } finally {
    conn.release()
  }
})

// POST /api/groups/invites/:inviteId/decline
router.post("/api/groups/invites/:inviteId/decline", async (req, res) => {
  const inviteId = Number(req.params.inviteId)
  const userId = Number(req.header("x-user-id"))

  if (!userId) return res.status(401).json({ message: "Unauthorized" })

  await db.query(
    `UPDATE Kvietimai SET kvietimo_busena = 3 WHERE id_kvietimas = ?`,
    [inviteId]
  )

  res.json({ ok: true })
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
       WHERE fk_id_grupe = ?
         AND fk_id_vartotojas = ?
         AND nario_busena = 1
       ORDER BY id_grupes_narys DESC
       LIMIT 1`,
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
        INSERT INTO sisteminiai_pranesimai
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