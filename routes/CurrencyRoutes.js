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
      "SELECT id_valiuta, name, santykis FROM valiutos ORDER BY id_valiuta"
    )
     console.log("Backend valiutos:", rows) // DEBUG - patikrinkite backend console
    return res.json(rows)
  } catch (err) {
    console.error("Valiutos gauti klaida:", err)
    return res.status(500).json({ message: "Serverio klaida gaunant valiutas" })
  }
})



/**
 * GET /api/valiutos/convert
 * Konvertuoja sumą iš vienos valiutos į kitą
 * Query params: amount, fromCurrency (id), toCurrency (id)
 */
router.get("/api/valiutos/convert", async (req, res) => {
  try {
    const { amount, fromCurrency, toCurrency } = req.query

    if (!amount || !fromCurrency || !toCurrency) {
      return res.status(400).json({ 
        message: "Reikalingi parametrai: amount, fromCurrency, toCurrency" 
      })
    }

    // Jei tos pačios valiutos, grąžiname originalią sumą
    if (fromCurrency === toCurrency) {
      return res.json({ 
        amount: parseFloat(amount),
        fromCurrency: parseInt(fromCurrency),
        toCurrency: parseInt(toCurrency)
      })
    }

    // Gauname abi valiutas
    const [currencies] = await db.query(
      "SELECT id_valiuta, name, santykis FROM valiutos WHERE id_valiuta IN (?, ?)",
      [fromCurrency, toCurrency]
    )

    if (currencies.length !== 2) {
      return res.status(404).json({ message: "Valiutos nerastos" })
    }

    const from = currencies.find(c => c.id_valiuta === parseInt(fromCurrency))
    const to = currencies.find(c => c.id_valiuta === parseInt(toCurrency))

    // Konvertuojame: pirmiausia į EUR, paskui į tikslinę valiutą
    // Formulė: (amount / from.santykis) * to.santykis
    const amountInEUR = parseFloat(amount) / from.santykis
    const convertedAmount = amountInEUR * to.santykis

    return res.json({
      amount: parseFloat(convertedAmount.toFixed(2)),
      fromCurrency: parseInt(fromCurrency),
      fromCurrencyName: from.name,
      toCurrency: parseInt(toCurrency),
      toCurrencyName: to.name,
      rate: to.santykis / from.santykis
    })
  } catch (err) {
    console.error("Konvertavimo klaida:", err)
    return res.status(500).json({ message: "Serverio klaida konvertuojant valiutą" })
  }
})

/**
 * POST /api/valiutos/update-rates
 * Rankiniu būdu atnaujina valiutų santykius
 */
router.post("/api/valiutos/update-rates", async (req, res) => {
  try {
    await updateCurrencyRates()
    
    const [rows] = await db.query(
      "SELECT id_valiuta, name, santykis FROM valiutos ORDER BY id_valiuta"
    )
    
    return res.json({
      message: "Valiutų santykiai sėkmingai atnaujinti",
      valiutos: rows
    })
  } catch (err) {
    console.error("Valiutų atnaujinimo klaida:", err)
    return res.status(500).json({ message: "Serverio klaida atnaujinant valiutų santykius" })
  }
})

module.exports = router