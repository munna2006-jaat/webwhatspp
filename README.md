# 🟢 WaCRM — WhatsApp CRM Platform

A self-hosted WhatsApp Business CRM platform (Bizneeti-style) built with Meta's Cloud API.

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18+ → [Download](https://nodejs.org)
- **MongoDB** → [Download](https://www.mongodb.com/try/download/community) or use [MongoDB Atlas](https://cloud.mongodb.com)
- **Redis** (optional, for campaign queue) → `brew install redis`

### 1. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure Environment

```bash
# Copy example env
cp backend/.env.example backend/.env

# Edit .env with your values (or leave placeholders for now)
```

### 3. Start MongoDB

```bash
# If installed locally:
mongod

# Or use MongoDB Atlas (update MONGODB_URI in .env)
```

### 4. Run the App

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

### 5. Open in Browser
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Health Check: http://localhost:5000/api/health

### 6. Create Your Account
- Go to http://localhost:5173/signup
- Create an admin account
- Start using the CRM!

---

## 📱 Features

| Feature | Description |
|---------|-------------|
| 📊 Dashboard | CRM Command Center with 13 real-time metrics |
| 💬 Conversations | WhatsApp-style real-time chat inbox |
| 👥 Contacts | Full contact management with tags & statuses |
| 📢 Campaigns | Bulk messaging with audience targeting |
| ⚡ Automation | Chatbot rules & auto-replies |
| 📋 Spreadsheet | Editable table view (like Google Sheets) |
| 👥 Team | Multi-user with roles (Admin/Manager/Agent) |
| ⚙️ Settings | API config, quick replies, working hours |

---

## 🔗 Connect WhatsApp

1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Create an app → Add WhatsApp product
3. Get your: Phone Number ID, Access Token, App Secret
4. Enter them in **Settings → API Configuration** in the CRM
5. Or update `backend/.env` directly

---

## 📁 Project Structure

```
├── backend/
│   ├── src/
│   │   ├── config/       # DB & env config
│   │   ├── models/       # MongoDB schemas
│   │   ├── routes/       # API endpoints
│   │   ├── services/     # WhatsApp API & webhook processing
│   │   ├── middleware/    # Auth, role check, signature verify
│   │   └── server.js     # Express + Socket.io entry
│   └── .env              # Environment variables
│
└── frontend/
    └── src/
        ├── components/   # Reusable UI components
        ├── context/      # Auth & Socket contexts
        ├── pages/        # All page components
        ├── services/     # API client
        └── App.jsx       # Router
```
