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
        case 3:
          return "admin"   // grupės kūrėjas
        case 2:
          return "member"  // grupės narys
        case 1:
        default:
          return "guest"   // svečias
      }
    }

    const members = memberRows.map(m => {
      const email =
        m.email ||
        `${m.name.toLowerCase().replace(/\s+/g, '.')}@example.com`

      return {
        id: m.id,
        name: m.name,
        email,
        role: mapRole(m.role),
      }
    })

    res.json({
      ...groupRows[0],
      members,
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
         (fk_id_grupe, fk_id_vartotojas, prisijungimo_data, role, nario_busena, fk_id_sistemos_istorija)
       VALUES (?, ?, CURDATE(), 2, 1, NULL)`,
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
  const { groupId, memberId } = req.params;

  try {
    // Pasiimam info apie narį (gražesniam istorijos tekstui)
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

    // Pažymėti kaip neaktyvų
    const [result] = await db.query(
      "UPDATE Grupes_nariai SET nario_busena = 3 WHERE fk_id_grupe = ? AND fk_id_vartotojas = ?",
      [groupId, memberId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Narys nerastas" });
    }

    // === ČIA – ISTORIJOS ĮRAŠAS ===
    await addGroupHistoryEntry(
      Number(groupId),
      Number(memberId),                // vėl – dabar rašom tą narį. 
                                       // Vėliau gali pakeisti į "kas pašalino" (admino ID iš auth).
      "member_removed",
      `Narys "${memberName}" pašalintas iš grupės.`,
      {
        memberId: Number(memberId),
        memberEmail: member?.el_pastas ?? null,
      }
    )
    // =============================

    res.json({ success: true });
  } catch (err) {
    console.error("Remove member error:", err);
    const message = err.sqlMessage || err.message || "Serverio klaida";
    res.status(500).json({ message });
  }
});

// DELETE /api/groups/:id – ištrinti grupę ir susijusius duomenis
router.delete("/api/groups/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // Ištrinam priklausomus įrašus (pagal FK struktūrą)
    await db.query("DELETE FROM Grupes_zinutes WHERE fk_id_grupe = ?", [id]);
    await db.query("DELETE FROM Skolos WHERE fk_id_grupe = ?", [id]);
    await db.query("DELETE FROM Grupes_nariai WHERE fk_id_grupe = ?", [id]);

    const [result] = await db.query(
      "DELETE FROM Grupes WHERE id_grupe = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Grupė nerasta" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Delete group error:", err);
    const message = err.sqlMessage || err.message || "Serverio klaida";
    res.status(500).json({ message });
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

// Helperis – įrašyti grupės istorijos įrašą
async function addGroupHistoryEntry(groupId, userId, type, description, metadata = null) {
  try {
    const metaJson = metadata ? JSON.stringify(metadata) : null;

    await db.query(
      `
      INSERT INTO Grupes_istorija
        (fk_id_grupe, fk_id_vartotojas, tipas, aprasymas, metadata)
      VALUES (?, ?, ?, ?, ?)
      `,
      [groupId, userId ?? null, type, description, metaJson]
    );
  } catch (err) {
    console.error("Klaida rašant Grupes_istorija:", err);
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