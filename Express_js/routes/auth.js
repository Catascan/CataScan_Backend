const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { Op } = require('sequelize');
require('dotenv').config();

const router = express.Router();

router.get('/register', (req, res) => {
  res.status(200).json({ message: 'Gunakan POST /register dengan JSON: { username, password }' });
});

router.post('/register', async (req, res) => {
  try {
    const { username, email, password, retype_password } = req.body;

    if (!username || !email || !password || !retype_password) {
      return res.status(400).json({ error: 'Semua field wajib diisi' });
    }

    if (password !== retype_password) {
      return res.status(400).json({ error: 'Password dan konfirmasi tidak sama' });
    }

    const userExist = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email }]
      }
    });

    if (userExist) {
      return res.status(409).json({ error: 'Username atau email sudah digunakan' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, password: hashed });

    console.log(`[201] Register berhasil untuk user: ${user.username}`);
    res.status(201).json({
      message: '✅ Register berhasil',
      user: { id: user.id, username: user.username, email: user.email }
    });
  } catch (err) {
    console.error(`[500] Gagal register: ${err.message}`);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});



router.get('/login', (req, res) => {
  res.status(200).json({ message: 'Gunakan POST /login dengan JSON: { username, password }' });
});

router.post('/login', async (req, res) => {
  try {
    const { login, password } = req.body;
    if (!login || !password) {
      return res.status(400).json({ error: 'Login dan password wajib diisi' });
    }

    const user = await User.findOne({
      where: {
        [Op.or]: [{ username: login }, { email: login }]
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Password salah' });
    }

    const token = jwt.sign({ id: user.id }, process.env.SECRET_KEY);
    console.log(`[200] Login berhasil untuk: ${user.username}`);
    res.status(200).json({
      message: '✅ Login berhasil',
      greeting: `Halo, ${user.username}!`,
      token
    });
  } catch (err) {
    console.error(`[500] Gagal login: ${err.message}`);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});



module.exports = router;
