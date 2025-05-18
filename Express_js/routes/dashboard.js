const express = require('express');
const multer = require('multer');
const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');

const Article = require('../models/Article');
const Result = require('../models/Result');
const User = require('../models/User');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Middleware: Ambil username dari /:username/...
router.use(async (req, res, next) => {
  const username = req.baseUrl.slice(1); // misal /admin
  try {
    const user = await User.findOne({ where: { username } });
    if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });
    req.user = user;
    next();
  } catch (err) {
    console.error(`[500] Gagal ambil user: ${err.message}`);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// GET /:username/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const articles = await Article.findAll({
      // hanya ambil field yang diperlukan
      attributes: ['id', 'title', 'content', 'createdAt', 'updatedAt'],
      order: [['createdAt', 'DESC']]
    });

    const results = await Result.findAll({ where: { UserId: req.user.id } });

    res.status(200).json({
      message: `Halo, ${req.user.username}!`,
      all_articles: articles,
      your_predictions: results
    });
  } catch (err) {
    console.error(`[500] Dashboard error: ${err.message}`);
    res.status(500).json({ error: 'Gagal mengambil data dashboard', details: err.message });
  }
});



// POST /:username/dashboard/insert_article
router.post('/dashboard/insert_article', async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'Judul dan konten wajib diisi' });

    const article = await Article.create({
      title,
      content,
      UserId: req.user.id
    });

    console.log(`[201] Artikel oleh ${req.user.username} berhasil disimpan`);
    res.status(201).json({
      message: '✅ Artikel berhasil ditambahkan',
      article
    });
  } catch (err) {
    console.error(`[500] Tambah artikel error: ${err.message}`);
    res.status(500).json({ error: 'Gagal menyimpan artikel', details: err.message });
  }
});

// GET /:username/dashboard/view_articles
router.get('/dashboard/view_articles', async (req, res) => {
  try {
    const articles = await Article.findAll({ where: { UserId: req.user.id } });
    console.log(`[200] Artikel milik ${req.user.username} ditampilkan`);
    res.status(200).json({ user: req.user.username, articles });
  } catch (err) {
    console.error(`[500] Ambil artikel error: ${err.message}`);
    res.status(500).json({ error: 'Gagal mengambil artikel', details: err.message });
  }
});

// POST /:username/dashboard/predict
router.post('/dashboard/predict', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Gambar wajib diunggah' });

    const form = new FormData();
    form.append('image', fs.createReadStream(req.file.path));

    const flaskRes = await axios.post('http://localhost:5000/predict', form, {
      headers: form.getHeaders()
    });

    const { prediction, explanation } = flaskRes.data;
    const result = await Result.create({
      image_path: req.file.path,
      prediction,
      explanation,
      UserId: req.user.id
    });

    console.log(`[200] Prediksi ${prediction} disimpan untuk ${req.user.username}`);
    res.status(200).json({
      message: '✅ Prediksi berhasil disimpan',
      result
    });
  } catch (err) {
    console.error(`[500] Prediksi error: ${err.message}`);
    res.status(500).json({ error: 'Gagal memproses prediksi', details: err.message });
  }
});

module.exports = router;
