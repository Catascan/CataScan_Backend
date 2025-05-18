const express = require('express');
const multer = require('multer');
const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');
const jwt = require('jsonwebtoken');

const Article = require('../models/Article');
const Result = require('../models/Result');
const User = require('../models/User');

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const originalExt = file.originalname.split('.').pop();
    cb(null, `${file.fieldname}-${uniqueSuffix}.${originalExt}`);
  }
});
const upload = multer({ storage });

// ✅ Middleware: Ambil user dari token (Bearer Token)
router.use(async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // format: Bearer <token>
  if (!token) return res.status(401).json({ error: 'Token tidak ditemukan' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    if (!user) return res.status(401).json({ error: 'User tidak valid' });

    req.user = user;
    next();
  } catch (err) {
    console.error(`[401] Auth error: ${err.message}`);
    return res.status(401).json({ error: 'Token tidak valid', details: err.message });
  }
});

// GET /:username/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const articles = await Article.findAll({ where: { UserId: req.user.id } });
    const results = await Result.findAll({ where: { UserId: req.user.id } });

    res.status(200).json({
      message: `Halo, ${req.user.username}!`,
      all_articles: articles,
      your_predictions: results
    });
  } catch (err) {
    res.status(500).json({ error: 'Dashboard gagal dimuat', details: err.message });
  }
});

// POST /:username/dashboard/insert_article
router.post('/insert_article', async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'Judul dan konten wajib diisi' });

    const article = await Article.create({
      title,
      content,
      UserId: req.user.id
    });

    res.status(201).json({ message: '✅ Artikel berhasil ditambahkan', article });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menyimpan artikel', details: err.message });
  }
});

// POST /:username/dashboard/predict
router.post('/predict', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Gambar wajib diunggah' });

    const form = new FormData();
    form.append('image', fs.createReadStream(req.file.path));
    // 🚫 Tidak kirim user_id

    const flaskRes = await axios.post('http://localhost:5000/predict', form, {
      headers: form.getHeaders()
    });

    const { prediction, explanation, confidence_scores, photoUrl } = flaskRes.data;

    const result = await Result.create({
      image_path: req.file.path,
      prediction,
      explanation,
      UserId: req.user.id
    });

    res.status(200).json({
      message: '✅ Prediksi berhasil disimpan',
      prediction,
      explanation,
      confidence_scores,
      photoUrl
    });
  } catch (err) {
    res.status(500).json({ error: 'Gagal memproses prediksi', details: err.message });
  }
});

router.get('/history', async (req, res) => {
  try {
    const results = await Result.findAll({
      where: { UserId: req.user.id },
      order: [['createdAt', 'DESC']],
    });

    const history = results.map(r => ({
      id: r.id,
      prediction: r.prediction,
      explanation: r.explanation,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      photoUrl: `http://localhost:3000/${r.image_path.replace(/\\/g, '/')}` // Ubah jadi URL
    }));

    res.status(200).json({
      message: `Riwayat prediksi milik ${req.user.username}`,
      history
    });
  } catch (err) {
    console.error(`[500] History error: ${err.message}`);
    res.status(500).json({ error: 'Gagal mengambil history', details: err.message });
  }
});



module.exports = router;
