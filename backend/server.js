const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
const dotenv     = require('dotenv');
const path       = require('path');

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 5001;

// ── MIDDLEWARE ───────────────────────────────────────────────
app.use(cors({
  origin: [process.env.CLIENT_URL || 'http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ── ROUTES ───────────────────────────────────────────────────
app.use('/api/auth',         require('./routes/auth'));
app.use('/api/trips',        require('./routes/trips'));
app.use('/api/expenses',     require('./routes/expenses'));
app.use('/api/plans',        require('./routes/plans'));
app.use('/api/hotels',       require('./routes/hotels'));
app.use('/api/places',       require('./routes/places'));
app.use('/api/packing',      require('./routes/packing'));
app.use('/api/photos',       require('./routes/photos'));
app.use('/api/rentals',      require('./routes/rentals'));
app.use('/api/misc',         require('./routes/misc'));
app.use('/api/admin',        require('./routes/admin'));
app.use('/api/weather',      require('./routes/weather'));
app.use('/api/bucket',       require('./routes/bucket'));
app.use('/api/journal',      require('./routes/journal'));
app.use('/api/currency',     require('./routes/currency'));
app.use('/api/share',        require('./routes/share'));
app.use('/api/destinations', require('./routes/destinations'));
app.use('/api/visa',         require('./routes/visa'));

// ── HEALTH CHECK ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    time: new Date().toISOString(),
  });
});

// ── MONGODB CONNECTION ────────────────────────────────────────
const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    console.error('\n❌ MONGODB_URI is not set in backend/.env');
    console.error('   Copy backend/.env.example to backend/.env and fill in your values.\n');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log('✅ MongoDB Atlas connected');
  } catch (err) {
    if (err.message?.includes('IP') || err.message?.includes('whitelist') || err.message?.includes('Could not connect')) {
      console.error('\n❌ MongoDB connection failed — IP not whitelisted\n');
      console.error('══════════════════════════════════════════════════════');
      console.error('  FIX: Whitelist your IP in MongoDB Atlas');
      console.error('══════════════════════════════════════════════════════');
      console.error('  1. Go to → https://cloud.mongodb.com');
      console.error('  2. Click your project → Security → Network Access');
      console.error('  3. Click "+ Add IP Address"');
      console.error('  4. Click "Add Current IP Address"  ← easiest');
      console.error('     OR type 0.0.0.0/0 to allow all IPs (dev only)');
      console.error('  5. Click Confirm → wait 30 seconds → run npm start again');
      console.error('══════════════════════════════════════════════════════\n');
    } else {
      console.error('\n❌ MongoDB connection error:', err.message);
      console.error('   Check your MONGODB_URI in backend/.env\n');
    }
    process.exit(1);
  }
};

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀 Travelify backend running on http://localhost:${PORT}`);
    console.log(`   API: http://localhost:${PORT}/api/health\n`);
  });
});

mongoose.connection.on('disconnected', () => console.warn('⚠️  MongoDB disconnected'));
mongoose.connection.on('reconnected',  () => console.log('✅ MongoDB reconnected'));

module.exports = app;
