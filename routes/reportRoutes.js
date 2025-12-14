// routes/reportRoutes.js
const express = require('express');
const PDFDocument = require('pdfkit');
const db = require('../db');
const path = require('path');

const router = express.Router();
const fontPath = path.join(__dirname, '..', 'fonts');

router.get('/api/groups/:groupId/reports/pdf', async (req, res) => {
  const { groupId } = req.params;
  
  // Get user ID from header
  const currentUserId = req.headers['x-user-id'] || req.user?.id || req.session?.userId;
  
  if (!currentUserId) {
    return res.status(401).json({ message: 'Neprisijungęs vartotojas' });
  }

  try {
    // 1. Verify user is a member of the group
    const [memberCheck] = await db.query(
      `SELECT gn.id_grupes_narys 
       FROM Grupes_nariai gn
       WHERE gn.fk_id_grupe = ? AND gn.fk_id_vartotojas = ? AND gn.nario_busena = 1`,
      [groupId, currentUserId]
    );

    if (memberCheck.length === 0) {
      return res.status(403).json({ message: 'Jūs nesate šios grupės narys' });
    }

    // 2. Get group information
    const [groupData] = await db.query(
      `SELECT g.pavadinimas, g.aprasas, g.sukurimo_data
       FROM Grupes g
       WHERE g.id_grupe = ?`,
      [groupId]
    );

    if (groupData.length === 0) {
      return res.status(404).json({ message: 'Grupė nerasta' });
    }

    const group = groupData[0];

    // 3. Get current user information
    const [userData] = await db.query(
      `SELECT vardas, pavarde
       FROM Vartotojai
       WHERE id_vartotojas = ?`,
      [currentUserId]
    );

    const currentUser = userData[0];
    const reportGeneratorName = `${currentUser.vardas} ${currentUser.pavarde}`;

    // 4. Get all transactions (skolos) for this group
    const [transactions] = await db.query(
      `SELECT 
         s.id_skola,
         s.pavadinimas,
         s.aprasymas,
         s.suma,
         s.sukurimo_data,
         s.terminas,
         k.name as kategorija,
         v.name as valiuta,
         CONCAT(payer.vardas, ' ', payer.pavarde) as sumokejo,
         ss.name as statusas
       FROM Skolos s
       JOIN Kategorijos k ON s.kategorija = k.id_kategorija
       JOIN Valiutos v ON s.valiutos_kodas = v.id_valiuta
       JOIN Vartotojai payer ON s.fk_id_vartotojas = payer.id_vartotojas
       JOIN Skolu_statusai ss ON s.skolos_statusas = ss.id_skolos_statusas
       WHERE s.fk_id_grupe = ?
       ORDER BY s.sukurimo_data DESC`,
      [groupId]
    );

    // 5. For each transaction, get the current user's debt shares
    const transactionsWithDebts = await Promise.all(
      transactions.map(async (transaction) => {
        const [debtShares] = await db.query(
          `SELECT 
             sd.suma,
             sd.procentas,
             sd.apmoketa,
             sd.sumoketa,
             CONCAT(v.vardas, ' ', v.pavarde) as skolininkas,
             vaid.name as vaidmuo
           FROM Skolos_dalys sd
           JOIN Vartotojai v ON sd.fk_id_vartotojas = v.id_vartotojas
           JOIN Vaidmenys vaid ON sd.vaidmuo = vaid.id_vaidmuo
           WHERE sd.fk_id_skola = ? AND sd.fk_id_vartotojas = ?`,
          [transaction.id_skola, currentUserId]
        );

        return {
          ...transaction,
          debtShares: debtShares || [],
        };
      })
    );

    // 6. Generate PDF with proper encoding
    const doc = new PDFDocument({ 
      size: 'A4', 
      margin: 50,
      bufferPages: true
    });

    // OPTION 1: Register a custom font (recommended)
    // Download a font like DejaVu Sans or Roboto that supports Lithuanian
    // Place it in your project (e.g., /fonts/DejaVuSans.ttf)
    // Then register it:
    // doc.registerFont('DejaVu', './fonts/DejaVuSans.ttf');
    // doc.registerFont('DejaVu-Bold', './fonts/DejaVuSans-Bold.ttf');
    // 
    // Then use: doc.font('DejaVu') instead of doc.font('Helvetica')
    
    doc.registerFont('DejaVu', path.join(fontPath, 'DejaVuLGCSans.ttf'));
    doc.registerFont('DejaVu-Bold', path.join(fontPath, 'DejaVuLGCSans-Bold.ttf'));
    doc.registerFont('DejaVu-Oblique', path.join(fontPath, 'DejaVuLGCSans-Oblique.ttf'));


    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="ataskaita-${group.pavadinimas}-${new Date().toISOString().split('T')[0]}.pdf"`
    );

    // Pipe PDF to response
    doc.pipe(res);

    // PDF Header - Use regular font (DejaVu supports basic Latin characters)
    doc
      .fontSize(20)
      .font('DejaVu-Bold')
      .text('FINANSINE ATASKAITA', { align: 'center' })
      .moveDown();

    // Group Information
    doc
      .fontSize(14)
      .font('DejaVu-Bold')
      .text(`Grupe: ${group.pavadinimas}`)
      .fontSize(10)
      .font('DejaVu')
      .text(`Aprasas: ${group.aprasas || 'Nera apraso'}`)
      .moveDown();

    // Report Information
    doc
      .fontSize(10)
      .text(`Ataskaita sugeneravo: ${reportGeneratorName}`)
      .text(`Generavimo data: ${new Date().toLocaleDateString('lt-LT')}`)
      .text(`Grupes sukurimo data: ${new Date(group.sukurimo_data).toLocaleDateString('lt-LT')}`)
      .moveDown(2);

    // Transactions Section
    doc
      .fontSize(14)
      .font('DejaVu-Bold')
      .text('ISLAIDOS IR SKOLOS')
      .moveDown();

    if (transactionsWithDebts.length === 0) {
      doc.fontSize(10).font('DejaVu').text('Nera jokiu islaidu sioje grupeje.');
    } else {
      transactionsWithDebts.forEach((transaction, index) => {
        if (doc.y > 700) {
          doc.addPage();
        }

        doc
          .fontSize(12)
          .font('DejaVu-Bold')
          .text(`${index + 1}. ${transaction.pavadinimas}`)
          .fontSize(9)
          .font('DejaVu')
          .text(`Suma: ${Number(transaction.suma).toFixed(2)} ${transaction.valiuta}`)
          .text(`Sumokejo: ${transaction.sumokejo}`)
          .text(`Data: ${new Date(transaction.sukurimo_data).toLocaleDateString('lt-LT')}`)
          .text(`Terminas: ${new Date(transaction.terminas).toLocaleDateString('lt-LT')}`)
          .text(`Kategorija: ${transaction.kategorija}`)
          .text(`Statusas: ${transaction.statusas}`);

        if (transaction.aprasymas) {
          doc.text(`Aprasas: ${transaction.aprasymas}`);
        }

        if (transaction.debtShares.length > 0) {
          doc.moveDown(0.5);
          doc.fontSize(10).font('DejaVu-Bold').text('Jusu skola:');

          transaction.debtShares.forEach((debt) => {
            const debtAmount = Number(debt.suma).toFixed(2);
            const paidAmount = Number(debt.sumoketa).toFixed(2);
            const remaining = (Number(debt.suma) - Number(debt.sumoketa)).toFixed(2);
            const status = debt.apmoketa ? 'Apmoketa' : 'Neapmoketa';

            doc
              .fontSize(9)
              .font('DejaVu')
              .text(`  • Skolinga suma: ${debtAmount} ${transaction.valiuta} (${Number(debt.procentas).toFixed(0)}%)`)
              .text(`  • Sumoketa: ${paidAmount} ${transaction.valiuta}`)
              .text(`  • Likutis: ${remaining} ${transaction.valiuta}`)
              .text(`  • Busena: ${status}`)
              .text(`  • Vaidmuo: ${debt.vaidmuo}`);
          });
        } else {
          doc.moveDown(0.5).fontSize(9).font('DejaVu-Oblique').text('  Jus neturite skolos siai islaidai.');
        }

        doc.moveDown(1.5);
      });
    }

    // Summary Section
    doc.addPage();
    doc.fontSize(14).font('DejaVu-Bold').text('SUVESTINE').moveDown();

    const totalTransactions = transactionsWithDebts.length;
    const totalAmount = transactionsWithDebts.reduce((sum, t) => sum + Number(t.suma), 0);

    let userTotalDebt = 0;
    let userTotalPaid = 0;
    transactionsWithDebts.forEach((t) => {
      t.debtShares.forEach((debt) => {
        userTotalDebt += Number(debt.suma);
        userTotalPaid += Number(debt.sumoketa);
      });
    });
    const userRemaining = userTotalDebt - userTotalPaid;

    doc
      .fontSize(10)
      .font('DejaVu')
      .text(`Is viso islaidu: ${totalTransactions}`)
      .text(`Bendra suma: ${totalAmount.toFixed(2)} EUR`)
      .moveDown()
      .font('DejaVu-Bold')
      .text('Jusu finansai:')
      .font('DejaVu')
      .text(`Is viso skolinga: ${userTotalDebt.toFixed(2)} EUR`)
      .text(`Sumoketa: ${userTotalPaid.toFixed(2)} EUR`)
      .text(`Likutis: ${userRemaining.toFixed(2)} EUR`);

    // Footer
    doc
      .fontSize(8)
      .font('DejaVu-Oblique')
      .text('_______________________________________________', 50, doc.page.height - 100, {
        align: 'center',
      })
      .text('Si ataskaita sugeneruota automatiskai', { align: 'center' })
      .text(`Skolu Departamentas © ${new Date().getFullYear()}`, { align: 'center' });

    doc.end();

  } catch (error) {
    console.error('Error generating PDF:', error);
    
    if (!res.headersSent) {
      res.status(500).json({ message: 'Nepavyko sugeneruoti ataskaitos' });
    }
  }
});

module.exports = router;