const express = require("express")
const crypto = require("crypto")
const db = require("../db")
const path = require("path")

const multer = require("multer")

const nodemailer = require("nodemailer")

const { OAuth2Client } = require("google-auth-library")
const jwt = require("jsonwebtoken")

const router = express.Router()

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex")
}

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000"

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

    const [rows] = await db.query(
      `SELECT 
        id_vartotojas,
        vardas,
        pavarde,
        el_pastas,
        valiutos_kodas,
        sukurimo_data,
        paskutinis_prisijungimas,
        avatar_url
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

    await db.query(
      "UPDATE Vartotojai SET paskutinis_prisijungimas = NOW() WHERE id_vartotojas = ?",
      [user.id_vartotojas],
    )

    // Perskaitom dar kartą, kad gautume jau atnaujintą timestamp
    const [updatedRows] = await db.query(
      `SELECT 
        id_vartotojas,
        vardas,
        pavarde,
        el_pastas,
        valiutos_kodas,
        sukurimo_data,
        paskutinis_prisijungimas,
        avatar_url
       FROM Vartotojai
       WHERE id_vartotojas = ?`,
      [user.id_vartotojas],
    )

    const updatedUser = updatedRows[0]

    // jei nori JWT – gali čia
    // const token = createJwt(updatedUser)

    return res.json({
      user: updatedUser,
      // token
    })
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
        paskutinis_prisijungimas,
        avatar_url
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
    const { idToken } = req.body

    if (!idToken) {
      return res.status(400).json({ message: "Trūksta Google idToken" })
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    })

    const payload = ticket.getPayload()
    if (!payload) {
      return res.status(401).json({ message: "Neteisingas Google tokenas" })
    }

    const email = payload.email
    const fullName = payload.name || ""

    if (!email) {
      return res
        .status(400)
        .json({ message: "Google paskyra neturi el. pašto" })
    }

    const [firstName, ...lastParts] = fullName.split(" ")
    const lastName = lastParts.join(" ")

    const [existingRows] = await db.query(
      `SELECT 
        id_vartotojas,
        vardas,
        pavarde,
        el_pastas,
        slaptazodis_hash,
        sukurimo_data,
        paskutinis_prisijungimas,
        valiutos_kodas,
        avatar_url
       FROM vartotojai
       WHERE el_pastas = ?`,
      [email],
    )

    let userId

    if (existingRows.length > 0) {
      // egzistuojantis
      const existingUser = existingRows[0]
      userId = existingUser.id_vartotojas

      await db.query(
        "UPDATE vartotojai SET paskutinis_prisijungimas = NOW() WHERE id_vartotojas = ?",
        [userId],
      )
    } else {
      // naujas
      const randomPassword = crypto.randomBytes(16).toString("hex")
      const passwordHash = hashPassword(randomPassword)
      const defaultCurrencyId = 1

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
        ],
      )

      userId = insertResult.insertId
    }

    // ČIA – vieningai perskaitom userį su nauju paskutinis_prisijungimas
    const [rows] = await db.query(
      `SELECT 
         id_vartotojas,
         vardas,
         pavarde,
         el_pastas,
         slaptazodis_hash,
         sukurimo_data,
         paskutinis_prisijungimas,
         valiutos_kodas,
         avatar_url
       FROM vartotojai
       WHERE id_vartotojas = ?`,
      [userId],
    )

    const user = rows[0]
    const token = createJwt(user)

    return res.json({ user, token })
  } catch (err) {
    console.error("Google login error:", err)
    return res
      .status(500)
      .json({ message: "Serverio klaida prisijungiant per Google" })
  }
})

// Profilio atnaujinimas (vardas + el. paštas)
router.put("/api/profile", async (req, res) => {
  try {
    const userId = req.header("x-user-id")

    if (!userId) {
      return res.status(401).json({ message: "Nerastas vartotojo ID (x-user-id)" })
    }

    const { name, email } = req.body

    if (!name || !email) {
      return res
        .status(400)
        .json({ message: "Reikalingi vardas ir el. paštas" })
    }

    // splitinam pilną vardą
    const parts = name.trim().split(" ")
    const firstName = parts[0]
    const lastName = parts.slice(1).join(" ") || "-"

    // UPDATE
    await db.query(
      `UPDATE Vartotojai
       SET vardas = ?, pavarde = ?, el_pastas = ?
       WHERE id_vartotojas = ?`,
      [firstName, lastName, email, userId],
    )

    // perskaitom atnaujintą userį
    const [rows] = await db.query(
      `SELECT 
        id_vartotojas,
        vardas,
        pavarde,
        el_pastas,
        valiutos_kodas,
        sukurimo_data,
        paskutinis_prisijungimas,
        avatar_url
       FROM Vartotojai
       WHERE id_vartotojas = ?`,
      [userId],
    )

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "Vartotojas nerastas" })
    }

    const user = rows[0]
    return res.json({ user })
  } catch (err) {
    console.error("Profile update error:", err)
    return res.status(500).json({ message: "Serverio klaida atnaujinant profilį" })
  }
})

// 🔹 Slaptažodžio keitimas
router.post("/api/profile/password", async (req, res) => {
  try {
    const userId = req.header("x-user-id")

    if (!userId) {
      return res.status(401).json({ message: "Nerastas vartotojo ID (x-user-id)" })
    }

    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Reikalingi dabartinis ir naujas slaptažodis" })
    }

    // pasiimam esamą hash
    const [rows] = await db.query(
      `SELECT slaptazodis_hash
       FROM Vartotojai
       WHERE id_vartotojas = ?`,
      [userId],
    )

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "Vartotojas nerastas" })
    }

    const user = rows[0]
    const currentHash = hashPassword(currentPassword)

    if (currentHash !== user.slaptazodis_hash) {
      return res.status(400).json({ message: "Neteisingas dabartinis slaptažodis" })
    }

    const newHash = hashPassword(newPassword)

    await db.query(
      `UPDATE Vartotojai
       SET slaptazodis_hash = ?
       WHERE id_vartotojas = ?`,
      [newHash, userId],
    )

    return res.json({ message: "Slaptažodis sėkmingai pakeistas" })
  } catch (err) {
    console.error("Change password error:", err)
    return res.status(500).json({ message: "Serverio klaida keičiant slaptažodį" })
  }
})

router.post("/api/password/forgot", async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ message: "Reikalingas el. paštas" })
    }

    // 1. Surandam vartotoją pagal el. paštą
    const [users] = await db.query(
      `SELECT id_vartotojas, vardas, pavarde, el_pastas
       FROM Vartotojai
       WHERE el_pastas = ?`,
      [email],
    )

    // Geresnė praktika – visada grąžinti OK, kad neatskleistume ar toks email egzistuoja
    if (!users || users.length === 0) {
      return res.json({
        message:
          "Jeigu toks el. paštas egzistuoja sistemoje, buvo išsiųstas slaptažodžio atkūrimo laiškas.",
      })
    }

    const user = users[0]

    // 2. Sugeneruojam tokeną (tinka tavo varchar(10))
    const token = crypto.randomBytes(16).toString("hex").slice(0, 10)

    // 3. Deaktivuojam senus tokenus šitam useriui (nebūtina, bet tvarkinga)
    await db.query(
      `UPDATE Slaptazodzio_atkurimas
       SET panaudotas = 1
       WHERE fk_id_vartotojas = ?`,
      [user.id_vartotojas],
    )

    // 4. Įrašom naują tokeną su galiojimo laiku, pvz. 1 valanda
    await db.query(
      `INSERT INTO Slaptazodzio_atkurimas
        (fk_id_vartotojas, tokenas, sukurimo_data, galiojimo_trukme, panaudotas)
       VALUES (?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 1 HOUR), 0)`,
      [user.id_vartotojas, token],
    )

    // 5. Sudėliojam nuorodą į frontendą
    const resetLink = `${FRONTEND_URL}/reset-password?token=${encodeURIComponent(
      token,
    )}`

    // 6. Siunčiam laišką
    await transporter.sendMail({
      to: user.el_pastas,
      from: process.env.MAIL_FROM || "no-reply@skolos.local",
      subject: "Slaptažodžio atkūrimas",
      text: `Sveiki, ${user.vardas},

Gavome prašymą atkurti jūsų slaptažodį.

Norėdami nustatyti naują slaptažodį, paspauskite šią nuorodą:
${resetLink}

Jei šio prašymo nesiuntėte jūs, tiesiog ignoruokite šį laišką.`,
      html: `
        <p>Sveiki, ${user.vardas},</p>
        <p>Gavome prašymą atkurti jūsų slaptažodį.</p>
        <p>Norėdami nustatyti naują slaptažodį, paspauskite šią nuorodą:</p>
        <p><a href="${resetLink}">${resetLink}</a></p>
        <p>Jei šio prašymo nesiuntėte jūs, tiesiog ignoruokite šį laišką.</p>
      `,
    })

    return res.json({
      message:
        "Jeigu toks el. paštas egzistuoja sistemoje, buvo išsiųstas slaptažodžio atkūrimo laiškas.",
    })
  } catch (err) {
    console.error("Password forgot error:", err)
    return res
      .status(500)
      .json({ message: "Serverio klaida generuojant atkūrimo nuorodą" })
  }
})

router.post("/api/password/reset", async (req, res) => {
  try {
    const { token, newPassword } = req.body

    if (!token || !newPassword) {
      return res
        .status(400)
        .json({ message: "Trūksta tokeno arba naujo slaptažodžio" })
    }

    // 1. Surandam tokeną lentelėje
    const [rows] = await db.query(
      `SELECT 
         id_slaptazodzio_atkurimas,
         fk_id_vartotojas,
         galiojimo_trukme,
         panaudotas
       FROM Slaptazodzio_atkurimas
       WHERE tokenas = ?`,
      [token],
    )

    if (!rows || rows.length === 0) {
      return res.status(400).json({ message: "Neteisingas arba pasenęs tokenas" })
    }

    const rec = rows[0]

    if (rec.panaudotas) {
      return res.status(400).json({ message: "Šis tokenas jau panaudotas" })
    }

    const now = new Date()
    const expiresAt = rec.galiojimo_trukme // mysql2 grąžins Date objektą
    if (expiresAt < now) {
      return res.status(400).json({ message: "Tokeno galiojimo laikas pasibaigė" })
    }

    // 2. Atnaujinam slaptažodį vartotojui
    const newHash = hashPassword(newPassword)

    await db.query(
      `UPDATE Vartotojai
       SET slaptazodis_hash = ?
       WHERE id_vartotojas = ?`,
      [newHash, rec.fk_id_vartotojas],
    )

    // 3. Pažymim tokeną kaip panaudotą
    await db.query(
      `UPDATE Slaptazodzio_atkurimas
       SET panaudotas = 1
       WHERE id_slaptazodzio_atkurimas = ?`,
      [rec.id_slaptazodzio_atkurimas],
    )

    return res.json({ message: "Slaptažodis sėkmingai pakeistas" })
  } catch (err) {
    console.error("Password reset error:", err)
    return res
      .status(500)
      .json({ message: "Serverio klaida atkuriant slaptažodį" })
  }
})

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "..", "uploads", "avatars"))
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname) // .png, .jpg
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9)
    cb(null, unique + ext)
  },
})

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Leidžiami tik paveikslėliai"))
    }
    cb(null, true)
  },
})

// 🔹 Avatar upload: POST /api/profile/avatar
router.post("/api/profile/avatar", upload.single("avatar"), async (req, res) => {
  try {
    const userId = req.header("x-user-id")
    if (!userId) {
      return res.status(401).json({ message: "Nerastas vartotojo ID (x-user-id)" })
    }

    if (!req.file) {
      return res.status(400).json({ message: "Failas negautas" })
    }

    // Kelias, kuriuo frontend pasieks avatarą
    const avatarUrl = `/uploads/avatars/${req.file.filename}`

    // Atnaujinam DB
    await db.query(
      `UPDATE Vartotojai
       SET avatar_url = ?
       WHERE id_vartotojas = ?`,
      [avatarUrl, userId],
    )

    // Grąžinam pilną userį
    const [rows] = await db.query(
      `SELECT
         id_vartotojas,
         vardas,
         pavarde,
         el_pastas,
         valiutos_kodas,
         sukurimo_data,
         paskutinis_prisijungimas,
         avatar_url
       FROM Vartotojai
       WHERE id_vartotojas = ?`,
      [userId],
    )

    const user = rows[0]

    res.json({ user })
  } catch (err) {
    console.error("Avatar upload error:", err)
    res.status(500).json({ message: "Klaida keliant avatarą" })
  }
})

// SMTP nustatymai (pvz. Gmail, Mailtrap ir pan.)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // true jei 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

module.exports = router
