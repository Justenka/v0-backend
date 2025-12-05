const express = require("express")
const crypto = require("crypto")
const db = require("../db") // čia tavo mysql2 pool (PromisePool)

const { OAuth2Client } = require("google-auth-library")
const jwt = require("jsonwebtoken")

const router = express.Router()

// Pagalbinė funkcija SHA-256 hashui gauti
function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex")
}

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

function createJwt(user) {
  return jwt.sign(
    {
      id: user.id_vartotojas,
      email: user.el_pastas
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  )
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

/**
 * POST /api/login/google
 * Body: { idToken }
 */
router.post("/api/login/google", async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: "Trūksta Google idToken" });
    }

    // 1. Patvirtiname token naudodami Google
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(401).json({ message: "Neteisingas Google tokenas" });
    }

    const email = payload.email;
    const fullName = payload.name || "";

    if (!email) {
      return res
        .status(400)
        .json({ message: "Google paskyra neturi el. pašto" });
    }

    const [firstName, ...lastParts] = fullName.split(" ");
    const lastName = lastParts.join(" ");

    // 2. Ieškoti vartotojo lenteleje `vartotojai` el. paštu
    const [existingRows] = await db.query(
      `SELECT 
         id_vartotojas,
         vardas,
         pavarde,
         el_pastas,
         slaptazodis_hash,
         sukurimo_data,
         paskutinis_prisijungimas,
         valiutos_kodas
       FROM vartotojai
       WHERE el_pastas = ?`,
      [email]
    );

    let user;

    if (existingRows.length > 0) {
      // 3a. Vartotojas egzistuoja
      user = existingRows[0];

      await db.query(
        "UPDATE vartotojai SET paskutinis_prisijungimas = NOW() WHERE id_vartotojas = ?",
        [user.id_vartotojas]
      );
    } else {
      // 3b. Vartotojo nėra, sukurti naują „Google“ naudotoją
      // `slaptazodis_hash` NĖRA NULL, todėl įdedame atsitiktinę maiša šis vartotojas prisijungs tik su Google.
      const randomPassword = crypto.randomBytes(16).toString("hex");
      const passwordHash = hashPassword(randomPassword);

      const defaultCurrencyId = 1;

      const [insertResult] = await db.query(
        `INSERT INTO vartotojai 
           (vardas, pavarde, el_pastas, slaptazodis_hash, sukurimo_data, paskutinis_prisijungimas, valiutos_kodas)
         VALUES (?, ?, ?, ?, NOW(), NOW(), ?)`,
        [
          firstName || "Google",
          lastName || "",
          email,
          passwordHash,
          defaultCurrencyId,
        ]
      );

      const newUserId = insertResult.insertId;

      const [rows] = await db.query(
        `SELECT 
           id_vartotojas,
           vardas,
           pavarde,
           el_pastas,
           slaptazodis_hash,
           sukurimo_data,
           paskutinis_prisijungimas,
           valiutos_kodas
         FROM vartotojai
         WHERE id_vartotojas = ?`,
        [newUserId]
      );

      user = rows[0];
    }

    const token = createJwt(user);

    return res.json({
      user,
      token
    });
  } catch (err) {
    console.error("Google login error:", err);
    return res
      .status(500)
      .json({ message: "Serverio klaida prisijungiant per Google" });
  }
});


module.exports = router
