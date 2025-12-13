// cron/updateLateFees.js
const cron = require('node-cron');
const db = require('../db');

/**
 * Calculate and update late fees daily
 * Works with existing database structure
 * Stores percentage in aprasymas field as JSON metadata
 * Runs every day at 00:01
 */
const updateLateFees = async () => {
  console.log(`[${new Date().toISOString()}] Starting daily late fee update...`);
  
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Get all active debts with late fees enabled
    const [debts] = await connection.query(`
      SELECT 
        s.id_skola,
        s.aprasymas,
        s.suma AS total_amount,
        s.kursas_eurui,
        s.valiutos_kodas,
        s.terminas,
        s.sukurimo_data
      FROM Skolos s
      WHERE s.skolos_statusas = 1
        AND s.aprasymas IS NOT NULL
        AND s.aprasymas LIKE '%"lateFeePercentage":%'
    `);
    
    console.log(`Found ${debts.length} debts with late fees enabled`);
    
    for (const debt of debts) {
      try {
        // Parse metadata from aprasymas field
        const metadata = JSON.parse(debt.aprasymas);
        const lateFeePercentage = parseFloat(metadata.lateFeePercentage);
        const lateFeeAfterDays = parseInt(metadata.lateFeeAfterDays || 7);
        
        if (!lateFeePercentage || lateFeePercentage <= 0) continue;
        
        // Calculate when late fees should start
        const termDate = new Date(debt.terminas);
        const lateFeeStartDate = new Date(termDate);
        lateFeeStartDate.setDate(lateFeeStartDate.getDate() + lateFeeAfterDays);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Skip if late fee period hasn't started yet
        if (today < lateFeeStartDate) continue;
        
        // Get all unpaid debt parts for this debt
        const [parts] = await connection.query(`
          SELECT 
            sd.id_skolos_dalis,
            sd.fk_id_vartotojas,
            sd.suma AS debt_amount,
            sd.sumoketa AS amount_paid,
            sd.apmoketa AS is_paid,
            sd.vaidmuo
          FROM Skolos_dalys sd
          WHERE sd.fk_id_skola = ?
            AND sd.vaidmuo = 1
            AND sd.apmoketa = 0
        `, [debt.id_skola]);
        
        for (const part of parts) {
          // All amounts are already in EUR in the database
          const debtAmountEUR = parseFloat(part.debt_amount);
          const paidAmountEUR = parseFloat(part.amount_paid);
          const remainingDebtEUR = debtAmountEUR - paidAmountEUR;
          
          if (remainingDebtEUR <= 0) {
            // Mark part as paid if fully paid
            await connection.query(`
              UPDATE Skolos_dalys 
              SET apmoketa = 1 
              WHERE id_skolos_dalis = ?
            `, [part.id_skolos_dalis]);
            continue;
          }
          
          // Calculate daily late fee in EUR (percentage of remaining debt)
          const dailyFeeAmount = (remainingDebtEUR * lateFeePercentage) / 100;
          
          // Check if delspinigiai entry exists
          const [existingFee] = await connection.query(`
            SELECT 
              id_delspinigiai,
              apskaiciuota_suma,
              pradzios_data
            FROM delspinigiai
            WHERE fk_id_skolos_dalis = ?
            LIMIT 1
          `, [part.id_skolos_dalis]);
          
          if (existingFee.length > 0) {
            // Update existing late fee entry
            const currentAccumulated = parseFloat(existingFee[0].apskaiciuota_suma);
            const lastUpdateDate = new Date(existingFee[0].pradzios_data);
            
            // Only add fee if we haven't updated today
            const todayStr = today.toISOString().slice(0, 10);
            const lastUpdateStr = lastUpdateDate.toISOString().slice(0, 10);
            
            if (todayStr !== lastUpdateStr) {
              const newAccumulated = currentAccumulated + dailyFeeAmount;
              
              await connection.query(`
                UPDATE delspinigiai 
                SET apskaiciuota_suma = ?,
                    pradzios_data = CURDATE(),
                    aktyvus = 1
                WHERE id_delspinigiai = ?
              `, [newAccumulated, existingFee[0].id_delspinigiai]);
              
              console.log(`Updated late fee for debt part ${part.id_skolos_dalis}: +${dailyFeeAmount.toFixed(2)} EUR (total: ${newAccumulated.toFixed(2)} EUR)`);
            }
          } else {
            // Create new late fee entry
            await connection.query(`
              INSERT INTO delspinigiai (
                fk_id_skolos_dalis,
                dienos_proc,
                pradzios_data,
                pabaigos_data,
                apskaiciuota_suma,
                aktyvus
              ) VALUES (?, ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 YEAR), ?, 1)
            `, [part.id_skolos_dalis, lateFeePercentage, dailyFeeAmount]);
            
            console.log(`Created new late fee for debt part ${part.id_skolos_dalis}: ${dailyFeeAmount.toFixed(2)} EUR`);
          }
          
          // Update delspinigiai flag in Skolos_dalys
          await connection.query(`
            UPDATE Skolos_dalys 
            SET delspinigiai = 1 
            WHERE id_skolos_dalis = ?
          `, [part.id_skolos_dalis]);
        }
      } catch (parseErr) {
        console.error(`Error processing debt ${debt.id_skola}:`, parseErr);
        continue;
      }
    }
    
    // Deactivate late fees for fully paid debts
    await connection.query(`
      UPDATE delspinigiai d
      JOIN Skolos_dalys sd ON d.fk_id_skolos_dalis = sd.id_skolos_dalis
      SET d.aktyvus = 0
      WHERE sd.apmoketa = 1 AND d.aktyvus = 1
    `);
    
    await connection.commit();
    console.log(`[${new Date().toISOString()}] Late fee update completed successfully`);
    
  } catch (err) {
    await connection.rollback();
    console.error('[Late Fee Update Error]', err);
  } finally {
    connection.release();
  }
};

/**
 * Schedule the cron job to run daily at 00:01
 */
const scheduleLateFeeUpdates = () => {
  cron.schedule('6 3 * * *', async () => {
    await updateLateFees();
  }, {
    timezone: "Europe/Vilnius"
  });
  
  console.log('Late fee update cron job scheduled (runs daily at 00:01)');
};

module.exports = {
  scheduleLateFeeUpdates,
  updateLateFees
};