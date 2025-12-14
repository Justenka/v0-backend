// routes/settingsRoutes.js
const express = require("express")
const db = require("../db")

const router = express.Router()

// ---------------- Valiutos (kaip buvo) ----------------

// GET /api/valiutos – valiutų sąrašas
router.get("/api/valiutos", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id_valiuta, name FROM Valiutos ORDER BY id_valiuta",
    )
    res.json(rows)
  } catch (err) {
    console.error("Get valiutos error:", err)
    res.status(500).json({ message: "Nepavyko gauti valiutų" })
  }
})

// GET /api/vartotojai/:id – vartotojas (valiuta)
router.get("/api/vartotojai/:id", async (req, res) => {
  try {
    const userId = Number(req.params.id)
    if (!userId) {
      return res
        .status(400)
        .json({ message: "Nurodytas neteisingas vartotojo ID" })
    }

    const [rows] = await db.query(
      `
      SELECT 
        id_vartotojas,
        vardas,
        pavarde,
        el_pastas,
        valiutos_kodas,
        sukurimo_data,
        paskutinis_prisijungimas
      FROM Vartotojai
      WHERE id_vartotojas = ?
      `,
      [userId],
    )

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "Vartotojas nerastas" })
    }

    res.json(rows[0])
  } catch (err) {
    console.error("Get user error:", err)
    res.status(500).json({ message: "Serverio klaida gaunant vartotoją" })
  }
})

// PATCH /api/vartotojai/:id – KEIČIAM TIK valiutą
router.patch("/api/vartotojai/:id", async (req, res) => {
  try {
    const userId = Number(req.params.id)
    if (!userId) {
      return res
        .status(400)
        .json({ message: "Nurodytas neteisingas vartotojo ID" })
    }

    const { valiutos_kodas } = req.body

    if (!valiutos_kodas) {
      return res.status(400).json({ message: "Trūksta valiutos_kodas" })
    }

    await db.query(
      `
      UPDATE Vartotojai
      SET valiutos_kodas = ?
      WHERE id_vartotojas = ?
      `,
      [valiutos_kodas, userId],
    )

    const [rows] = await db.query(
      `
      SELECT 
        id_vartotojas,
        vardas,
        pavarde,
        el_pastas,
        valiutos_kodas,
        sukurimo_data,
        paskutinis_prisijungimas
      FROM Vartotojai
      WHERE id_vartotojas = ?
      `,
      [userId],
    )

    res.json(rows[0])
  } catch (err) {
    console.error("Patch user error:", err)
    res.status(500).json({ message: "Serverio klaida atnaujinant vartotoją" })
  }
})

// ---------------- Pranešimų nustatymai ----------------

// helper: jei nėra įrašo – sukuriam default
async function ensureSettingsRow(userId) {
  const [rows] = await db.query(
    "SELECT * FROM Pranesimu_nustatymai WHERE fk_id_vartotojas = ?",
    [userId],
  )

  if (rows.length > 0) return rows[0]

  const [insertResult] = await db.query(
    `
    INSERT INTO Pranesimu_nustatymai
      (fk_id_vartotojas, draugu_kvietimai,
       naujos_islaidos, mokejimo_priminimai, zinutes)
    VALUES (?, 1, 1, 1, 1)
    `,
    [userId],
  )

  const [rows2] = await db.query(
    "SELECT * FROM Pranesimu_nustatymai WHERE id_pranesimu_nustatymai = ?",
    [insertResult.insertId],
  )
  return rows2[0]
}

// GET /api/pranesimu-nustatymai/:userId
router.get("/api/pranesimu-nustatymai/:userId", async (req, res) => {
  try {
    const userId = Number(req.params.userId)
    if (!userId) {
      return res
        .status(400)
        .json({ message: "Nurodytas neteisingas vartotojo ID" })
    }

    const settings = await ensureSettingsRow(userId)
    res.json(settings)
  } catch (err) {
    console.error("Get notif settings error:", err)
    res
      .status(500)
      .json({ message: "Serverio klaida gaunant pranešimų nustatymus" })
  }
})

// PATCH /api/pranesimu-nustatymai/:userId
router.patch("/api/pranesimu-nustatymai/:userId", async (req, res) => {
  try {
    const userId = Number(req.params.userId)
    if (!userId) {
      return res
        .status(400)
        .json({ message: "Nurodytas neteisingas vartotojo ID" })
    }

    const current = await ensureSettingsRow(userId)

    const {
      draugu_kvietimai = current.draugu_kvietimai,
      naujos_islaidos = current.naujos_islaidos,
      mokejimo_priminimai = current.mokejimo_priminimai,
      zinutes = current.zinutes,
    } = req.body

    await db.query(
      `
      UPDATE Pranesimu_nustatymai
      SET 
        draugu_kvietimai = ?,
        naujos_islaidos = ?,
        mokejimo_priminimai = ?,
        zinutes = ?
      WHERE fk_id_vartotojas = ?
      `,
      [
        draugu_kvietimai ? 1 : 0,
        naujos_islaidos ? 1 : 0,
        mokejimo_priminimai ? 1 : 0,
        zinutes ? 1 : 0,
        userId,
      ],
    )

    const [rows] = await db.query(
      "SELECT * FROM Pranesimu_nustatymai WHERE fk_id_vartotojas = ?",
      [userId],
    )

    res.json(rows[0])
  } catch (err) {
    console.error("Patch notif settings error:", err)
    res
      .status(500)
      .json({ message: "Serverio klaida saugant pranešimų nustatymus" })
  }
})

module.exports = router
