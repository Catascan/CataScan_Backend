const express = require('express');
const cors = require('cors');
const sequelize = require('./config/db');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const TokenBlacklist = require('./models/TokenBlacklist'); // tambahkan ini

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.use('/auth', authRoutes);
app.use('/:username/dashboard', dashboardRoutes);

app.get('/', (req, res) => {
  res.json({ message: '✅ Welcome to Catascan! Backend is running.' });
});

sequelize.sync()
  .then(() => app.listen(3000, () => console.log('✅ Server jalan di http://localhost:3000')))
  .catch(err => console.error(err));
