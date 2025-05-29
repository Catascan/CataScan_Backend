# 🧠 Catascan API Documentation

RESTful API untuk aplikasi deteksi katarak berbasis gambar retina.  
Backend menggunakan **Express.js** (autentikasi, user, dashboard) dan **Flask** (model prediksi katarak).

---

## 🔐 Authentication

### 📩 `POST /auth/register`

Registrasi user baru.

**Content-Type:** `application/json`

#### Request Body
```json
{
  "username": "defaultuser",
  "email": "defaultuser@mail.com",
  "password": "123",
  "retype_password": "123"
}
```

#### Response
```json
{
  "message": "✅ Register berhasil",
  "user": {
    "id": 1,
    "username": "defaultuser",
    "email": "defaultuser@mail.com"
  }
}
```

---

### 🔑 `POST /auth/login`

Login dan mendapatkan token JWT.

**Content-Type:** `application/json`

#### Request Body
```json
{
  "login": "defaultuser",
  "password": "123"
}
```

#### Response
```json
{
  "message": "✅ Login berhasil",
  "greeting": "Halo, defaultuser!",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 🔓 `POST /auth/logout`

Logout dan blacklist token aktif.

#### Headers
```
Authorization: bear <your_token>
```

#### Response
```json
{
  "message": "✅ Logout berhasil dan token diblacklist."
}
```

---

## 👤 Profile

### 🖼️ `PATCH /auth/profile/edit`

Update foto profil user.

**Content-Type:** `multipart/form-data`  
**Headers:**
```
Authorization: bear <your_token>
```

#### Form Data
- `image`: file (.jpg/.png)

#### Response
```json
{
  "message": "✅ Gambar profil berhasil diperbarui",
  "user": {
    "id": 1,
    "username": "defaultuser",
    "email": "defaultuser@mail.com",
    "image_link": "http://localhost:3000/......"
    "createdAt": "yyy-mmm-ddd",
    "updatedAt": "yyy-mmm-ddd"
  }
}
```

---

## 🔬 Cataract Detection

### 📤 `POST /user/dashboard/predict`

Kirim gambar retina untuk analisis model deteksi katarak.

**Content-Type:** `multipart/form-data`  
**Headers:**
```
Authorization: bear <your_token>
```

#### Form Data
- `image`: file gambar retina (.jpg/.png)

#### Response
```json
{
  "message": "✅ Prediksi berhasil disimpan",
  "prediction": "normal",
  "explanation": "Tidak ditemukan indikasi katarak.",
  "confidence_scores": {
    "immature": 0.01,
    "mature": 0.02,
    "normal": 0.97
  },
  "photoUrl": "http://localhost:5000/static/uploads/image-xxx.jpg"
}
```

---

### 📚 `GET /user/dashboard/history`

Lihat riwayat prediksi milik user yang sedang login.

**Headers:**
```
Authorization: bear <your_token>
```

#### Response
```json
{
  "message": "Riwayat prediksi milik defaultuser",
  "history": [
    {
      "id": 1,
      "prediction": "normal",
      "explanation": "Tidak ditemukan indikasi katarak.",
      "createdAt": "2025-05-25T00:59:37.650Z",
      "photoUrl": "http://localhost:3000/uploads/image-xxx.jpg"
    }
  ]
}
```

---

## 📋 Ringkasan Endpoint

| Method | Endpoint                   | Auth | Content-Type          | Deskripsi                         |
|--------|----------------------------|------|------------------------|-----------------------------------|
| POST   | `/auth/register`           | ❌   | `application/json`     | Daftarkan user baru              |
| POST   | `/auth/login`              | ❌   | `application/json`     | Login dan dapatkan token         |
| POST   | `/auth/logout`             | ✅   | -                      | Logout dan blacklist token       |
| PATCH  | `/auth/profile/edit`       | ✅   | `multipart/form-data`  | Ubah gambar profil               |
| POST   | `/user/dashboard/predict`  | ✅   | `multipart/form-data`  | Prediksi kondisi dari gambar     |
| GET    | `/user/dashboard/history`  | ✅   | -                      | Ambil riwayat prediksi user      |

---

## ⚙️ Authorization Header Format

Gunakan token JWT seperti berikut:
```
Authorization: bear <your_token>
```
> ⚠️ Gunakan `bear`, bukan `bearer`.

---

## 🧪 Tips Pengujian

- Gunakan Postman atau Thunder Client
- Endpoint upload harus pakai `form-data`
- Simpan token hasil login untuk digunakan di endpoint lain
- Jika token expired, lakukan login ulang

---
