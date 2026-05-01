# TTL, TAKORADI GHANA — Enterprise ERP v2.0

KL ERP-inspired full-stack application.
**Stack:** React 18 · Spring Boot 3.2 · MongoDB · JWT · Excel Import/Export

---

## 🚀 Quick Start

### Option A — Docker (Recommended)
```bash
docker-compose up -d
```
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080

### Option B — Manual

**MongoDB**
```bash
# Install & start MongoDB locally (port 27017)
```

**Backend**
```bash
cd backend
mvn spring-boot:run
# Starts on http://localhost:8080
```

**Frontend**
```bash
cd frontend
npm install
npm start
# Starts on http://localhost:3000
```

---

## 🔐 Default Login Credentials

| Role     | Username  | Password  |
|----------|-----------|-----------|
| Admin    | admin     | admin123  |
| Employee | employee1 | emp123    |

---

## ✅ Features

| Module            | CRUD | Excel Import | Excel Export | Permissions |
|-------------------|------|-------------|-------------|-------------|
| Fleet Master      | ✅   | ✅           | ✅           | VIEW_TRUCKS |
| Drivers           | ✅   | ✅           | ✅           | DRIVERS     |
| Fuel Management   | ✅   | ✅           | ✅           | FUEL_ENTRY  |
| Trips & Challan   | ✅   | ✅           | ✅           | TRIPS       |
| Spare Parts       | ✅   | ✅           | ✅           | SPARE_PART_ISSUE |
| Tyre Stock        | ✅   | ✅           | ✅           | TYRE_ISSUE  |
| Maintenance       | ✅   | ✅           | ✅           | MAINTENANCE |
| Reports           | —    | —           | ✅           | VIEW_REPORTS |
| User Management   | ✅   | —           | ✅           | Admin only  |

### Excel Import — How it works
1. Click **📄 Template** to download the Excel template for that section
2. Fill in the template with your data
3. Click **📥 Import Excel** and upload the filled file
4. Data is validated and inserted row by row — errors are reported

### Permission System
- **Admin**: Full access to all modules including User Management
- **Employee**: Only assigned modules visible in sidebar
- Admin can grant/revoke per-module access from User Management page

---

## 📁 Project Structure
```
logistics-v7/
├── frontend/          React 18 app (KL ERP style)
│   └── src/
│       ├── components/UI.jsx    (shared components + Excel utils)
│       ├── components/Layout.jsx (sidebar + topbar)
│       ├── context/AuthContext.jsx
│       ├── api/api.js
│       └── pages/               (Dashboard, Trucks, Drivers, ...)
├── backend/           Spring Boot 3 + MongoDB
│   └── src/main/java/com/logistics/
│       ├── model/               (MongoDB documents)
│       ├── repository/          (MongoRepository interfaces)
│       ├── controller/          (REST endpoints)
│       ├── security/            (JWT filter + util)
│       └── config/              (Security, DataSeeder)
└── docker-compose.yml
```

---

## 🔗 API Endpoints

| Method | Endpoint | Description |
|--------|---------|-------------|
| POST | /api/auth/login | Login |
| GET  | /api/trucks | All trucks |
| GET  | /api/trucks/numbers | Truck numbers list |
| POST | /api/trucks | Add truck |
| PUT  | /api/trucks/{id} | Update truck |
| DELETE | /api/trucks/{id} | Delete truck |
| GET  | /api/fuel/monthly?month=&year= | Monthly excess report |
| POST | /api/spare-parts/issues | Issue spare parts (auto updates stock) |
| POST | /api/spare-parts/purchases | Record purchase (auto updates stock) |
| POST | /api/tyres/issues | Issue tyres (auto updates stock) |
| POST | /api/tyres/purchases | Record purchase (auto updates stock) |
| GET  | /api/admin/users | All users (Admin only) |
| POST | /api/admin/users | Create user (Admin only) |
| PUT  | /api/admin/users/{id} | Update user + permissions (Admin only) |
