// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const groupRoutes = require('./routes/groupRoutes');
const debtRoutes = require('./routes/debtRoutes');
const categoryRoutes = require('./routes/categoryRoutes');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check (gali palikti čia, nes paprasta)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// API maršrutai
app.use(authRoutes);
app.use(groupRoutes);
app.use(debtRoutes);
app.use(categoryRoutes);

// Globalus klaidų handleris (nebūtina, bet faina turėti)
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(500).json({ message: 'Serverio klaida' });
});

app.listen(PORT, () => {
  console.log(`Backend serveris veikia ant http://localhost:${PORT}`);
});
