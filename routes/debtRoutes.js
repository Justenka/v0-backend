// routes/debtRoutes.js
const express = require('express');
const db = require('../db');

const router = express.Router();

// ... čia pridėk maršrutus susijusius su skolomis ...
// routes/debtRoutes.js – NAUJAS ir PAGRINDINIS route'as
router.get('/api/groups/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Grupės info
    const [groupRows] = await db.query(
      `SELECT g.*, v.vardas AS owner_vardas, v.pavarde AS owner_pavarde
       FROM Grupes g
       JOIN Vartotojai v ON g.fk_id_vartotojas = v.id_vartotojas
       WHERE g.id_grupe = ?`, 
      [id]
    );

    if (groupRows.length === 0) {
      return res.status(404).json({ message: "Grupė nerasta" });
    }

    // 2. Nariai
    const [memberRows] = await db.query(
      `SELECT 
         v.id_vartotojas AS id,
         v.vardas AS name,
         v.el_pastas AS email,
         gn.role
       FROM Grupes_nariai gn
       JOIN Vartotojai v ON gn.fk_id_vartotojas = v.id_vartotojas
       WHERE gn.fk_id_grupe = ?`, 
      [id]
    );

    // 3. Visos skolos su kategorijomis ir mokėtoju
    const [debtRows] = await db.query(
      `SELECT 
         s.id_skola AS id,
         s.pavadinimas AS title,
         s.aprasymas AS description,
         s.suma AS amount,
         s.sukurimo_data AS date,
         s.valiutos_kodas,
         s.kategorija AS categoryId,
         k.name AS categoryName,
         v.vardas AS paidByName
       FROM Skolos s
       JOIN Vartotojai v ON s.fk_id_vartotojas = v.id_vartotojas
       LEFT JOIN kategorijos k ON s.kategorija = k.id_kategorija
       WHERE s.fk_id_grupe = ?
       ORDER BY s.sukurimo_data DESC`, 
      [id]
    );

    // 4. Prie kiekvienos skolos pridėti splitType
    const transactions = await Promise.all(
      debtRows.map(async (debt) => {
        const [parts] = await db.query(
          `SELECT procentas, suma, vaidmuo FROM Skolos_dalys WHERE fk_id_skola = ?`,
          [debt.id]
        );

        let splitType = "Lygiai";
        if (parts.length > 0) {
          const hasPercent = parts.some(p => p.procentas > 0);
          const hasCustomAmount = parts.some(p => p.suma > 0 && p.vaidmuo === 1); // 1 = skolininkas?

          if (hasPercent) splitType = "Procentais";
          else if (hasCustomAmount) splitType = "Pagal sumas";
        }

        return {
          id: debt.id,
          title: debt.title,
          description: debt.description || "",
          amount: Number(debt.amount),
          currency: debt.valiutos_kodas === 1 ? "EUR" : debt.valiutos_kodas === 2 ? "USD" : "PLN",
          date: debt.date,
          paidBy: debt.paidByName,
          categoryId: debt.categoryId ? String(debt.categoryId) : null,
          categoryName: debt.categoryName || "Be kategorijos",
          splitType
        };
      })
    );

    res.json({
      ...groupRows[0],
      members: memberRows.map(m => ({
        id: m.id,
        name: m.name,
        email: m.email || `${m.name.toLowerCase()}@example.com`,
        role: m.role === 1 ? "admin" : "member"
      })),
      transactions // svarbiausia!
    });

  } catch (err) {
    console.error('Klaida gaunant grupę su skolomis:', err);
    res.status(500).json({ message: 'Serverio klaida' });
  }
});
// ------------------------------------------
// Gauti skolas grupėje (Skolos)
// ------------------------------------------
router.get('/api/debts-by-group/:groupId', async (req, res) => {
  const { groupId } = req.params;

  try {
    const [rows] = await db.query(
      `SELECT 
         s.id_skola,
         s.pavadinimas,
         s.aprasymas,
         s.suma,
         s.kursas_eurui,
         s.sukurimo_data,
         s.paskutinio_keitimo_data,
         s.terminas,
         s.valiutos_kodas,
         s.skolos_statusas,
         s.kategorija,
         v.vardas AS creator_vardas,
         v.pavarde AS creator_pavarde
       FROM Skolos s
       JOIN Vartotojai v ON s.fk_id_vartotojas = v.id_vartotojas
       WHERE s.fk_id_grupe = ?`,
      [groupId]
    );

    res.json(rows);
  } catch (err) {
    console.error('Get debts by group error:', err);
    res.status(500).json({ message: 'Serverio klaida' });
  }
});

// ------------------------------------------
// (Papildomai) Gauti skolos dalis (participants)
// ------------------------------------------
router.get('/api/debt-parts/:debtId', async (req, res) => {
  const { debtId } = req.params;

  try {
    const [rows] = await db.query(
      `SELECT 
         sd.id_skolos_dalis,
         sd.suma,
         sd.procentas,
         sd.apmoketa,
         sd.delspinigiai,
         sd.vaidmuo,
         v.vardas,
         v.pavarde
       FROM Skolos_dalys sd
       JOIN Vartotojai v ON sd.fk_id_vartotojas = v.id_vartotojas
       WHERE sd.fk_id_skola = ?`,
      [debtId]
    );

    res.json(rows);
  } catch (err) {
    console.error('Get debt parts error:', err);
    res.status(500).json({ message: 'Serverio klaida' });
  }
});

// ------------------------------------------
// Sukurti naują skolą (išlaidą)
// ------------------------------------------
// POST /api/debts – sukuria naują išlaidą (skolą)
router.post('/api/debts', async (req, res) => {
  const {
    groupId,
    title,
    description,
    amount,
    currencyCode = 'EUR',
    paidByUserId,
    categoryId,
    splits = [],
    lateFeeAmount,
    lateFeeAfterDays = 30
  } = req.body;

  if (!groupId || !title || !amount || !paidByUserId || splits.length === 0) {
    return res.status(400).json({ message: 'Trūksta privalomų laukų' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const today = new Date().toISOString().slice(0, 10);
    const termDate = new Date();
    termDate.setDate(termDate.getDate() + lateFeeAfterDays);
    const termDateStr = termDate.toISOString().slice(0, 10);

    // --- PATIKIMAS VALIUTOS NUSTATYMAS ---
    let valiutos_kodas = 1; // default EUR

    if (currencyCode) {
      const code = currencyCode.trim().toUpperCase();
      const currencyMap = { 'EUR': 1, 'USD': 2, 'PLN': 3 };
      
      if (currencyMap[code]) {
        valiutos_kodas = currencyMap[code];
      } else {
        try {
          const [rows] = await connection.query(
            `SELECT id_valiuta FROM valiutos WHERE UPPER(name) = ? LIMIT 1`,
            [code]
          );
          if (rows.length > 0) {
            valiutos_kodas = rows[0].id_valiuta;
          } else {
            console.log(`Valiuta nerasta: ${code}, naudojamas default EUR (1)`);
            valiutos_kodas = 1;
          }
        } catch (e) {
          console.error('Klaida ieškant valiutos:', e);
          valiutos_kodas = 1;
        }
      }
    }

    console.log('Naudojamas valiutos_kodas:', valiutos_kodas);

    // *** FIX: Konvertuojame categoryId į skaičių arba null ***
    let kategorijaId = null;
    if (categoryId) {
      const parsed = parseInt(categoryId, 10);
      if (!isNaN(parsed)) {
        // Patikriname, ar tokia kategorija egzistuoja
        const [catRows] = await connection.query(
          `SELECT id_kategorija FROM kategorijos WHERE id_kategorija = ? LIMIT 1`,
          [parsed]
        );
        if (catRows.length > 0) {
          kategorijaId = parsed;
        } else {
          console.warn(`Kategorija su ID ${parsed} nerasta, naudojamas NULL`);
        }
      }
    }

    // 1. Sukuriame skolą
    const [debtResult] = await connection.query(
      `INSERT INTO Skolos 
        (fk_id_grupe, fk_id_vartotojas, pavadinimas, aprasymas, suma, kursas_eurui,
         sukurimo_data, paskutinio_keitimo_data, terminas, valiutos_kodas,
         skolos_statusas, kategorija)
       VALUES (?, ?, ?, ?, ?, 1.0000, ?, ?, ?, ?, 1, ?)`,
      [
        groupId,
        paidByUserId,
        title,
        description || null,
        amount,
        today,
        today,
        termDateStr,
        valiutos_kodas,
        kategorijaId
      ]
    );

    const debtId = debtResult.insertId;

    // 2. Sukuriame skolos dalis - su procentų konvertavimu į sumą
    for (const split of splits) {
      const role = Number(split.userId) === Number(paidByUserId) ? 2 : 1;
      
      // *** NAUJAS LOGIKA: Apskaičiuojame sumą pagal procentus ***
      let splitAmount = split.amount || 0;
      let splitPercentage = split.percentage || 0;
      
      // Jei pateiktas procentas bet nėra sumos, apskaičiuojame sumą
      if (splitPercentage > 0 && splitAmount === 0) {
        splitAmount = (amount * splitPercentage) / 100;
        console.log(`Apskaičiuota suma iš ${splitPercentage}%: ${splitAmount}`);
      }
      // Jei pateikta suma bet nėra procento, apskaičiuojame procentą
      else if (splitAmount > 0 && splitPercentage === 0) {
        splitPercentage = (splitAmount / amount) * 100;
        console.log(`Apskaičiuotas procentas iš ${splitAmount}: ${splitPercentage}%`);
      }
      
      await connection.query(
        `INSERT INTO Skolos_dalys 
          (fk_id_skola, fk_id_vartotojas, suma, procentas, apmoketa, delspinigiai, vaidmuo)
         VALUES (?, ?, ?, ?, 0, ?, ?)`,
        [
          debtId,
          split.userId,
          splitAmount,
          splitPercentage,
          lateFeeAmount > 0 ? 1 : 0,
          role
        ]
      );
    }

    await connection.commit();
    res.status(201).json({ message: 'Išlaida sėkmingai pridėta!', debtId });
  } catch (err) {
    await connection.rollback();
    console.error('Klaida kuriant skolą:', err);
    res.status(500).json({ message: err.sqlMessage || 'Serverio klaida' });
  } finally {
    connection.release();
  }
});
// Kategorijų maršrutai (globalūs, be fk_id_grupe)
router.get('/api/categories', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
         k.id_kategorija AS id_kategorija,
         k.name AS name
       FROM kategorijos k
       ORDER BY k.name ASC`  // NAUJAS: pritaikyta prie DB (name vietoj pavadinimas, be aprasas/fk_id_grupe)
    );

    res.json(rows.map(row => ({
      id: row.id_kategorija,
      name: row.name
    })));  // NAUJAS: map'inam į frontend tipą
  } catch (err) {
    console.error('Get categories error:', err);
    res.status(500).json({ message: 'Serverio klaida' });
  }
});

// Gauti kategorijas pagal grupę – pakeičiam į globalų, nes nėra fk_id_grupe (grąžina visas)
router.get('/api/categories-by-group/:groupId', async (req, res) => {
  // const { groupId } = req.params;  // NAUJAS: nekreipiam dėmesio į groupId, nes globalu

  try {
    const [rows] = await db.query(
      `SELECT 
         k.id_kategorija AS id_kategorija,
         k.name AS name
       FROM kategorijos k
       ORDER BY k.name ASC`  // NAUJAS: be WHERE, globalu
    );

    res.json(rows.map(row => ({
      id: row.id_kategorija,
      name: row.name
    })));
  } catch (err) {
    console.error('Get categories by group error:', err);
    res.status(500).json({ message: 'Serverio klaida' });
  }
});

// ------------------------------------------
// Ištrinti skolą (išlaidą)
// ------------------------------------------
router.delete('/api/debts/:debtId', async (req, res) => {
  const { debtId } = req.params;
  
  // Gauname userId iš užklausos - galite naudoti authMiddleware arba siųsti per body/header
  // Šiuo atveju tikriname per header'į arba query parametrą
  const userId = req.headers['x-user-id'] || req.query.userId;

  if (!userId) {
    return res.status(401).json({ message: 'Neautorizuotas - userId nėra' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Gauname skolos info + kas mokėjo + grupę
    const [debtRows] = await connection.query(
      `SELECT s.fk_id_vartotojas AS paidById, s.fk_id_grupe AS groupId
       FROM Skolos s
       WHERE s.id_skola = ?`,
      [debtId]
    );

    if (debtRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Skola nerasta' });
    }

    const { paidById, groupId } = debtRows[0];

    // 2. Patikriname ar vartotojas yra adminas grupėje
    const [adminRows] = await connection.query(
      `SELECT role FROM Grupes_nariai 
       WHERE fk_id_grupe = ? AND fk_id_vartotojas = ?`,
      [groupId, userId]
    );

    const isAdmin = adminRows.length > 0 && adminRows[0].role === 1; // 1 = admin
    const isPayer = Number(paidById) === Number(userId);

    if (!isAdmin && !isPayer) {
      await connection.rollback();
      return res.status(403).json({ message: 'Neturite teisės ištrinti šios išlaidos' });
    }

    // 3. Triname susijusias dalis ir pačią skolą
    await connection.query(`DELETE FROM Skolos_dalys WHERE fk_id_skola = ?`, [debtId]);
    await connection.query(`DELETE FROM Skolos WHERE id_skola = ?`, [debtId]);

    await connection.commit();
    res.json({ message: 'Išlaida sėkmingai ištrinta' });
  } catch (err) {
    await connection.rollback();
    console.error('Klaida trinant skolą:', err);
    res.status(500).json({ message: 'Serverio klaida' });
  } finally {
    connection.release();
  }
});

//-----------------------------------------------------------------------------------------------------------------------------------

// ------------------------------------------
// GET specific debt with all parts/splits
// ------------------------------------------
router.get('/api/debts/:debtId', async (req, res) => {
  const { debtId } = req.params;

  try {
    // 1. Get debt info
    const [debtRows] = await db.query(
      `SELECT 
         s.id_skola AS id,
         s.pavadinimas AS title,
         s.aprasymas AS description,
         s.suma AS amount,
         s.sukurimo_data AS date,
         s.valiutos_kodas,
         s.kategorija AS categoryId,
         s.fk_id_vartotojas AS paidByUserId,
         v.vardas AS paidByName,
         k.name AS categoryName
       FROM Skolos s
       JOIN Vartotojai v ON s.fk_id_vartotojas = v.id_vartotojas
       LEFT JOIN kategorijos k ON s.kategorija = k.id_kategorija
       WHERE s.id_skola = ?`,
      [debtId]
    );

    if (debtRows.length === 0) {
      return res.status(404).json({ message: 'Skola nerasta' });
    }

    // 2. Get all parts (splits)
    const [parts] = await db.query(
      `SELECT 
         sd.id_skolos_dalis AS id,
         sd.fk_id_vartotojas AS userId,
         v.vardas AS userName,
         sd.suma AS amount,
         sd.procentas AS percentage,
         sd.vaidmuo AS role,
         sd.apmoketa AS paid
       FROM Skolos_dalys sd
       JOIN Vartotojai v ON sd.fk_id_vartotojas = v.id_vartotojas
       WHERE sd.fk_id_skola = ?`,
      [debtId]
    );

    const debt = debtRows[0];
    const currency = debt.valiutos_kodas === 1 ? "EUR" : debt.valiutos_kodas === 2 ? "USD" : "PLN";

    res.json({
      ...debt,
      currency,
      splits: parts.map(p => ({
        id: p.id,
        userId: p.userId,
        userName: p.userName,
        amount: Number(p.amount),
        percentage: Number(p.percentage),
        role: p.role,
        paid: p.paid === 1
      }))
    });
  } catch (err) {
    console.error('Get debt error:', err);
    res.status(500).json({ message: 'Serverio klaida' });
  }
});

// ------------------------------------------
// UPDATE debt (edit transaction)
// ------------------------------------------
router.put('/api/debts/:debtId', async (req, res) => {
  const { debtId } = req.params;
  const {
    title,
    description,
    amount,
    currencyCode,
    categoryId,
    splits = [],
    userId // for authorization
  } = req.body;

  if (!userId) {
    return res.status(401).json({ message: 'Neautorizuotas' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Check if user has permission (is payer or admin)
    const [debtRows] = await connection.query(
      `SELECT s.fk_id_vartotojas AS paidById, s.fk_id_grupe AS groupId
       FROM Skolos s
       WHERE s.id_skola = ?`,
      [debtId]
    );

    if (debtRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Skola nerasta' });
    }

    const { paidById, groupId } = debtRows[0];

    // Check if admin in group
    const [adminRows] = await connection.query(
      `SELECT role FROM Grupes_nariai 
       WHERE fk_id_grupe = ? AND fk_id_vartotojas = ?`,
      [groupId, userId]
    );

    const isAdmin = adminRows.length > 0 && adminRows[0].role === 1;
    const isPayer = Number(paidById) === Number(userId);

    if (!isAdmin && !isPayer) {
      await connection.rollback();
      return res.status(403).json({ message: 'Neturite teisės redaguoti šios išlaidos' });
    }

    // 2. Get currency code
    let valiutos_kodas = 1;
    if (currencyCode) {
      const code = currencyCode.trim().toUpperCase();
      const currencyMap = { 'EUR': 1, 'USD': 2, 'PLN': 3 };
      valiutos_kodas = currencyMap[code] || 1;
    }

    // 3. Parse category
    let kategorijaId = null;
    if (categoryId) {
      const parsed = parseInt(categoryId, 10);
      if (!isNaN(parsed)) {
        const [catRows] = await connection.query(
          `SELECT id_kategorija FROM kategorijos WHERE id_kategorija = ? LIMIT 1`,
          [parsed]
        );
        if (catRows.length > 0) {
          kategorijaId = parsed;
        }
      }
    }

    // 4. Update debt
    const today = new Date().toISOString().slice(0, 10);
    await connection.query(
      `UPDATE Skolos 
       SET pavadinimas = ?, 
           aprasymas = ?, 
           suma = ?, 
           valiutos_kodas = ?,
           kategorija = ?,
           paskutinio_keitimo_data = ?
       WHERE id_skola = ?`,
      [title, description || null, amount, valiutos_kodas, kategorijaId, today, debtId]
    );

    // 5. Update splits if provided
    if (splits.length > 0) {
      // Delete old splits
      await connection.query(`DELETE FROM Skolos_dalys WHERE fk_id_skola = ?`, [debtId]);

      // Insert new splits
      for (const split of splits) {
        const role = Number(split.userId) === Number(paidById) ? 2 : 1;
        
        let splitAmount = split.amount || 0;
        let splitPercentage = split.percentage || 0;
        
        if (splitPercentage > 0 && splitAmount === 0) {
          splitAmount = (amount * splitPercentage) / 100;
        } else if (splitAmount > 0 && splitPercentage === 0) {
          splitPercentage = (splitAmount / amount) * 100;
        }
        
        await connection.query(
          `INSERT INTO Skolos_dalys 
            (fk_id_skola, fk_id_vartotojas, suma, procentas, apmoketa, delspinigiai, vaidmuo)
           VALUES (?, ?, ?, ?, 0, 0, ?)`,
          [debtId, split.userId, splitAmount, splitPercentage, role]
        );
      }
    }

    await connection.commit();
    res.json({ message: 'Išlaida atnaujinta', debtId });
  } catch (err) {
    await connection.rollback();
    console.error('Klaida atnaujinant skolą:', err);
    res.status(500).json({ message: err.sqlMessage || 'Serverio klaida' });
  } finally {
    connection.release();
  }
});

// ------------------------------------------
// GET balances for a specific user in a group
// Shows: who owes current user, who current user owes
// ------------------------------------------
router.get('/api/groups/:groupId/balances/:userId', async (req, res) => {
  const { groupId, userId } = req.params;

  try {
    // Get all unpaid debts where userId is involved
    const [debts] = await db.query(
      `SELECT 
         s.id_skola,
         s.suma AS totalAmount,
         s.valiutos_kodas,
         s.fk_id_vartotojas AS payerId,
         payer.vardas AS payerName
       FROM Skolos s
       JOIN Vartotojai payer ON s.fk_id_vartotojas = payer.id_vartotojas
       WHERE s.fk_id_grupe = ? AND s.skolos_statusas = 1`,
      [groupId]
    );

    const balances = {};

    for (const debt of debts) {
      // Get parts for this debt
      const [parts] = await db.query(
        `SELECT 
           sd.fk_id_vartotojas AS userId,
           v.vardas AS userName,
           sd.suma AS amount,
           sd.apmoketa AS paid,
           sd.vaidmuo AS role
         FROM Skolos_dalys sd
         JOIN Vartotojai v ON sd.fk_id_vartotojas = v.id_vartotojas
         WHERE sd.fk_id_skola = ?`,
        [debt.id_skola]
      );

      const currency = debt.valiutos_kodas === 1 ? "EUR" : debt.valiutos_kodas === 2 ? "USD" : "PLN";

      // Calculate balances
      for (const part of parts) {
        if (part.paid === 1) continue; // Skip paid parts

        const partUserId = part.userId;
        const partAmount = Number(part.amount);

        // If current user paid and someone else owes
        if (Number(debt.payerId) === Number(userId) && partUserId !== Number(userId)) {
          const key = `${partUserId}`;
          if (!balances[key]) {
            balances[key] = {
              userId: partUserId,
              userName: part.userName,
              amount: 0,
              currency,
              type: 'owes_me' // they owe current user
            };
          }
          balances[key].amount += partAmount;
        }
        // If current user owes someone else
        else if (partUserId === Number(userId) && Number(debt.payerId) !== Number(userId)) {
          const key = `${debt.payerId}`;
          if (!balances[key]) {
            balances[key] = {
              userId: debt.payerId,
              userName: debt.payerName,
              amount: 0,
              currency,
              type: 'i_owe' // current user owes them
            };
          }
          balances[key].amount += partAmount;
        }
      }
    }

    res.json(Object.values(balances));
  } catch (err) {
    console.error('Get balances error:', err);
    res.status(500).json({ message: 'Serverio klaida' });
  }
});

// ------------------------------------------
// POST partial payment (Grąžinti)
// ------------------------------------------
router.post('/api/payments', async (req, res) => {
  const {
    groupId,
    fromUserId,
    toUserId,
    amount,
    currencyCode = 'EUR',
    note
  } = req.body;

  if (!groupId || !fromUserId || !toUserId || !amount) {
    return res.status(400).json({ message: 'Trūksta privalomų laukų' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Get currency code
    let valiutos_kodas = 1;
    if (currencyCode) {
      const code = currencyCode.trim().toUpperCase();
      const currencyMap = { 'EUR': 1, 'USD': 2, 'PLN': 3 };
      valiutos_kodas = currencyMap[code] || 1;
    }

    const today = new Date().toISOString().slice(0, 10);

    // Insert payment record
    const [result] = await connection.query(
      `INSERT INTO Mokejimai 
        (fk_id_skolos_dalis, fk_id_vartotojas, data, suma, kursas_eurui)
       VALUES (NULL, ?, ?, ?, 1.0000)`,
      [fromUserId, today, amount]
    );

    // Find and update relevant debt parts
    // Get unpaid debts where fromUserId owes toUserId
    const [parts] = await connection.query(
      `SELECT sd.id_skolos_dalis, sd.suma, sd.fk_id_skola
       FROM Skolos_dalys sd
       JOIN Skolos s ON sd.fk_id_skola = s.id_skola
       WHERE s.fk_id_grupe = ?
         AND s.fk_id_vartotojas = ?
         AND sd.fk_id_vartotojas = ?
         AND sd.apmoketa = 0
         AND s.skolos_statusas = 1
       ORDER BY s.sukurimo_data ASC`,
      [groupId, toUserId, fromUserId]
    );

    let remainingAmount = amount;

    for (const part of parts) {
      if (remainingAmount <= 0) break;

      const partAmount = Number(part.suma);

      if (remainingAmount >= partAmount) {
        // Mark as fully paid
        await connection.query(
          `UPDATE Skolos_dalys SET apmoketa = 1 WHERE id_skolos_dalis = ?`,
          [part.id_skolos_dalis]
        );
        remainingAmount -= partAmount;
      } else {
        // Partial payment - reduce the amount
        const newAmount = partAmount - remainingAmount;
        await connection.query(
          `UPDATE Skolos_dalys SET suma = ? WHERE id_skolos_dalis = ?`,
          [newAmount, part.id_skolos_dalis]
        );
        remainingAmount = 0;
      }
    }

    await connection.commit();
    res.status(201).json({ 
      message: 'Mokėjimas užregistruotas',
      paymentId: result.insertId 
    });
  } catch (err) {
    await connection.rollback();
    console.error('Klaida kuriant mokėjimą:', err);
    res.status(500).json({ message: err.sqlMessage || 'Serverio klaida' });
  } finally {
    connection.release();
  }
});

// ------------------------------------------
// GET payment history for a group
// ------------------------------------------
router.get('/api/groups/:groupId/payments', async (req, res) => {
  const { groupId } = req.params;

  try {
    const [rows] = await db.query(
      `SELECT 
         m.id_mokejimas AS id,
         m.fk_id_vartotojas AS fromUserId,
         fromUser.vardas AS fromUserName,
         m.suma AS amount,
         m.data AS date,
         m.kursas_eurui,
         sd.fk_id_skola AS debtId,
         s.fk_id_vartotojas AS toUserId,
         toUser.vardas AS toUserName,
         s.valiutos_kodas
       FROM Mokejimai m
       JOIN Vartotojai fromUser ON m.fk_id_vartotojas = fromUser.id_vartotojas
       LEFT JOIN Skolos_dalys sd ON m.fk_id_skolos_dalis = sd.id_skolos_dalis
       LEFT JOIN Skolos s ON sd.fk_id_skola = s.id_skola
       LEFT JOIN Vartotojai toUser ON s.fk_id_vartotojas = toUser.id_vartotojas
       WHERE s.fk_id_grupe = ?
       ORDER BY m.data DESC`,
      [groupId]
    );

    const payments = rows.map(row => ({
      id: row.id,
      fromUserId: row.fromUserId,
      fromUserName: row.fromUserName,
      toUserId: row.toUserId,
      toUserName: row.toUserName,
      amount: Number(row.amount),
      currency: row.valiutos_kodas === 1 ? "EUR" : row.valiutos_kodas === 2 ? "USD" : "PLN",
      date: row.date
    }));

    res.json(payments);
  } catch (err) {
    console.error('Get payments error:', err);
    res.status(500).json({ message: 'Serverio klaida' });
  }
});


module.exports = router;