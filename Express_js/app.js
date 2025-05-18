const express = require('express');
const cors = require('cors');
const sequelize = require('./config/db');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');

const app = express();

// Middleware yang WAJIB ada
app.use(cors());
app.use(express.json()); // <--- INI PENTING!
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/', authRoutes);
app.use('/:username', dashboardRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Catascan! Backend is running.' });
});

sequelize.sync()
  .then(() => app.listen(3000, () => console.log('Express running at http://localhost:3000')))
  .catch(err => console.error(err));
