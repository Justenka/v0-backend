const express = require("express")
const crypto = require("crypto")
const db = require("../db") // čia tavo mysql2 pool (PromisePool)

const router = express.Router()

// Pagalbinė funkcija SHA-256 hashui gauti
function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex")
}

/**
 * POST /api/login
 * Body: { email, password }
 */
router.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Reikalingi el. paštas ir slaptažodis" })
    }

    const passwordHash = hashPassword(password)

    // MySQL sintaksė: be "..." ir su ? placeholderiais
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
       WHERE el_pastas = ?
         AND slaptazodis_hash = ?`,
      [email, passwordHash],
    )

    if (!rows || rows.length === 0) {
      return res
        .status(401)
        .json({ message: "Neteisingas el. paštas arba slaptažodis" })
    }

    const user = rows[0]
    return res.json({ user })
  } catch (err) {
    console.error("Login error:", err)
    return res.status(500).json({ message: "Serverio klaida prisijungiant" })
  }
})

/**
 * POST /api/register
 * Body: { name, email, password }
 */
router.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Reikalingi vardas, el. paštas ir slaptažodis" })
    }

    // 1. Patikrinam, ar email jau užimtas
    const [existing] = await db.query(
      "SELECT 1 FROM Vartotojai WHERE el_pastas = ?",
      [email],
    )

    if (existing.length > 0) {
      return res.status(409).json({ message: "Šis el. paštas jau naudojamas" })
    }

    // 2. Splitinam vardą į vardą ir pavardę
    const parts = name.trim().split(" ")
    const firstName = parts[0]
    const lastName = parts.slice(1).join(" ") || "-"

    // 3. Hashinam slaptažodį
    const passwordHash = hashPassword(password)
    const DEFAULT_CURRENCY_ID = 1 // <-- šitą id_valiuta turi egzistuoti lentelėje `valiutos`
    // 4. Kuriam vartotoją
    const [insertResult] = await db.query(
      `INSERT INTO Vartotojai
       (vardas, pavarde, el_pastas, valiutos_kodas, sukurimo_data, paskutinis_prisijungimas, slaptazodis_hash)
       VALUES (?, ?, ?, ?, NOW(), NOW(), ?)`,
      [firstName, lastName, email, DEFAULT_CURRENCY_ID, passwordHash],
    )

    const newUserId = insertResult.insertId

    // 5. Atsikraunam pilną userį, kad grąžintume frontendui
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
       WHERE id_vartotojas = ?`,
      [newUserId],
    )

    const newUser = rows[0]

    return res.status(201).json({ user: newUser })
  } catch (err) {
    console.error("Register error:", err)
    return res
      .status(500)
      .json({ message: "Serverio klaida registruojant vartotoją" })
  }
})

module.exports = router
