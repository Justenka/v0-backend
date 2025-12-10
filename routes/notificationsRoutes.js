// routes/notificationsRoutes.js
const express = require("express")
const db = require("../db")

const router = express.Router()

// DB -> DTO
function mapDbNotification(n) {
  return {
    id: n.id_pranesimas.toString(),
    userId: n.fk_id_vartotojas.toString(),
    type: n.tipas,
    title: n.pavadinimas,
    message: n.tekstas,
    read: n.nuskaityta === 1,
    timestamp: n.sukurta,
    actionUrl: n.action_url || undefined,
    metadata: n.metadata ? JSON.parse(n.metadata) : undefined,
  }
}

// GET /api/notifications?userId=123
router.get("/api/notifications", async (req, res) => {
  try {
    const userId = Number(req.query.userId)
    if (!userId) {
      return res.status(400).json({ message: "Trūksta userId" })
    }

    const [rows] = await db.query(
      `
      SELECT *
      FROM Pranesimai
      WHERE fk_id_vartotojas = ?
      ORDER BY sukurta DESC
      `,
      [userId],
    )

    const notifications = rows.map(mapDbNotification)
    res.json({ notifications })
  } catch (err) {
    console.error("Get notifications error:", err)
    res.status(500).json({ message: "Serverio klaida gaunant pranešimus" })
  }
})

// PATCH /api/notifications/:id/read  (pažymėti vieną kaip perskaitytą)
router.patch("/api/notifications/:id/read", async (req, res) => {
  try {
    const notifId = Number(req.params.id)
    const userId = Number(req.body.userId) // paprastas checkas

    if (!notifId || !userId) {
      return res.status(400).json({ message: "Trūksta ID" })
    }

    const [result] = await db.query(
      `
      UPDATE Pranesimai
      SET nuskaityta = 1
      WHERE id_pranesimas = ? AND fk_id_vartotojas = ?
      `,
      [notifId, userId],
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Pranešimas nerastas" })
    }

    res.json({ message: "Pranešimas pažymėtas kaip perskaitytas" })
  } catch (err) {
    console.error("Mark notification read error:", err)
    res.status(500).json({ message: "Serverio klaida atnaujinant pranešimą" })
  }
})

// PATCH /api/notifications/mark-all-read
router.patch("/api/notifications/mark-all-read", async (req, res) => {
  try {
    const userId = Number(req.body.userId)
    if (!userId) {
      return res.status(400).json({ message: "Trūksta userId" })
    }

    await db.query(
      `
      UPDATE Pranesimai
      SET nuskaityta = 1
      WHERE fk_id_vartotojas = ?
      `,
      [userId],
    )

    res.json({ message: "Visi pranešimai pažymėti kaip perskaityti" })
  } catch (err) {
    console.error("Mark all notifications read error:", err)
    res.status(500).json({ message: "Serverio klaida atnaujinant pranešimus" })
  }
})

module.exports = router
