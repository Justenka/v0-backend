// utils/debtSimplification.js
const db = require('../db');

/**
 * Automatiškai išlygina skolas grupėje
 * Ištrina senas skolas ir sukuria naujas optimizuotas
 * @param {number} groupId - Grupės ID
 * @returns {Promise<Object>} - Išlyginimo rezultatas
 */
async function autoSimplifyGroupDebts(groupId, connection = null) {
  const shouldCloseConnection = !connection;
  const conn = connection || await db.getConnection();
  
  try {
    if (shouldCloseConnection) {
      await conn.beginTransaction();
    }

    console.log(`[IŠLYGINIMAS] Pradedamas grupės ${groupId} skolų išlyginimas...`);

    // 1. Gauname visas aktyvias skolų dalis (TIK SKOLININKUS - vaidmuo = 1)
    const [debtParts] = await conn.query(
      `SELECT 
         s.id_skola,
         s.fk_id_vartotojas AS payer_id,
         sd.fk_id_vartotojas AS debtor_id,
         sd.suma,
         sd.vaidmuo
       FROM Skolos s
       JOIN Skolos_dalys sd ON s.id_skola = sd.fk_id_skola
       WHERE s.fk_id_grupe = ? 
         AND s.skolos_statusas = 1
         AND sd.apmoketa = 0
         AND sd.vaidmuo = 1
       ORDER BY s.id_skola`,
      [groupId]
    );

    if (debtParts.length === 0) {
      console.log('[IŠLYGINIMAS] Nėra aktyvių skolų (vaidmuo=1)');
      if (shouldCloseConnection) await conn.commit();
      return { 
        message: 'Nėra aktyvių skolų',
        simplified: false
      };
    }

    console.log('[IŠLYGINIMAS] Rastos skolų dalys:', debtParts.length);

    // 2. Skaičiuojame NET balansus (kas kam kiek skolingas)
    // balances[userId] = kiek jis BENDRAI skolingas/skolinamas
    const netDebts = {}; // { fromUserId: { toUserId: amount } }

    for (const part of debtParts) {
      const payerId = part.payer_id;      // Kas mokėjo (kam skolingi)
      const debtorId = part.debtor_id;    // Kas skolingas
      const amount = parseFloat(part.suma);

      // Inicializuojame
      if (!netDebts[debtorId]) netDebts[debtorId] = {};
      if (!netDebts[payerId]) netDebts[payerId] = {};
      
      // Skolininkas (debtorId) skolingas mokėtojui (payerId)
      if (!netDebts[debtorId][payerId]) {
        netDebts[debtorId][payerId] = 0;
      }
      netDebts[debtorId][payerId] += amount;

      // Atvirkščiai - jei mokėtojas (payerId) skolingas skolininkui (debtorId)
      // Tai išlyginame
      if (netDebts[payerId] && netDebts[payerId][debtorId]) {
        const reverseAmount = netDebts[payerId][debtorId];
        const minAmount = Math.min(amount, reverseAmount);
        
        // Išlyginame abipuses skolas
        netDebts[debtorId][payerId] -= minAmount;
        netDebts[payerId][debtorId] -= minAmount;
        
        // Pašaliname jei suma 0
        if (Math.abs(netDebts[debtorId][payerId]) < 0.01) {
          delete netDebts[debtorId][payerId];
        }
        if (Math.abs(netDebts[payerId][debtorId]) < 0.01) {
          delete netDebts[payerId][debtorId];
        }
      }
    }

    console.log('[IŠLYGINIMAS] NET skolos:', JSON.stringify(netDebts, null, 2));

    // 3. Konvertuojame į paprastą formatą ir skaičiuojame balansus
    const balances = {};
    const directDebts = [];

    for (const [debtorId, debtorDebts] of Object.entries(netDebts)) {
      for (const [creditorId, amount] of Object.entries(debtorDebts)) {
        if (amount > 0.01) {
          directDebts.push({
            from: parseInt(debtorId),
            to: parseInt(creditorId),
            amount: Math.round(amount * 100) / 100
          });

          // Skaičiuojame balansus
          if (!balances[debtorId]) balances[debtorId] = 0;
          if (!balances[creditorId]) balances[creditorId] = 0;
          
          balances[debtorId] -= amount;   // Jis skolingas (neigiamas)
          balances[creditorId] += amount;  // Jam skolingi (teigiamas)
        }
      }
    }

    console.log('[IŠLYGINIMAS] Tiesiogines skolos:', directDebts);
    console.log('[IŠLYGINIMAS] Balansai:', balances);

    if (directDebts.length === 0) {
      console.log('[IŠLYGINIMAS] Visos skolos jau išlygintos');
      if (shouldCloseConnection) await conn.commit();
      return { 
        message: 'Visos skolos jau išlygintos',
        simplified: false
      };
    }

    // 4. Optimizuojame skolas (jei yra daugiau nei 2 žmonės)
    const uniqueUsers = new Set([
      ...directDebts.map(d => d.from),
      ...directDebts.map(d => d.to)
    ]);

    let simplifiedDebts = directDebts;

    // Tik jei yra daugiau nei 2 žmonės, bandome optimizuoti per balansus
    if (uniqueUsers.size > 2) {
      console.log('[IŠLYGINIMAS] Optimizuojame per balansus...');
      
      const debtors = [];
      const creditors = [];

      for (const [userId, balance] of Object.entries(balances)) {
        const roundedBalance = Math.round(balance * 100) / 100;
        
        if (roundedBalance < -0.01) {
          debtors.push({ 
            userId: parseInt(userId), 
            amount: Math.abs(roundedBalance) 
          });
        } else if (roundedBalance > 0.01) {
          creditors.push({ 
            userId: parseInt(userId), 
            amount: roundedBalance 
          });
        }
      }

      if (debtors.length > 0 && creditors.length > 0) {
        simplifiedDebts = [];
        
        debtors.sort((a, b) => b.amount - a.amount);
        creditors.sort((a, b) => b.amount - a.amount);

        let i = 0;
        let j = 0;

        while (i < debtors.length && j < creditors.length) {
          const debtor = debtors[i];
          const creditor = creditors[j];

          const transferAmount = Math.min(debtor.amount, creditor.amount);

          if (transferAmount > 0.01) {
            simplifiedDebts.push({
              from: debtor.userId,
              to: creditor.userId,
              amount: Math.round(transferAmount * 100) / 100
            });
          }

          debtor.amount -= transferAmount;
          creditor.amount -= transferAmount;

          if (debtor.amount < 0.01) i++;
          if (creditor.amount < 0.01) j++;
        }
      }
    }

    console.log('[IŠLYGINIMAS] Optimizuotos skolos:', simplifiedDebts);

    // Jei po optimizavimo skolų skaičius toks pat arba didesnis - naudojame originalias
    if (simplifiedDebts.length >= directDebts.length) {
      console.log('[IŠLYGINIMAS] Optimizavimas nesuteikė pranašumo, naudojame tiesiogines skolas');
      simplifiedDebts = directDebts;
    }

    const originalCount = debtParts.length;
    const simplifiedCount = simplifiedDebts.length;

    // Jei nieko nesutaupome - nereiškia išlyginti
    if (simplifiedCount >= originalCount) {
      console.log('[IŠLYGINIMAS] Nieko nesutaupyta, praleidžiame išlyginimą');
      if (shouldCloseConnection) await conn.commit();
      return {
        message: 'Išlyginimas nesuteikė pranašumo',
        simplified: false,
        originalCount,
        simplifiedCount
      };
    }

    // 5. Pažymime senas skolas kaip "išlygintas" (statusas = 2)
    await conn.query(
      `UPDATE Skolos 
       SET skolos_statusas = 2, 
           paskutinio_keitimo_data = CURDATE()
       WHERE fk_id_grupe = ? 
         AND skolos_statusas = 1`,
      [groupId]
    );

    // 6. Sukuriame naujas optimizuotas skolas
    const today = new Date().toISOString().slice(0, 10);
    const termDate = new Date();
    termDate.setDate(termDate.getDate() + 30);
    const termDateStr = termDate.toISOString().slice(0, 10);

    for (const debt of simplifiedDebts) {
      // Sukuriame naują skolą
      const [debtResult] = await conn.query(
        `INSERT INTO Skolos 
          (fk_id_grupe, fk_id_vartotojas, pavadinimas, aprasymas, suma, kursas_eurui,
           sukurimo_data, paskutinio_keitimo_data, terminas, valiutos_kodas,
           skolos_statusas, kategorija)
         VALUES (?, ?, ?, ?, ?, 1.0000, ?, ?, ?, 1, 1, 11)`,
        [
          groupId,
          debt.to,  // Mokėtojas (kam skolingi)
          'Išlyginta skola',
          'Automatiškai išlyginta skola',
          debt.amount,
          today,
          today,
          termDateStr,
        ]
      );

      const newDebtId = debtResult.insertId;

      // Sukuriame skolos dalis
      // Skolininkas (from) - vaidmuo 1
      await conn.query(
        `INSERT INTO Skolos_dalys 
          (fk_id_skola, fk_id_vartotojas, suma, procentas, apmoketa, delspinigiai, vaidmuo)
         VALUES (?, ?, ?, 100.00, 0, 0, 1)`,
        [newDebtId, debt.from, debt.amount]
      );

      // Mokėtojas (to) - vaidmuo 2
      await conn.query(
        `INSERT INTO Skolos_dalys 
          (fk_id_skola, fk_id_vartotojas, suma, procentas, apmoketa, delspinigiai, vaidmuo)
         VALUES (?, ?, ?, 0, 1, 0, 2)`,
        [newDebtId, debt.to, debt.amount]
      );
    }

    const saved = originalCount - simplifiedCount;

    console.log(`[IŠLYGINIMAS] Sėkmingai išlyginta: ${originalCount} → ${simplifiedCount} (sutaupyta: ${saved})`);

    if (shouldCloseConnection) {
      await conn.commit();
    }

    return {
      message: 'Skolos sėkmingai išlygintos',
      simplified: true,
      originalCount,
      simplifiedCount,
      savedTransactions: Math.max(0, saved),
      newDebts: simplifiedDebts
    };

  } catch (error) {
    if (shouldCloseConnection) {
      await conn.rollback();
    }
    console.error('[IŠLYGINIMAS] Klaida:', error);
    throw error;
  } finally {
    if (shouldCloseConnection) {
      conn.release();
    }
  }
}

/**
 * PAPILDOMA FUNKCIJA: Gauti dabartines išlygintas skolas su vardais
 * (naudojama tik peržiūrai/debuginimui)
 */
async function getSimplifiedDebtsWithNames(groupId) {
  try {
    // Gauname visas aktyvias skolas
    const [debts] = await db.query(
      `SELECT 
         s.id_skola,
         s.pavadinimas,
         s.suma,
         payer.vardas AS payer_name,
         payer.pavarde AS payer_surname,
         debtor.vardas AS debtor_name,
         debtor.pavarde AS debtor_surname,
         sd.vaidmuo
       FROM Skolos s
       JOIN Vartotojai payer ON s.fk_id_vartotojas = payer.id_vartotojas
       JOIN Skolos_dalys sd ON s.id_skola = sd.fk_id_skola
       JOIN Vartotojai debtor ON sd.fk_id_vartotojas = debtor.id_vartotojas
       WHERE s.fk_id_grupe = ? 
         AND s.skolos_statusas = 1
         AND sd.apmoketa = 0
         AND sd.vaidmuo = 1
       ORDER BY s.sukurimo_data DESC`,
      [groupId]
    );

    const result = debts.map(d => ({
      debtId: d.id_skola,
      title: d.pavadinimas,
      amount: parseFloat(d.suma),
      from: `${d.debtor_name} ${d.debtor_surname}`,
      to: `${d.payer_name} ${d.payer_surname}`
    }));

    return {
      message: 'Dabartinės aktyvios skolos',
      debts: result,
      count: result.length
    };
  } catch (error) {
    console.error('Klaida gaunant skolas:', error);
    throw error;
  }
}

module.exports = {
  autoSimplifyGroupDebts,
  getSimplifiedDebtsWithNames
};