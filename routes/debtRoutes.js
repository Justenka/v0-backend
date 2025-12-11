// routes/debtRoutes.js
const express = require('express');
const db = require('../db');
const { addGroupHistoryEntry } = require('../lib/groupHistory');

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

    // 3. Apskaičiuojame balansą kiekvienam nariui
    const membersWithBalance = await Promise.all(
      memberRows.map(async (member) => {
        // Gauti visas skolos dalis šiam nariui šioje grupėje
        const [parts] = await db.query(
          `SELECT 
             sd.suma,
             sd.sumoketa,
             sd.vaidmuo,
             s.fk_id_vartotojas AS payerId
           FROM Skolos_dalys sd
           JOIN Skolos s ON sd.fk_id_skola = s.id_skola
           WHERE s.fk_id_grupe = ? 
             AND sd.fk_id_vartotojas = ?
             AND s.skolos_statusas = 1`,
          [id, member.id]
        );

        let balance = 0;

        for (const part of parts) {
          const suma = Number(part.suma);
          const sumoketa = Number(part.sumoketa);
          const remainingDebt = suma - sumoketa;

          if (part.vaidmuo === 1) {
            // Skolininkas - neigiamas balansas (skolingas kitiems)
            balance -= remainingDebt;
          } else if (part.vaidmuo === 2) {
            // Kreditorius - teigiamas balansas (kiti jam skolingi)
            // Reikia suskaičiuoti, kiek jam skolingi kiti
            const [otherParts] = await db.query(
              `SELECT suma, sumoketa 
               FROM Skolos_dalys 
               WHERE fk_id_skola = (
                 SELECT fk_id_skola 
                 FROM Skolos_dalys 
                 WHERE id_skolos_dalis IN (
                   SELECT id_skolos_dalis 
                   FROM Skolos_dalys 
                   WHERE fk_id_vartotojas = ? 
                     AND vaidmuo = 2
                 )
               ) AND vaidmuo = 1`,
              [member.id]
            );

            for (const op of otherParts) {
              const opSuma = Number(op.suma);
              const opSumoketa = Number(op.sumoketa);
              balance += (opSuma - opSumoketa);
            }
          }
        }

        return {
          id: member.id,
          name: member.name,
          email: member.email || `${member.name.toLowerCase()}@example.com`,
          role: member.role === 1 ? "admin" : "member",
          balance: balance || 0 // Ensure it's 0 instead of null/undefined
        };
      })
    );

    // 4. Visos skolos su kategorijomis ir mokėtoju
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

    // 5. Prie kiekvienos skolos pridėti splitType
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
      members: membersWithBalance,
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

  const actorRaw = req.header("x-user-id");
  const actorId = actorRaw && !Number.isNaN(Number(actorRaw)) ? Number(actorRaw) : null;

  const connection = await db.getConnection();
  try {
        // NAUJAS PATIKRINIMAS - ar jau yra skola su tokiu pavadinimu
    const [existingDebts] = await connection.query(
      `SELECT id_skola, pavadinimas 
       FROM Skolos 
       WHERE fk_id_grupe = ? AND pavadinimas = ? AND (skolos_statusas = 1 OR skolos_statusas = 2)
       LIMIT 1`,
      [groupId, title.trim()]
    );

    if (existingDebts.length > 0) {
      return res.status(409).json({ 
        message: `Išlaida su pavadinimu "${title}" jau egzistuoja šioje grupėje` 
      });
    }

    await connection.beginTransaction();

    const today = new Date().toISOString().slice(0, 10);
    const termDate = new Date();
    termDate.setDate(termDate.getDate() + lateFeeAfterDays);
    const termDateStr = termDate.toISOString().slice(0, 10);

    // --- PATIKIMAS VALIUTOS NUSTATYMAS ---
    let valiutos_kodas = 1; // default EUR
    let valiutosSantykis = 1.0; // EUR santykis

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

    // Gauname valiutos santykį iš lentelės
    try {
      const [valiutaRows] = await connection.query(
        `SELECT santykis FROM valiutos WHERE id_valiuta = ? LIMIT 1`,
        [valiutos_kodas]
      );
      
      if (valiutaRows.length > 0) {
        valiutosSantykis = parseFloat(valiutaRows[0].santykis);
        console.log(`Valiutos ${valiutos_kodas} santykis: ${valiutosSantykis}`);
      }
    } catch (e) {
      console.error('Klaida gaunant valiutos santykį:', e);
      // Naudojame default 1.0 jei įvyko klaida
    }

    // --- KONVERTUOJAME SUMĄ Į EURUS ---
    const originalAmount = parseFloat(amount);
    const amountInEUR = originalAmount;
    
    console.log(`Originali suma: ${originalAmount} (valiuta: ${valiutos_kodas})`);
    console.log(`Suma eurais: ${amountInEUR}`);
    console.log(`Santykis naudotas: ${valiutosSantykis}`);

    // Kategorijos apdorojimas
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
        } else {
          console.warn(`Kategorija su ID ${parsed} nerasta, naudojamas NULL`);
        }
      }
    }

    // 1. Sukuriame skolą - įrašome sumą EURAIS, bet išsaugome originalią valiutą
    const [debtResult] = await connection.query(
      `INSERT INTO Skolos 
        (fk_id_grupe, fk_id_vartotojas, pavadinimas, aprasymas, suma, kursas_eurui,
         sukurimo_data, paskutinio_keitimo_data, terminas, valiutos_kodas,
         skolos_statusas, kategorija)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
      [
        groupId,
        paidByUserId,
        title,
        description || null,
        amountInEUR, // KONVERTUOTA SUMA EURAIS
        valiutosSantykis, // Išsaugome panaudotą kursą
        today,
        today,
        termDateStr,
        valiutos_kodas, // Originalios valiutos kodas
        kategorijaId
      ]
    );

    const debtId = debtResult.insertId;

    // 2. Sukuriame skolos dalis - SVARBU: dalis taip pat konvertuojame į eurus
    for (const split of splits) {
      const role = Number(split.userId) === Number(paidByUserId) ? 2 : 1;

      // *** NAUJAS LOGIKA: Apskaičiuojame sumą pagal procentus ***
      
      let splitAmount = split.amount || 0;
      let splitPercentage = split.percentage || 0;

      // Jei pateiktas procentas bet nėra sumos, apskaičiuojame sumą
      if (splitPercentage > 0 && splitAmount === 0) {
        splitAmount = (originalAmount * splitPercentage) / 100;
        console.log(`Apskaičiuota suma iš ${splitPercentage}%: ${splitAmount}`);
      }
      // Jei pateikta suma bet nėra procento, apskaičiuojame procentą
      else if (splitAmount > 0 && splitPercentage === 0) {
        splitPercentage = (splitAmount / originalAmount) * 100;
        console.log(`Apskaičiuotas procentas iš ${splitAmount}: ${splitPercentage}%`);
      }

      // *** FIX: If vaidmuo is 2, mark as paid and set sumoketa = suma ***
      const apmoketa = role === 2 ? 1 : 0;
      const sumoketa = role === 2 ? splitAmount : 0;

      
      // KONVERTUOJAME SPLIT SUMĄ Į EURUS
      const splitAmountInEUR = splitAmount / valiutosSantykis;
      
      await connection.query(
        `INSERT INTO Skolos_dalys 
          (fk_id_skola, fk_id_vartotojas, suma, procentas, apmoketa, sumoketa, delspinigiai, vaidmuo)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          debtId,
          split.userId,
          splitAmountInEUR, // KONVERTUOTA SUMA EURAIS
          splitPercentage,
          apmoketa,
          sumoketa / valiutosSantykis, // KONVERTUOTA SUMA EURAIS
          lateFeeAmount > 0 ? 1 : 0,  // delspinigiai
          role  // vaidmuo - THIS SHOULD BE 1 or 2, NOT 0
        ]
      );
    }

    await connection.commit();

    const historyUserId = actorId ?? Number(paidByUserId);

    await addGroupHistoryEntry(
      Number(groupId),
      historyUserId,
      "expense_added",
      `Išlaida "${title}" pridėta (${originalAmount} ${currencyCode}).`,
      {
        debtId,
        amount: originalAmount,
        currencyCode,
        paidByUserId: Number(paidByUserId),
        createdByUserId: historyUserId,
      }
    );

    // Pranešimai grupės nariams apie naują išlaidą
    try {
      const groupIdNum = Number(groupId);

      // 1) Pasiimam grupės pavadinimą
      const [groupRows] = await db.query(
        `SELECT pavadinimas 
        FROM Grupes 
        WHERE id_grupe = ?`,
        [groupIdNum]
      );
      const groupName = groupRows[0]?.pavadinimas ?? "grupė";

      // 2) Pasiimam, kas sukūrė išlaidą (vardas + pavardė)
      const [actorRows] = await db.query(
        `SELECT vardas, pavarde 
        FROM Vartotojai 
        WHERE id_vartotojas = ?`,
        [historyUserId]
      );
      const creatorName = actorRows.length
        ? `${actorRows[0].vardas} ${actorRows[0].pavarde}`.trim()
        : "Vartotojas";

      // 3) Visi grupės nariai + jų naujos_islaidos nustatymai
      const [memberRows] = await db.query(
        `
        SELECT 
          v.id_vartotojas,
          v.vardas,
          v.pavarde,
          COALESCE(pn.naujos_islaidos, 1) AS naujos_islaidos
        FROM Grupes_nariai gn
        JOIN Vartotojai v ON v.id_vartotojas = gn.fk_id_vartotojas
        LEFT JOIN Pranesimu_nustatymai pn
          ON pn.fk_id_vartotojas = v.id_vartotojas
        WHERE gn.fk_id_grupe = ?
        `,
        [groupIdNum]
      );

      for (const m of memberRows) {
        const memberId = m.id_vartotojas;

        // praleidžiam tą, kuris pats pridėjo išlaidą
        if (memberId === historyUserId) continue;

        // jei nustatymuose išjungta – skipinam
        if (!m.naujos_islaidos) continue;

        // 4) Sukuriam pranešimą Pranesimai lentelėje
        await db.query(
          `
          INSERT INTO Pranesimai
            (fk_id_vartotojas, tipas, pavadinimas, tekstas, action_url)
          VALUES (?, 'new_expense', ?, ?, ?)
          `,
          [
            memberId,
            `Nauja išlaida grupėje "${groupName}"`,
            `${creatorName} pridėjo išlaidą „${title}“ (${originalAmount} ${currencyCode}).`,
            `/groups/${groupIdNum}`,
          ]
        );
      }
    } catch (notifErr) {
      console.error("Nepavyko sukurti group_expense pranešimų:", notifErr);
    }

    // *** AUTOMATINIS SKOLŲ IŠLYGINIMAS ***
    console.log(`\n[AUTO-IŠLYGINIMAS] Pradedamas skolų išlyginimas grupėje ${groupId}...`);
    try {
      const { autoSimplifyGroupDebts } = require('./debtSimplification');
      const simplificationResult = await autoSimplifyGroupDebts(groupId);
      console.log('[AUTO-IŠLYGINIMAS] Rezultatas:', simplificationResult);
    } catch (simplifyError) {
      // Jei išlyginimas nepavyko, tik logginam, bet netrukdome pagrindinei operacijai
      console.error('[AUTO-IŠLYGINIMAS] Klaida:', simplifyError);
    }

    res.status(201).json({ 
      message: 'Išlaida sėkmingai pridėta!', 
      debtId,
      originalAmount,
      amountInEUR,
      conversionRate: valiutosSantykis
    });
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

  // userId / actor iš headerio arba query
  const userIdRaw = req.headers['x-user-id'] || req.query.userId;
  if (!userIdRaw) {
    return res.status(401).json({ message: 'Neautorizuotas - userId nėra' });
  }

  const userId = Number(userIdRaw);
  const actorId = !Number.isNaN(userId) ? userId : null;

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Pasiimam skolos info, kad būtų ką įrašyti į istoriją
    const [debtRows] = await connection.query(
      `SELECT 
         s.fk_id_vartotojas AS paidById,
         s.fk_id_grupe   AS groupId,
         s.pavadinimas   AS title,
         s.suma          AS amount,
         s.valiutos_kodas AS valiutos_kodas
       FROM Skolos s
       WHERE s.id_skola = ?`,
      [debtId]
    );

    if (debtRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Skola nerasta' });
    }

    const { paidById, groupId, title, amount, valiutos_kodas } = debtRows[0];

    // 3. Trinam dalis ir pačią skolą
    await connection.query(`DELETE FROM Skolos_dalys WHERE fk_id_skola = ?`, [debtId]);
    await connection.query(`DELETE FROM Skolos WHERE id_skola = ?`, [debtId]);

    await connection.commit();

    // 4. ĮRAŠOM Į ISTORIJĄ (po commit, kad nebūtų deadlockų)
    const historyUserId = actorId ?? Number(paidById);

    const currencyCode =
      valiutos_kodas === 1 ? 'EUR' :
      valiutos_kodas === 2 ? 'USD' :
      valiutos_kodas === 3 ? 'PLN' : 'UNK';

    await addGroupHistoryEntry(
      Number(groupId),
      historyUserId,
      "expense_deleted",
      `Išlaida "${title}" panaikinta (${Number(amount)} ${currencyCode}).`,
      {
        debtId: Number(debtId),
        amount: Number(amount),
        currencyCode,
        paidByUserId: Number(paidById),
        deletedByUserId: historyUserId,
      }
    );

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
        paid: p.role === 2
      }))
    });
  } catch (err) {
    console.error('Get debt error:', err);
    res.status(500).json({ message: 'Serverio klaida' });
  }
});

// ------------------------------------------
// UPDATE debt (edit transaction) + istorija
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
    userId,   // Autentifikuoto vartotojo ID (redaguojantis)
    paidById  // Naujas mokėtojas (jei pakeistas)
  } = req.body;

  if (!userId) {
    return res.status(401).json({ message: 'Neautorizuotas' });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Pasiimam DABARTINĘ skolos info prieš keitimą (istorijai)
        const [debtRows] = await connection.query(
      `SELECT 
         fk_id_vartotojas AS oldPaidById,
         fk_id_grupe      AS groupId,
         pavadinimas      AS oldTitle,
         suma             AS oldAmount,
         valiutos_kodas   AS oldValiutosKodas,
         kategorija       AS oldKategorijaId,
         aprasymas        AS oldDescription
       FROM Skolos
       WHERE id_skola = ?`,
      [debtId]
    );

    if (debtRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Skola nerasta' });
    }

    const {
      oldPaidById,
      groupId,
      oldTitle,
      oldAmount,
      oldValiutosKodas,
      oldKategorijaId,
      oldDescription
    } = debtRows[0];
    
    // NEW: Check for duplicate name if title is being changed
    if (title.trim() !== oldTitle) {
      const [duplicateCheck] = await connection.query(
        `SELECT id_skola 
         FROM Skolos 
         WHERE fk_id_grupe = ? 
         AND LOWER(TRIM(pavadinimas)) = LOWER(TRIM(?))
         AND id_skola != ?
         LIMIT 1`,
        [groupId, title.trim(), debtId]
      );

      if (duplicateCheck.length > 0) {
        await connection.rollback();
        return res.status(400).json({ 
          message: 'Išlaida su tokiu pavadinimu jau egzistuoja šioje grupėje' 
        });
      }
    }

    // 2. VALIUTOS APDOROJIMAS (kaip POST metode)
    let valiutos_kodas = oldValiutosKodas || 1;
    let valiutosSantykis = 1.0;

    if (currencyCode) {
      const code = currencyCode.trim().toUpperCase();
      const currencyMap = { 'EUR': 1, 'USD': 2, 'PLN': 3 };

      if (currencyMap[code]) {
        valiutos_kodas = currencyMap[code];
      } else {
        const [rows] = await connection.query(
          `SELECT id_valiuta FROM valiutos WHERE UPPER(name) = ? LIMIT 1`,
          [code]
        );
        if (rows.length > 0) {
          valiutos_kodas = rows[0].id_valiuta;
        }
      }
    }

    const [vRows] = await connection.query(
      `SELECT santykis FROM valiutos WHERE id_valiuta = ? LIMIT 1`,
      [valiutos_kodas]
    );
    if (vRows.length > 0) {
      valiutosSantykis = parseFloat(vRows[0].santykis);
    }

    // 3. Nauja suma (kol kas kaip ir POST – nenaudojam realios konversijos)
    const originalAmount = parseFloat(amount);
    const amountInEUR = originalAmount;

    // 4. Kategorija
    let kategorijaId = null;
    if (categoryId) {
      const [catRows] = await connection.query(
        `SELECT id_kategorija FROM kategorijos WHERE id_kategorija = ? LIMIT 1`,
        [parseInt(categoryId)]
      );
      if (catRows.length > 0) {
        kategorijaId = parseInt(categoryId);
      }
    }

    const today = new Date().toISOString().slice(0, 10);

    // 5. Atnaujinam SKOLOS įrašą
    const newPaidById = paidById ? Number(paidById) : Number(oldPaidById);

    const updateQuery = paidById
      ? `UPDATE Skolos 
         SET pavadinimas = ?, 
             aprasymas = ?, 
             suma = ?, 
             kursas_eurui = ?, 
             valiutos_kodas = ?,
             kategorija = ?,
             fk_id_vartotojas = ?, 
             paskutinio_keitimo_data = ?
         WHERE id_skola = ?`
      : `UPDATE Skolos 
         SET pavadinimas = ?, 
             aprasymas = ?, 
             suma = ?, 
             kursas_eurui = ?, 
             valiutos_kodas = ?,
             kategorija = ?,
             paskutinio_keitimo_data = ?
         WHERE id_skola = ?`;

    const updateParams = paidById
      ? [
          title,
          description || null,
          amountInEUR,
          valiutosSantykis,
          valiutos_kodas,
          kategorijaId,
          newPaidById,
          today,
          debtId
        ]
      : [
          title,
          description || null,
          amountInEUR,
          valiutosSantykis,
          valiutos_kodas,
          kategorijaId,
          today,
          debtId
        ];

    await connection.query(updateQuery, updateParams);

    // 6. Atnaujinam SKOLOS_DALYS
    if (splits.length > 0) {
      await connection.query(
        `DELETE FROM Skolos_dalys WHERE fk_id_skola = ?`,
        [debtId]
      );

      // Pasiimam dabar esamą fk_id_vartotojas kaip dabartinį mokėtoją
      const [currentDebt] = await connection.query(
        `SELECT fk_id_vartotojas AS paidById FROM Skolos WHERE id_skola = ?`,
        [debtId]
      );
      const currentPaidById =
        currentDebt[0]?.paidById || newPaidById || oldPaidById;

      for (const split of splits) {
        const role =
          Number(split.userId) === Number(currentPaidById) ? 2 : 1;

        let splitAmount = split.amount || 0;
        let splitPercentage = split.percentage || 0;

        if (splitPercentage > 0 && splitAmount === 0) {
          splitAmount = (originalAmount * splitPercentage) / 100;
        } else if (splitAmount > 0 && splitPercentage === 0) {
          splitPercentage = (splitAmount / originalAmount) * 100;
        }

        const apmoketa = role === 2 ? 1 : 0;
        const sumoketa = role === 2 ? splitAmount : 0;
        const splitAmountInEUR = splitAmount / valiutosSantykis;

        await connection.query(
          `INSERT INTO Skolos_dalys 
            (fk_id_skola, fk_id_vartotojas, suma, procentas, apmoketa, sumoketa, delspinigiai, vaidmuo)
           VALUES (?, ?, ?, ?, ?, ?, 0, ?)`,
          [
            debtId,
            split.userId,
            splitAmountInEUR,
            splitPercentage,
            apmoketa,
            sumoketa,
            role
          ]
        );
      }
    }

    await connection.commit();

    // 7. ISTORIJA – po commit

    // senos reikšmės
    // 1) Pasiruošiam valiutas, sumas
    const oldCurrencyCode =
      oldValiutosKodas === 1
        ? "EUR"
        : oldValiutosKodas === 2
        ? "USD"
        : oldValiutosKodas === 3
        ? "PLN"
        : "UNK";

    const newCurrencyCode =
      valiutos_kodas === 1
        ? "EUR"
        : valiutos_kodas === 2
        ? "USD"
        : valiutos_kodas === 3
        ? "PLN"
        : "UNK";

    const safeOldAmount = Number(oldAmount);
    const safeNewAmount = Number(amountInEUR);
    const displayOldTitle = oldTitle || title;

    // 2) Išsitraukiam SENĄ ir NAUJĄ mokėtoją
    let oldPayerName = null;
    let newPayerName = null;

    if (oldPaidById) {
      const [rowsOldPayer] = await connection.query(
        `SELECT vardas, pavarde FROM Vartotojai WHERE id_vartotojas = ?`,
        [oldPaidById]
      );
      if (rowsOldPayer.length > 0) {
        oldPayerName = `${rowsOldPayer[0].vardas} ${rowsOldPayer[0].pavarde}`;
      }
    }

    if (newPaidById) {
      const [rowsNewPayer] = await connection.query(
        `SELECT vardas, pavarde FROM Vartotojai WHERE id_vartotojas = ?`,
        [newPaidById]
      );
      if (rowsNewPayer.length > 0) {
        newPayerName = `${rowsNewPayer[0].vardas} ${rowsNewPayer[0].pavarde}`;
      }
    }

    // 3) Išsitraukiam SENĄ ir NAUJĄ kategorijos pavadinimą
    let oldCategoryName = null;
    let newCategoryName = null;

    if (oldKategorijaId) {
      const [rowsOldCat] = await connection.query(
        `SELECT name FROM kategorijos WHERE id_kategorija = ?`,
        [oldKategorijaId]
      );
      if (rowsOldCat.length > 0) {
        oldCategoryName = rowsOldCat[0].name;
      }
    }

    if (kategorijaId) {
      const [rowsNewCat] = await connection.query(
        `SELECT name FROM kategorijos WHERE id_kategorija = ?`,
        [kategorijaId]
      );
      if (rowsNewCat.length > 0) {
        newCategoryName = rowsNewCat[0].name;
      }
    }

    // 4) Dabar lyginam laukus ir pildom changes
    const changes = [];

    const oldDescriptionSafe = oldDescription ?? null;

    // pavadinimas
    if (oldTitle !== title) {
      changes.push({
        field: "title",
        label: "pavadinimas",
        oldValue: oldTitle,
        newValue: title,
      });
    }

    // suma
    if (!Number.isNaN(safeOldAmount) && safeOldAmount !== safeNewAmount) {
      changes.push({
        field: "amount",
        label: "suma",
        oldValue: `${safeOldAmount} ${oldCurrencyCode}`,
        newValue: `${safeNewAmount} ${newCurrencyCode}`,
      });
    }

    // valiuta (jei keitėsi, bet suma ta pati)
    if (oldCurrencyCode !== newCurrencyCode && safeOldAmount === safeNewAmount) {
      changes.push({
        field: "currency",
        label: "valiuta",
        oldValue: oldCurrencyCode,
        newValue: newCurrencyCode,
      });
    }

    // mokėtojas – NAUJAS: rodome vardus, o ID meta-data
    if (Number(oldPaidById) !== Number(newPaidById)) {
      changes.push({
        field: "paidByUserId",
        label: "mokėtojas",
        oldValue: oldPayerName || `Vartotojas #${oldPaidById}`,
        newValue: newPayerName || `Vartotojas #${newPaidById}`,
        oldId: Number(oldPaidById),
        newId: Number(newPaidById),
      });
    }

    // kategorija – NAUJA: rodom pavadinimus
    if ((oldKategorijaId ?? null) !== (kategorijaId ?? null)) {
      changes.push({
        field: "categoryId",
        label: "kategorija",
        oldValue:
          oldCategoryName ||
          (oldKategorijaId != null ? `Kategorija #${oldKategorijaId}` : null),
        newValue:
          newCategoryName ||
          (kategorijaId != null ? `Kategorija #${kategorijaId}` : null),
        oldId: oldKategorijaId ?? null,
        newId: kategorijaId ?? null,
      });
    }

    // aprašymas
    if ((oldDescriptionSafe || "") !== (description || "")) {
      changes.push({
        field: "description",
        label: "aprašymas",
        oldValue: oldDescriptionSafe,
        newValue: description || null,
      });
    }

    const descriptionText = changes.length
      ? `Išlaida "${displayOldTitle}" atnaujinta (${changes
          .map(
            (c) =>
              `${c.label}: ${c.oldValue ?? "nenurodyta"} → ${
                c.newValue ?? "nenurodyta"
              }`
          )
          .join(", ")}).`
      : `Išlaida "${displayOldTitle}" atnaujinta.`;

    await addGroupHistoryEntry(
      Number(groupId),
      Number(userId),
      "expense_edited",
      descriptionText,
      {
        debtId: Number(debtId),
        editedByUserId: Number(userId),
        changedFields: changes,
      }
    );

    res.json({ message: 'Išlaida atnaujinta', debtId, amountInEUR });
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
    // Get all active debts in the group
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
           sd.sumoketa AS amountPaid,
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
        const partUserId = part.userId;
        const partAmount = Number(part.amount);
        const amountPaid = Number(part.amountPaid);
        const remainingDebt = partAmount - amountPaid;

        // Skip if fully paid or no remaining debt
        if (remainingDebt <= 0) continue;

        // If current user paid and someone else owes (and they haven't fully paid)
        if (Number(debt.payerId) === Number(userId) && partUserId !== Number(userId) && part.role === 1) {
          const key = `${partUserId}`;
          if (!balances[key]) {
            balances[key] = {
              userId: partUserId,
              userName: part.userName,
              amount: 0,
              currency,
              type: 'owes_me'
            };
          }
          balances[key].amount += remainingDebt;
        }
        // If current user owes (they have an unpaid part but didn't pay)
        else if (partUserId === Number(userId) && Number(debt.payerId) !== Number(userId) && part.role === 1) {
          const key = `${debt.payerId}`;
          if (!balances[key]) {
            balances[key] = {
              userId: debt.payerId,
              userName: debt.payerName,
              amount: 0,
              currency,
              type: 'i_owe'
            };
          }
          balances[key].amount += remainingDebt;
        }
      }
    }

    // Filter out zero balances
    const filteredBalances = Object.values(balances).filter(b => b.amount > 0);

    console.log(`Balances for user ${userId} in group ${groupId}:`, filteredBalances);

    res.json(filteredBalances);
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

  // Kas realiai atliko veiksmą (frontend gali siųsti x-user-id)
  const actorRaw = req.header("x-user-id");
  const actorId = actorRaw && !Number.isNaN(Number(actorRaw)) ? Number(actorRaw) : null;

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    let valiutos_kodas = 1;
    if (currencyCode) {
      const code = currencyCode.trim().toUpperCase();
      const currencyMap = { 'EUR': 1, 'USD': 2, 'PLN': 3 };
      valiutos_kodas = currencyMap[code] || 1;
    }

    const today = new Date().toISOString().slice(0, 10);

    // Find unpaid debts where fromUserId owes toUserId
    const [parts] = await connection.query(
      `SELECT sd.id_skolos_dalis, sd.suma, sd.sumoketa, sd.fk_id_skola
       FROM Skolos_dalys sd
       JOIN Skolos s ON sd.fk_id_skola = s.id_skola
       WHERE s.fk_id_grupe = ?
         AND s.fk_id_vartotojas = ?
         AND sd.fk_id_vartotojas = ?
         AND sd.vaidmuo = 1
         AND sd.suma > sd.sumoketa
         AND s.skolos_statusas = 1
       ORDER BY s.sukurimo_data ASC`,
      [groupId, toUserId, fromUserId]
    );

    if (parts.length === 0) {
      await connection.rollback();
      return res.status(400).json({ message: 'Nerasta skolų, kurias galima apmokėti' });
    }

    let remainingAmount = amount;

    for (const part of parts) {
      if (remainingAmount <= 0) break;

      const partAmount = Number(part.suma);
      const alreadyPaid = Number(part.sumoketa);
      const stillOwed = partAmount - alreadyPaid;

      let paymentAmount = 0;

      if (remainingAmount >= stillOwed) {
        // Fully pay this part
        paymentAmount = stillOwed;
        await connection.query(
          `UPDATE Skolos_dalys 
           SET apmoketa = 1, sumoketa = suma 
           WHERE id_skolos_dalis = ?`,
          [part.id_skolos_dalis]
        );
        remainingAmount -= stillOwed;
      } else {
        // Partial payment
        paymentAmount = remainingAmount;
        const newPaidAmount = alreadyPaid + remainingAmount;
        await connection.query(
          `UPDATE Skolos_dalys 
           SET sumoketa = ? 
           WHERE id_skolos_dalis = ?`,
          [newPaidAmount, part.id_skolos_dalis]
        );
        remainingAmount = 0;
      }

      // Insert payment record with proper fk_id_skolos_dalis
      await connection.query(
        `INSERT INTO Mokejimai 
          (fk_id_skolos_dalis, fk_id_vartotojas, data, suma, kursas_eurui)
         VALUES (?, ?, ?, ?, 1.0000)`,
        [part.id_skolos_dalis, fromUserId, today, paymentAmount]
      );
    }

    await connection.commit();

    // ------------ ISTORIJA: payment_registered ------------
    const paidAmount = amount - remainingAmount;
    const historyUserId = actorId ?? Number(fromUserId);
    const curCode = (currencyCode || "EUR").toUpperCase();

    // Ištraukiam vardus/pavardes
    let fromUserName = `Vartotojas #${fromUserId}`;
    let toUserName = `Vartotojas #${toUserId}`;

    try {
      const [fromRows] = await db.query(
        `SELECT vardas, pavarde FROM Vartotojai WHERE id_vartotojas = ?`,
        [fromUserId]
      );
      if (fromRows.length > 0) {
        fromUserName = `${fromRows[0].vardas} ${fromRows[0].pavarde}`;
      }

      const [toRows] = await db.query(
        `SELECT vardas, pavarde FROM Vartotojai WHERE id_vartotojas = ?`,
        [toUserId]
      );
      if (toRows.length > 0) {
        toUserName = `${toRows[0].vardas} ${toRows[0].pavarde}`;
      }
    } catch (nameErr) {
      console.error("Nepavyko gauti vartotojų vardų istorijai:", nameErr);
    }

    const descriptionText = `Mokėjimas užregistruotas: ${fromUserName} → ${toUserName}, suma ${paidAmount} ${curCode}.`;

    await addGroupHistoryEntry(
      Number(groupId),
      Number(historyUserId),
      "payment_registered",
      descriptionText,
      {
        groupId: Number(groupId),
        fromUserId: Number(fromUserId),
        toUserId: Number(toUserId),
        amount: paidAmount,
        currencyCode: curCode,
        note: note || null,
        affectedPartsCount: parts.length
      }
    );

    // -------------------------------------------------------

    res.status(201).json({
      message: 'Mokėjimas užregistruotas',
      amountPaid: paidAmount
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

// ------------------------------------------
// Išlyginti grupės skolas (simplify debts)
// ------------------------------------------
const { getSimplifiedDebtsWithNames } = require('./debtSimplification');

router.get('/api/groups/:groupId/simplify-debts', async (req, res) => {
  const { groupId } = req.params;

  try {
    const result = await getSimplifiedDebtsWithNames(parseInt(groupId));
    res.json(result);
  } catch (err) {
    console.error('Skolų išlyginimo klaida:', err);
    res.status(500).json({ message: 'Serverio klaida išlyginant skolas' });
  }
});

router.get('/api/debts/check-duplicate', async (req, res) => {
  const { groupId, title, excludeDebtId } = req.query;

  if (!groupId || !title) {
    return res.status(400).json({ message: 'Trūksta reikalingų parametrų' });
  }

  try {
    let query = `
      SELECT id_skola AS debtId
      FROM Skolos 
      WHERE fk_id_grupe = ? 
      AND LOWER(TRIM(pavadinimas)) = LOWER(TRIM(?))
    `;
    
    const params = [groupId, title];

    // Exclude current debt when editing
    if (excludeDebtId) {
      query += ` AND id_skola != ?`;
      params.push(excludeDebtId);
    }

    query += ` LIMIT 1`;

    const [rows] = await db.query(query, params);

    res.json({
      exists: rows.length > 0,
      debtId: rows.length > 0 ? rows[0].debtId : null
    });
  } catch (err) {
    console.error('Duplicate check error:', err);
    res.status(500).json({ message: 'Serverio klaida' });
  }
});
module.exports = router;