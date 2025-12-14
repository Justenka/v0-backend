// debtSimplification.js - COMPLETELY REWRITTEN
const db = require('../db');

/**
 * Automatically simplify debts by creating payment records
 * Instead of creating new "Išlyginta skola" entries, we create Mokejimai records
 * This keeps all original transactions visible and marks them as paid
 */
async function autoSimplifyGroupDebts(groupId, connection = null) {
  const shouldCloseConnection = !connection;
  const conn = connection || await db.getConnection();
  
  try {
    if (shouldCloseConnection) {
      await conn.beginTransaction();
    }

    console.log(`[IŠLYGINIMAS] Starting debt simplification for group ${groupId}...`);

    // 1. Get all active debt parts (only debtors - vaidmuo = 1)
    const [debtParts] = await conn.query(
      `SELECT 
         s.id_skola,
         s.fk_id_vartotojas AS payer_id,
         sd.id_skolos_dalis,
         sd.fk_id_vartotojas AS debtor_id,
         sd.suma AS debt_amount,
         sd.sumoketa AS amount_paid,
         sd.vaidmuo
       FROM Skolos s
       JOIN Skolos_dalys sd ON s.id_skola = sd.fk_id_skola
       WHERE s.fk_id_grupe = ? 
         AND s.skolos_statusas = 1
         AND sd.apmoketa = 0
         AND sd.vaidmuo = 1
       ORDER BY s.sukurimo_data ASC`,
      [groupId]
    );

    if (debtParts.length === 0) {
      console.log('[IŠLYGINIMAS] No active debts found');
      if (shouldCloseConnection) await conn.commit();
      return { 
        message: 'Nėra aktyvių skolų',
        simplified: false
      };
    }

    console.log(`[IŠLYGINIMAS] Found ${debtParts.length} active debt parts`);

    // 2. Calculate NET balances between each pair of users
    // netDebts[debtorId][creditorId] = amount debtor owes to creditor
    const netDebts = {};

    for (const part of debtParts) {
      const payerId = part.payer_id;      // Who paid (creditor)
      const debtorId = part.debtor_id;    // Who owes (debtor)
      const debtAmount = parseFloat(part.debt_amount);
      const alreadyPaid = parseFloat(part.amount_paid);
      const remaining = debtAmount - alreadyPaid;

      if (remaining <= 0.01) continue; // Skip if fully paid

      // Initialize structures
      if (!netDebts[debtorId]) netDebts[debtorId] = {};
      if (!netDebts[payerId]) netDebts[payerId] = {};
      
      // Add this debt
      if (!netDebts[debtorId][payerId]) {
        netDebts[debtorId][payerId] = [];
      }
      netDebts[debtorId][payerId].push({
        partId: part.id_skolos_dalis,
        debtId: part.id_skola,
        amount: remaining
      });
    }

    console.log('[IŠLYGINIMAS] Net debts calculated');

    // 3. Find mutual debts and create offsetting payments
    const paymentsCreated = [];
    const today = new Date().toISOString().slice(0, 10);

    for (const [debtorId, creditors] of Object.entries(netDebts)) {
      for (const [creditorId, debts] of Object.entries(creditors)) {
        // Check if there's a reverse debt (creditor owes debtor)
        const reverseDebts = netDebts[creditorId]?.[debtorId];
        
        if (!reverseDebts || reverseDebts.length === 0) continue;

        // Calculate total amounts
        const debtorOwesAmount = debts.reduce((sum, d) => sum + d.amount, 0);
        const creditorOwesAmount = reverseDebts.reduce((sum, d) => sum + d.amount, 0);
        
        // Find the smaller amount to offset
        const offsetAmount = Math.min(debtorOwesAmount, creditorOwesAmount);
        
        if (offsetAmount < 0.01) continue;

        console.log(`[IŠLYGINIMAS] Found mutual debt: User ${debtorId} ↔ User ${creditorId} = ${offsetAmount} EUR`);

        // 4. Create payment records to offset these debts
        let remainingOffset = offsetAmount;

        // Pay off debtor's debts first
        for (const debt of debts) {
          if (remainingOffset <= 0.01) break;

          const paymentAmount = Math.min(remainingOffset, debt.amount);

          // Create payment record
          const [paymentResult] = await conn.query(
            `INSERT INTO Mokejimai 
              (fk_id_skolos_dalis, fk_id_vartotojas, data, suma, kursas_eurui)
             VALUES (?, ?, ?, ?, 1.0000)`,
            [debt.partId, debtorId, today, paymentAmount]
          );

          // Update debt part
          const [currentPart] = await conn.query(
            `SELECT suma, sumoketa FROM Skolos_dalys WHERE id_skolos_dalis = ?`,
            [debt.partId]
          );

          const newPaidAmount = parseFloat(currentPart[0].sumoketa) + paymentAmount;
          const totalDebt = parseFloat(currentPart[0].suma);

          await conn.query(
            `UPDATE Skolos_dalys 
             SET sumoketa = ?,
                 apmoketa = ?
             WHERE id_skolos_dalis = ?`,
            [newPaidAmount, newPaidAmount >= totalDebt - 0.01 ? 1 : 0, debt.partId]
          );

          remainingOffset -= paymentAmount;
          
          paymentsCreated.push({
            from: debtorId,
            to: creditorId,
            amount: paymentAmount,
            debtPartId: debt.partId
          });

          console.log(`[IŠLYGINIMAS] Created payment: ${debtorId} → ${creditorId} = ${paymentAmount} EUR`);
        }

        // Pay off reverse debts
        remainingOffset = offsetAmount;
        for (const reverseDebt of reverseDebts) {
          if (remainingOffset <= 0.01) break;

          const paymentAmount = Math.min(remainingOffset, reverseDebt.amount);

          // Create payment record
          await conn.query(
            `INSERT INTO Mokejimai 
              (fk_id_skolos_dalis, fk_id_vartotojas, data, suma, kursas_eurui)
             VALUES (?, ?, ?, ?, 1.0000)`,
            [reverseDebt.partId, creditorId, today, paymentAmount]
          );

          // Update debt part
          const [currentPart] = await conn.query(
            `SELECT suma, sumoketa FROM Skolos_dalys WHERE id_skolos_dalis = ?`,
            [reverseDebt.partId]
          );

          const newPaidAmount = parseFloat(currentPart[0].sumoketa) + paymentAmount;
          const totalDebt = parseFloat(currentPart[0].suma);

          await conn.query(
            `UPDATE Skolos_dalys 
             SET sumoketa = ?,
                 apmoketa = ?
             WHERE id_skolos_dalis = ?`,
            [newPaidAmount, newPaidAmount >= totalDebt - 0.01 ? 1 : 0, reverseDebt.partId]
          );

          remainingOffset -= paymentAmount;

          paymentsCreated.push({
            from: creditorId,
            to: debtorId,
            amount: paymentAmount,
            debtPartId: reverseDebt.partId
          });

          console.log(`[IŠLYGINIMAS] Created payment: ${creditorId} → ${debtorId} = ${paymentAmount} EUR`);
        }

        // Clear these debts from our tracking since we've processed them
        delete netDebts[debtorId][creditorId];
        if (netDebts[creditorId]) {
          delete netDebts[creditorId][debtorId];
        }
      }
    }

    if (shouldCloseConnection) {
      await conn.commit();
    }

    if (paymentsCreated.length === 0) {
      console.log('[IŠLYGINIMAS] No mutual debts found to simplify');
      return {
        message: 'Nerasta tarpusavio skolų išlyginimui',
        simplified: false
      };
    }

    console.log(`[IŠLYGINIMAS] Successfully created ${paymentsCreated.length} offsetting payments`);

    return {
      message: 'Skolos sėkmingai išlygintos',
      simplified: true,
      paymentsCreated: paymentsCreated.length,
      totalAmountOffset: paymentsCreated.reduce((sum, p) => sum + p.amount, 0),
      details: paymentsCreated
    };

  } catch (error) {
    if (shouldCloseConnection) {
      await conn.rollback();
    }
    console.error('[IŠLYGINIMAS] Error:', error);
    throw error;
  } finally {
    if (shouldCloseConnection) {
      conn.release();
    }
  }
}

/**
 * Get current debts for a group (for debugging/display)
 */
async function getSimplifiedDebtsWithNames(groupId) {
  try {
    const [debts] = await db.query(
      `SELECT 
         s.id_skola,
         s.pavadinimas,
         s.suma,
         payer.vardas AS payer_name,
         payer.pavarde AS payer_surname,
         debtor.vardas AS debtor_name,
         debtor.pavarde AS debtor_surname,
         sd.suma AS debt_amount,
         sd.sumoketa AS paid_amount,
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
      amount: parseFloat(d.debt_amount),
      paid: parseFloat(d.paid_amount),
      remaining: parseFloat(d.debt_amount) - parseFloat(d.paid_amount),
      from: `${d.debtor_name} ${d.debtor_surname}`,
      to: `${d.payer_name} ${d.payer_surname}`
    }));

    return {
      message: 'Dabartinės aktyvios skolos',
      debts: result,
      count: result.length
    };
  } catch (error) {
    console.error('Error getting debts:', error);
    throw error;
  }
}

module.exports = {
  autoSimplifyGroupDebts,
  getSimplifiedDebtsWithNames
};