// routes/messagesRoutes.js
const express = require("express")
const db = require("../db")

const router = express.Router()

// helper – ar dviese yra draugai
async function areFriends(userId, friendId) {
  const [rows] = await db.query(
    `
    SELECT 1
    FROM Vartotoju_draugystes
    WHERE status = 'accepted'
      AND (
        (fk_requester_id = ? AND fk_addressee_id = ?)
        OR
        (fk_requester_id = ? AND fk_addressee_id = ?)
      )
    LIMIT 1
    `,
    [userId, friendId, friendId, userId],
  )
  return rows.length > 0
}

/**
 * GET /api/messages?userId=1&friendId=2
 * Grąžina visas žinutes tarp userId ir friendId
 */
router.get("/api/messages", async (req, res) => {
  try {
    const userId = Number(req.query.userId)
    const friendId = Number(req.query.friendId)

    if (!userId || !friendId) {
      return res.status(400).json({ message: "Trūksta userId arba friendId" })
    }

    // tik draugai gali matyti pokalbį
    const friends = await areFriends(userId, friendId)
    if (!friends) {
      return res.status(403).json({ message: "Negalite matyti šio pokalbio" })
    }

    const [rows] = await db.query(
      `
      SELECT
        id_asmeninis_pranesimas,
        fk_id_vartotojas_siuntejas,
        fk_id_vartotojas_gavejas,
        turinys,
        data,
        pranesimo_busena
      FROM asmeniniai_pranesimai
      WHERE (fk_id_vartotojas_siuntejas = ? AND fk_id_vartotojas_gavejas = ?)
         OR (fk_id_vartotojas_siuntejas = ? AND fk_id_vartotojas_gavejas = ?)
      ORDER BY data ASC, id_asmeninis_pranesimas ASC
      `,
      [userId, friendId, friendId, userId],
    )

    // pranesimo_busena: 0 = neperskaitytas, 1 = perskaitytas
    const messages = rows.map((m) => ({
      id: m.id_asmeninis_pranesimas,
      senderId: m.fk_id_vartotojas_siuntejas.toString(),
      recipientId: m.fk_id_vartotojas_gavejas.toString(),
      content: m.turinys,
      timestamp: m.data,    
      read: m.pranesimo_busena, 
    }))

    return res.json({ messages })
  } catch (err) {
    console.error("Get messages error:", err)
    return res.status(500).json({ message: "Serverio klaida gaunant žinutes" })
  }
})

/**
 * POST /api/messages
 * Body: { fromUserId, toUserId, text }
 */
router.post("/api/messages", async (req, res) => {
  try {
    const { fromUserId, toUserId, text } = req.body

    const senderId = Number(fromUserId)
    const receiverId = Number(toUserId)
    const trimmed = (text || "").trim()

    if (!senderId || !receiverId || !trimmed) {
      return res.status(400).json({ message: "Trūksta laukų arba žinutė tuščia" })
    }

    // tik draugai gali rašyti
    const friends = await areFriends(senderId, receiverId)
    if (!friends) {
      return res
        .status(403)
        .json({ message: "Negalite rašyti vartotojui, kuris nėra jūsų draugas" })
    }

    // nauja žinutė: pranesimo_busena = 0 (neperskaityta)
    const [result] = await db.query(
      `
      INSERT INTO asmeniniai_pranesimai
        (fk_id_vartotojas_siuntejas, fk_id_vartotojas_gavejas, turinys, data, pranesimo_busena)
      VALUES (?, ?, ?, NOW(), 0)
      `,
      [senderId, receiverId, trimmed],
    )

    const newId = result.insertId

    const [rows] = await db.query(
      `
      SELECT
        id_asmeninis_pranesimas,
        fk_id_vartotojas_siuntejas,
        fk_id_vartotojas_gavejas,
        turinys,
        data,
        pranesimo_busena
      FROM asmeniniai_pranesimai
      WHERE id_asmeninis_pranesimas = ?
      `,
      [newId],
    )

    const m = rows[0]

    return res.status(201).json({
      message: {
        id: m.id_asmeninis_pranesimas,
        senderId: m.fk_id_vartotojas_siuntejas.toString(),
        recipientId: m.fk_id_vartotojas_gavejas.toString(),
        content: m.turinys,
        timestamp: m.data,
        read: m.pranesimo_busena, // 0
      },
    })
  } catch (err) {
    console.error("Create message error:", err)
    return res.status(500).json({ message: "Serverio klaida siunčiant žinutę" })
  }
})

router.post("/api/messages/mark-read", async (req, res) => {
  try {
    const { userId, friendId } = req.body
    const uId = Number(userId)
    const fId = Number(friendId)

    if (!uId || !fId) {
      return res.status(400).json({ message: "Trūksta userId arba friendId" })
    }

    await db.query(
      `
      UPDATE asmeniniai_pranesimai
      SET pranesimo_busena = 1
      WHERE fk_id_vartotojas_gavejas = ?
        AND fk_id_vartotojas_siuntejas = ?
        AND pranesimo_busena = 0
      `,
      [uId, fId],
    )

    return res.json({ success: true })
  } catch (err) {
    console.error("mark-read error:", err)
    return res.status(500).json({ message: "Serverio klaida žymint perskaitytą" })
  }
})

module.exports = router
