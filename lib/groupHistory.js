// lib/groupHistory.js
const db = require("../db")

// Helperis – įrašyti grupės istorijos įrašą
async function addGroupHistoryEntry(groupId, userId, type, description, metadata = null) {
  try {
    const metaJson = metadata ? JSON.stringify(metadata) : null

    await db.query(
      `
      INSERT INTO Grupes_istorija
        (fk_id_grupe, fk_id_vartotojas, tipas, aprasymas, metadata)
      VALUES (?, ?, ?, ?, ?)
      `,
      [groupId, userId ?? null, type, description, metaJson]
    )
  } catch (err) {
    console.error("Klaida rašant Grupes_istorija:", err)
    // istorija neturėtų numušti pagrindinio veiksmo
  }
}

module.exports = {
  addGroupHistoryEntry,
}