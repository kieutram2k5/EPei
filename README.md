# EPei — Sustainable Paper Innovation

## 🚀 Deploy lên Vercel (public URL cho mọi người)

### Bước 1: Tạo MySQL cloud miễn phí trên Railway

1. Vào [railway.app](https://railway.app) → **Login with GitHub**
2. Click **New Project** → **Deploy MySQL**
3. Vào tab **Variables**, copy:
   - `MYSQLHOST` → dùng làm `MYSQL_HOST`
   - `MYSQLUSER` → `MYSQL_USER`
   - `MYSQLPASSWORD` → `MYSQL_PASSWORD`
   - `MYSQLDATABASE` → `MYSQL_DATABASE`
   - `MYSQLPORT` → `MYSQL_PORT`

### Bước 2: Deploy lên Vercel

1. Push code lên GitHub
2. Vào [vercel.com](https://vercel.com) → **Import Project** → chọn repo
3. Vào **Settings → Environment Variables**, thêm:

```
MYSQL_HOST      = xxx.railway.app
MYSQL_PORT      = 3306
MYSQL_USER      = root
MYSQL_PASSWORD  = xxx
MYSQL_DATABASE  = epei_db
JWT_SECRET      = epei_random_secret_xyz
DB_SSL          = true
```

4. Click **Deploy** → Vercel tự build và deploy
5. URL dạng: `https://epei-xxx.vercel.app`

---

## 💻 Chạy local (không cần internet)

### Yêu cầu
- Node.js 18+
- XAMPP (MySQL đang chạy)

### Các bước

```bash
npm install
node server.js
```

→ Mở: **http://localhost:3000**

---

## 🔑 Tài khoản mặc định

| Vai trò | Email | Mật khẩu |
|---------|-------|----------|
| Admin | admin@epei.vn | admin123 |
| Khách hàng | user@epei.vn | user123 |

---

## 📁 Cấu trúc (Vercel-ready)

```
EPei/
├── api/                ← Vercel serverless functions
│   ├── _db.js          ← DB helper + JWT + auto-install
│   ├── auth.js         ← Đăng nhập/Đăng ký (JWT)
│   ├── products.js     ← Sản phẩm
│   ├── orders.js       ← Đơn hàng
│   ├── messages.js     ← Liên hệ
│   ├── payment.js      ← Thanh toán QR
│   └── users.js        ← Người dùng
├── public/             ← Frontend static (Vercel serve)
│   ├── index.html
│   ├── css/
│   ├── js/
│   └── uploads/
├── server.js           ← Local dev server
├── vercel.json         ← Vercel config
├── package.json
└── .env.example        ← Mẫu cấu hình
```

---

## 🌐 Liên hệ EPei
- 📞 0981 175 522
- 📧 EPeiviettiepcauchuyencuala@gmail.com
- 📘 [Facebook](https://www.facebook.com/share/1D4iqaXSMw/)
- 🎵 [TikTok @cauchuyencuala](https://www.tiktok.com/@cauchuyencuala)
