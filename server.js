// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const path = require("path");

const PORT = process.env.PORT || 4000;

const authRoutes = require('./routes/authRoutes');
const groupRoutes = require('./routes/groupRoutes');
const debtRoutes = require('./routes/debtRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const friendsRoutes = require("./routes/friendsRoutes");
const messagesRoutes = require("./routes/messagesRoutes");
const UserRoutes = require("./routes/UserRoutes");
const currencyRoutes = require("./routes/CurrencyRoutes");
const { startCurrencyUpdater } = require("./routes/currencyUpdater");
const settingsRoutes = require("./routes/settingsRoutes");
const notificationsRoutes = require("./routes/notificationsRoutes");
const { scheduleLateFeeUpdates, updateLateFees } = require('./routes/updateLateFees');

// Middleware
const allowedOrigin = 'http://localhost:3000' // tavo Next dev URL

const corsOptions = {
  origin: allowedOrigin,
  credentials: true, // LEIDŽIAM cookies / credentials
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-user-id','Authorization'],
}

app.use(cors(corsOptions))
app.use(express.json())

startCurrencyUpdater()

// Initialize the late fee cron job
scheduleLateFeeUpdates();

// Health check (gali palikti čia, nes paprasta)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// API maršrutai
app.use(authRoutes);
app.use(groupRoutes);
app.use(debtRoutes);
app.use(categoryRoutes);
app.use(friendsRoutes);
app.use(messagesRoutes);
app.use(UserRoutes);
app.use(currencyRoutes);
app.use(settingsRoutes);
app.use(notificationsRoutes);

app.use("/uploads", express.static(path.join(__dirname, "uploads")))

// Globalus klaidų handleris (nebūtina, bet faina turėti)
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(500).json({ message: 'Serverio klaida' });
});

app.listen(PORT, () => {
  console.log(`Backend serveris veikia ant http://localhost:${PORT}`);
});
