// routes/friendsRoutes.js
const express = require("express")
const db = require("../db")

const router = express.Router()

// Helper: map DB user -> friend DTO
function mapDbUserToFriend(u) {
  return {
    id: u.id_vartotojas.toString(),
    name: `${u.vardas} ${u.pavarde}`,
    email: u.el_pastas,
    avatar: null, // jei turėsi avatar stulpelį - papildysi
  }
}

/**
 * GET /api/friends?userId=123
 * Grąžina visus patvirtintus draugus
 */
router.get("/api/friends", async (req, res) => {
  try {
    const userId = Number(req.query.userId)
    if (!userId) {
      return res.status(400).json({ message: "Trūksta userId" })
    }

    const [rows] = await db.query(
      `
      SELECT 
        d.id_draugyste,
        d.fk_requester_id,
        d.fk_addressee_id,
        d.status,
        v.id_vartotojas,
        v.vardas,
        v.pavarde,
        v.el_pastas
      FROM Vartotoju_draugystes d
      JOIN Vartotojai v
        ON v.id_vartotojas = 
          CASE 
            WHEN d.fk_requester_id = ? THEN d.fk_addressee_id
            ELSE d.fk_requester_id
          END
      WHERE (d.fk_requester_id = ? OR d.fk_addressee_id = ?)
        AND d.status = 'accepted'
      `,
      [userId, userId, userId],
    )

    const friends = rows.map(mapDbUserToFriend)

    return res.json({ friends })
  } catch (err) {
    console.error("Get friends error:", err)
    return res.status(500).json({ message: "Serverio klaida gaunant draugus" })
  }
})

/**
 * GET /api/friend-requests?userId=123
 * Grąžina laukiančius kvietimus: incoming ir outgoing
 */
router.get("/api/friend-requests", async (req, res) => {
  try {
    const userId = Number(req.query.userId)
    if (!userId) {
      return res.status(400).json({ message: "Trūksta userId" })
    }

    // incoming: kiti mane pakvietė
    const [incomingRows] = await db.query(
      `
      SELECT 
        d.id_draugyste,
        d.created_at,
        v.id_vartotojas,
        v.vardas,
        v.pavarde,
        v.el_pastas
      FROM Vartotoju_draugystes d
      JOIN Vartotojai v
        ON v.id_vartotojas = d.fk_requester_id
      WHERE d.fk_addressee_id = ?
        AND d.status = 'pending'
      ORDER BY d.created_at DESC
      `,
      [userId],
    )

    // outgoing: aš pakviečiau kitus
    const [outgoingRows] = await db.query(
      `
      SELECT 
        d.id_draugyste,
        d.created_at,
        v.id_vartotojas,
        v.vardas,
        v.pavarde,
        v.el_pastas
      FROM Vartotoju_draugystes d
      JOIN Vartotojai v
        ON v.id_vartotojas = d.fk_addressee_id
      WHERE d.fk_requester_id = ?
        AND d.status = 'pending'
      ORDER BY d.created_at DESC
      `,
      [userId],
    )

    const incoming = incomingRows.map((r) => ({
      requestId: r.id_draugyste,
      createdAt: r.created_at,
      user: mapDbUserToFriend(r),
    }))

    const outgoing = outgoingRows.map((r) => ({
      requestId: r.id_draugyste,
      createdAt: r.created_at,
      user: mapDbUserToFriend(r),
    }))

    return res.json({ incoming, outgoing })
  } catch (err) {
    console.error("Get friend requests error:", err)
    return res.status(500).json({ message: "Serverio klaida gaunant kvietimus" })
  }
})

/**
 * POST /api/friend-requests
 * Body: { fromUserId, identifier }  // identifier = email arba "Vardas Pavardė"
 */
router.post("/api/friend-requests", async (req, res) => {
  try {
    const { fromUserId, email } = req.body

    const requesterId = Number(fromUserId)
    if (!requesterId || !email) {
      return res
        .status(400)
        .json({ message: "Trūksta siuntėjo ID arba el. pašto" })
    }

    // paprasta email validacija
    const emailTrimmed = String(email).trim().toLowerCase()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(emailTrimmed)) {
      return res.status(400).json({ message: "Įveskite galiojantį el. pašto adresą" })
    }

    // 1. Surandam gavėją tik pagal el. paštą
    const [byEmail] = await db.query(
      `SELECT id_vartotojas, vardas, pavarde, el_pastas 
       FROM Vartotojai 
       WHERE LOWER(el_pastas) = ?`,
      [emailTrimmed],
    )

    if (byEmail.length === 0) {
      return res
        .status(404)
        .json({ message: "Vartotojas su tokiu el. paštu nerastas" })
    }

    const targetUser = byEmail[0]
    const addresseeId = targetUser.id_vartotojas

    if (addresseeId === requesterId) {
      return res.status(400).json({ message: "Negalite pakviesti savęs" })
    }

    // 2. Patikrinam, ar jau yra draugystė ar pending kvietimas bet kuria kryptimi
    const [existing] = await db.query(
      `
      SELECT id_draugyste, status
      FROM Vartotoju_draugystes
      WHERE (fk_requester_id = ? AND fk_addressee_id = ?)
         OR (fk_requester_id = ? AND fk_addressee_id = ?)
      `,
      [requesterId, addresseeId, addresseeId, requesterId],
    )

    if (existing.length > 0) {
      const e = existing[0]
      if (e.status === "pending") {
        return res.status(409).json({ message: "Kvietimas jau egzistuoja" })
      }
      if (e.status === "accepted") {
        return res.status(409).json({ message: "Jūs jau esate draugai" })
      }
    }

    // 3. Sukuriam naują kvietimą
    const [insertResult] = await db.query(
      `
      INSERT INTO Vartotoju_draugystes
        (fk_requester_id, fk_addressee_id, status)
      VALUES (?, ?, 'pending')
      `,
      [requesterId, addresseeId],
    )

    return res.status(201).json({
      requestId: insertResult.insertId,
      toUser: {
        id: targetUser.id_vartotojas.toString(),
        name: `${targetUser.vardas} ${targetUser.pavarde}`,
        email: targetUser.el_pastas,
        avatar: null,
      },
    })
  } catch (err) {
    console.error("Create friend request error:", err)
    return res.status(500).json({ message: "Serverio klaida kuriant kvietimą" })
  }
})

/**
 * POST /api/friend-requests/:id/accept
 * Body: { userId }  // kuris patvirtina (gavėjas)
 */
router.post("/api/friend-requests/:id/accept", async (req, res) => {
  try {
    const requestId = Number(req.params.id)
    const userId = Number(req.body.userId)

    if (!requestId || !userId) {
      return res.status(400).json({ message: "Trūksta requestId arba userId" })
    }

    const [result] = await db.query(
      `
      UPDATE Vartotoju_draugystes
      SET status = 'accepted', updated_at = NOW()
      WHERE id_draugyste = ?
        AND fk_addressee_id = ?
        AND status = 'pending'
      `,
      [requestId, userId],
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Kvietimas nerastas arba jau apdorotas" })
    }

    return res.json({ message: "Draugas patvirtintas" })
  } catch (err) {
    console.error("Accept friend request error:", err)
    return res.status(500).json({ message: "Serverio klaida patvirtinant kvietimą" })
  }
})

/**
 * POST /api/friend-requests/:id/reject
 * Body: { userId }
 */
router.post("/api/friend-requests/:id/reject", async (req, res) => {
  try {
    const requestId = Number(req.params.id)
    const userId = Number(req.body.userId)

    if (!requestId || !userId) {
      return res.status(400).json({ message: "Trūksta requestId arba userId" })
    }

    const [result] = await db.query(
      `
      DELETE FROM Vartotoju_draugystes
      WHERE id_draugyste = ?
        AND fk_addressee_id = ?
        AND status = 'pending'
      `,
      [requestId, userId],
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Kvietimas nerastas arba jau apdorotas" })
    }

    return res.json({ message: "Kvietimas atmestas" })
  } catch (err) {
    console.error("Reject friend request error:", err)
    return res.status(500).json({ message: "Serverio klaida atmetant kvietimą" })
  }
})

/**
 * DELETE /api/friends/:friendId
 * Body: { userId }
 */
router.delete("/api/friends/:friendId", async (req, res) => {
  try {
    const friendId = Number(req.params.friendId)
    const userId = Number(req.body.userId)

    if (!friendId || !userId) {
      return res.status(400).json({ message: "Trūksta userId arba friendId" })
    }

    const [result] = await db.query(
      `
      DELETE FROM Vartotoju_draugystes
      WHERE status = 'accepted'
        AND (
          (fk_requester_id = ? AND fk_addressee_id = ?)
          OR
          (fk_requester_id = ? AND fk_addressee_id = ?)
        )
      `,
      [userId, friendId, friendId, userId],
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Draugystė nerasta" })
    }

    return res.json({ message: "Draugas pašalintas" })
  } catch (err) {
    console.error("Remove friend error:", err)
    return res.status(500).json({ message: "Serverio klaida šalinant draugą" })
  }
})

module.exports = router
