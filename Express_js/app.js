const express = require('express');
const cors = require('cors');
const sequelize = require('./config/db');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// ✅ PUBLIC ROUTES (no token)
app.use('/auth', authRoutes);

// ✅ PRIVATE ROUTES (butuh token JWT dari Bearer)
app.use('/:username/dashboard', dashboardRoutes);

// Optional root
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Catascan! Backend is running.' });
});

sequelize.sync()
  .then(() => app.listen(3000, () => console.log('✅ Server jalan di http://localhost:3000')))
  .catch(err => console.error(err));
