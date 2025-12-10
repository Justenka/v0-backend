const cron = require("node-cron")
const axios = require("axios")
const db = require("../db")

// Naudosime exchangerate-api.com (nemokama versija)
// Arba galite naudoti kitą API, pvz. frankfurter.app
const EXCHANGE_API_URL = "https://api.frankfurter.app/latest"

/**
 * Gauna valiutų kursus iš API
 */
async function fetchExchangeRates() {
  try {
    // Gauname kursus su EUR kaip baze
    const response = await axios.get(`${EXCHANGE_API_URL}?from=EUR&to=USD,PLN`)
    
    if (response.data && response.data.rates) {
      return {
        EUR: 1, // EUR bazė yra 1
        USD: response.data.rates.USD || 1,
        PLN: response.data.rates.PLN || 1,
      }
    }
    
    throw new Error("Nepavyko gauti valiutų kursų")
  } catch (error) {
    console.error("Klaida gaunant valiutų kursus:", error.message)
    return null
  }
}

/**
 * Atnaujina valiutų santykius duomenų bazėje
 */
async function updateCurrencyRates() {
  console.log(`[${new Date().toISOString()}] Pradedamas valiutų kursų atnaujinimas...`)
  
  try {
    const rates = await fetchExchangeRates()
    
    if (!rates) {
      console.error("Nepavyko gauti valiutų kursų, praleidžiama...")
      return
    }

    // Atnaujinamas EUR santykis (visada 1)
    await db.query(
      "UPDATE valiutos SET santykis = ? WHERE name = ?",
      [1, "EUR"]
    )

    // Atnaujinamas USD santykis
    if (rates.USD) {
      await db.query(
        "UPDATE valiutos SET santykis = ? WHERE name = ?",
        [rates.USD, "USD"]
      )
      console.log(`USD santykis atnaujintas: ${rates.USD}`)
    }

    // Atnaujinamas PLN santykis
    if (rates.PLN) {
      await db.query(
        "UPDATE valiutos SET santykis = ? WHERE name = ?",
        [rates.PLN, "PLN"]
      )
      console.log(`PLN santykis atnaujintas: ${rates.PLN}`)
    }

    console.log(`[${new Date().toISOString()}] Valiutų kursai sėkmingai atnaujinti!`)
    console.log(`EUR: 1, USD: ${rates.USD}, PLN: ${rates.PLN}`)
  } catch (error) {
    console.error("Klaida atnaujinant valiutų kursus:", error)
  }
}

/**
 * Paleidžia cron job'ą, kuris kas valandą atnaujina valiutų kursus
 */
function startCurrencyUpdater() {
  // Paleisti iš karto kai serveris startuoja
  updateCurrencyRates()

  // Cron job'as kas valandą (0 minutę kiekvieną valandą)
  cron.schedule("0 * * * *", () => {
    updateCurrencyRates()
  })

  console.log("✓ Valiutų kursų atnaujinimo tarnyba paleista (atnaujinimas kas valandą)")
}

module.exports = {
  startCurrencyUpdater,
  updateCurrencyRates, // Eksportuojame jei reikėtų rankiniu būdu iškviesti
}