const express = require("express")
const crypto = require("crypto")
const db = require("../db") // čia tavo mysql2 pool (PromisePool)

const { OAuth2Client } = require("google-auth-library")
const jwt = require("jsonwebtoken")

const router = express.Router()



/**
 * GET /api/valiutos
 * Grąžina visas valiutas
 */
router.get("/api/valiutos", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id_valiuta, name FROM valiutos ORDER BY id_valiuta"
    )
    return res.json(rows)
  } catch (err) {
    console.error("Valiutos gauti klaida:", err)
    return res.status(500).json({ message: "Serverio klaida gaunant valiutas" })
  }
});

/**
 * GET /api/vartotojai/:id
 * Grąžina konkretaus vartotojo informaciją
 */
router.get("/api/vartotojai/:id", async (req, res) => {
  try {
    const { id } = req.params

    const [rows] = await db.query(
      `SELECT 
         id_vartotojas,
         vardas,
         pavarde,
         el_pastas,
         valiutos_kodas,
         sukurimo_data,
         paskutinis_prisijungimas
       FROM vartotojai
       WHERE id_vartotojas = ?`,
      [id]
    )

    if (rows.length === 0) {
      return res.status(404).json({ message: "Vartotojas nerastas" })
    }

    return res.json(rows[0])
  } catch (err) {
    console.error("Vartotojo gavimo klaida:", err)
    return res.status(500).json({ message: "Serverio klaida gaunant vartotoją" })
  }
});

/**
 * PATCH /api/vartotojai/:id
 * Atnaujina vartotojo informaciją (valiutos_kodas)
 */
router.patch("/api/vartotojai/:id", async (req, res) => {
  try {
    const { id } = req.params
    const { valiutos_kodas } = req.body

    if (!valiutos_kodas) {
      return res.status(400).json({ message: "Valiutos kodas yra privalomas" })
    }

    // Patikriname ar valiuta egzistuoja
    const [valiutaCheck] = await db.query(
      "SELECT 1 FROM valiutos WHERE id_valiuta = ?",
      [valiutos_kodas]
    )

    if (valiutaCheck.length === 0) {
      return res.status(400).json({ message: "Tokia valiuta neegzistuoja" })
    }

    // Atnaujiname vartotoją
    await db.query(
      "UPDATE vartotojai SET valiutos_kodas = ? WHERE id_vartotojas = ?",
      [valiutos_kodas, id]
    )

    // Grąžiname atnaujintą vartotoją
    const [rows] = await db.query(
      `SELECT 
         id_vartotojas,
         vardas,
         pavarde,
         el_pastas,
         valiutos_kodas,
         sukurimo_data,
         paskutinis_prisijungimas
       FROM vartotojai
       WHERE id_vartotojas = ?`,
      [id]
    )

    return res.json(rows[0])
  } catch (err) {
    console.error("Vartotojo atnaujinimo klaida:", err)
    return res.status(500).json({ message: "Serverio klaida atnaujinant vartotoją" })
  }
});

module.exports = router