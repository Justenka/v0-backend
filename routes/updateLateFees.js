// cron/updateLateFees.js - PURE JAVASCRIPT VERSION
const cron = require('node-cron');
const db = require('../db');

/**
 * Calculate and update late fees daily
 * This version correctly:
 * 1. Calculates daily late fees
 * 2. Updates apskaiciuota_suma in delspinigiai table
 * 3. Adds accumulated late fees to the debt amount in Skolos_dalys
 */
const updateLateFees = async () => {
  console.log('[' + new Date().toISOString() + '] Starting daily late fee update...');
  
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Get all active late fee entries that should be calculated
    const [lateFeeEntries] = await connection.query(
      `SELECT 
        d.id_delspinigiai,
        d.fk_id_skolos_dalis,
        d.dienos_proc AS daily_percentage,
        d.pradzios_data AS start_date,
        d.apskaiciuota_suma AS accumulated_fee,
        d.aktyvus,
        sd.suma AS original_debt,
        sd.sumoketa AS amount_paid,
        sd.apmoketa AS is_fully_paid,
        s.id_skola,
        s.pavadinimas AS debt_title
      FROM delspinigiai d
      JOIN Skolos_dalys sd ON d.fk_id_skolos_dalis = sd.id_skolos_dalis
      JOIN Skolos s ON sd.fk_id_skola = s.id_skola
      WHERE d.aktyvus = 1
        AND sd.apmoketa = 0
        AND s.skolos_statusas = 1
        AND d.pradzios_data <= CURDATE()`
    );
    
    console.log('[LATE FEES] Found ' + lateFeeEntries.length + ' active late fee entries');
    
    let totalFeesCalculated = 0;
    let entriesUpdated = 0;
    
    for (const entry of lateFeeEntries) {
      const startDate = new Date(entry.start_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      startDate.setHours(0, 0, 0, 0);
      
      // Skip if start date is in the future
      if (startDate > today) {
        console.log('[LATE FEES] Skipping entry ' + entry.id_delspinigiai + ' - start date in future');
        continue;
      }
      
      // Calculate days elapsed since start
      const daysElapsed = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
      
      if (daysElapsed < 0) {
        console.log('[LATE FEES] Skipping entry ' + entry.id_delspinigiai + ' - negative days');
        continue;
      }
      
      // Calculate remaining debt (original debt - what's been paid)
      const originalDebt = parseFloat(entry.original_debt);
      const amountPaid = parseFloat(entry.amount_paid);
      const previouslyAccumulatedFee = parseFloat(entry.accumulated_fee);
      
      // The base for calculating late fees is the REMAINING unpaid debt
      const remainingDebt = originalDebt - amountPaid;
      
      if (remainingDebt <= 0.01) {
        // Debt is fully paid - deactivate late fee
        await connection.query(
          `UPDATE delspinigiai 
           SET aktyvus = 0 
           WHERE id_delspinigiai = ?`,
          [entry.id_delspinigiai]
        );
        
        console.log('[LATE FEES] Deactivated late fee ' + entry.id_delspinigiai + ' - debt fully paid');
        continue;
      }
      
      // Calculate daily late fee
      const dailyPercentage = parseFloat(entry.daily_percentage);
      const dailyFeeAmount = (remainingDebt * dailyPercentage) / 100;
      
      // Total accumulated fee should be: dailyFee * daysElapsed
      const totalAccumulatedFee = dailyFeeAmount * daysElapsed;
      
      // Only update if there's a change
      if (Math.abs(totalAccumulatedFee - previouslyAccumulatedFee) < 0.01) {
        console.log('[LATE FEES] No change for entry ' + entry.id_delspinigiai);
        continue;
      }
      
      // Update delspinigiai table
      await connection.query(
        `UPDATE delspinigiai 
         SET apskaiciuota_suma = ?
         WHERE id_delspinigiai = ?`,
        [totalAccumulatedFee, entry.id_delspinigiai]
      );
      
      console.log('[LATE FEES] Entry ' + entry.id_delspinigiai + ':');
      console.log('  - Debt: "' + entry.debt_title + '"');
      console.log('  - Days elapsed: ' + daysElapsed);
      console.log('  - Daily rate: ' + dailyPercentage + '%');
      console.log('  - Remaining debt: ' + remainingDebt.toFixed(2) + ' EUR');
      console.log('  - Daily fee: ' + dailyFeeAmount.toFixed(2) + ' EUR');
      console.log('  - Total accumulated: ' + totalAccumulatedFee.toFixed(2) + ' EUR');
      
      // CRITICAL FIX: Add the accumulated late fee to the debt amount in Skolos_dalys
      // The new total debt = original debt + accumulated late fees
      const newTotalDebt = originalDebt + totalAccumulatedFee;
      
      await connection.query(
        `UPDATE Skolos_dalys 
         SET suma = ?
         WHERE id_skolos_dalis = ?`,
        [newTotalDebt, entry.fk_id_skolos_dalis]
      );
      
      console.log('  - Updated Skolos_dalys: new total = ' + newTotalDebt.toFixed(2) + ' EUR (original: ' + originalDebt.toFixed(2) + ' + fee: ' + totalAccumulatedFee.toFixed(2) + ')');
      
      totalFeesCalculated += totalAccumulatedFee;
      entriesUpdated++;
    }
    
    // Deactivate late fees for fully paid debts
    const [deactivated] = await connection.query(
      `UPDATE delspinigiai d
       JOIN Skolos_dalys sd ON d.fk_id_skolos_dalis = sd.id_skolos_dalis
       SET d.aktyvus = 0
       WHERE sd.apmoketa = 1 AND d.aktyvus = 1`
    );
    
    if (deactivated.affectedRows > 0) {
      console.log('[LATE FEES] Deactivated ' + deactivated.affectedRows + ' late fee entries for paid debts');
    }
    
    await connection.commit();
    
    console.log('[' + new Date().toISOString() + '] Late fee update completed successfully');
    console.log('[LATE FEES] Summary:');
    console.log('  - Entries updated: ' + entriesUpdated);
    console.log('  - Total fees calculated: ' + totalFeesCalculated.toFixed(2) + ' EUR');
    
  } catch (err) {
    await connection.rollback();
    console.error('[Late Fee Update Error]', err);
  } finally {
    connection.release();
  }
};

/**
 * Schedule the cron job to run daily at 03:06 (Vilnius time)
 */
const scheduleLateFeeUpdates = () => {
  // Run every day at 03:06 AM Vilnius time
  cron.schedule('35 4 * * *', async () => {
    await updateLateFees();
  }, {
    timezone: "Europe/Vilnius"
  });
  
  console.log('✅ Late fee update cron job scheduled (runs daily at 03:06 Vilnius time)');
};

/**
 * Manual trigger for testing
 */
const triggerManualUpdate = async () => {
  console.log('🔧 Manually triggering late fee update...');
  await updateLateFees();
};

module.exports = {
  scheduleLateFeeUpdates,
  updateLateFees,
  triggerManualUpdate
};