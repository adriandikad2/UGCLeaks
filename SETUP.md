# 🚀 Quick Setup Guide

## Step 1: Create Neon.tech Database

1. Go to https://console.neon.tech/
2. Sign up / Log in
3. Create a new project
4. Copy your connection string (format: `postgresql://username:password@host/database`)

## Step 2: Configure Environment

```bash
# Copy the template
cp .env.example .env.local

# Edit .env.local with your Neon connection string
DATABASE_URL=postgresql://user:password@host.neon.tech/database
```

## Step 3: Setup Database Schema

**Option A: Using psql (Command Line)**
```bash
psql postgresql://user:password@host.neon.tech/database < database.sql
```

**Option B: Using Neon Dashboard**
1. Open your Neon project dashboard
2. Go to SQL Editor
3. Copy-paste the contents of `database.sql`
4. Execute

## Step 4: Install & Run

```bash
# Install backend dependencies
cd backend
npm install

# In another terminal, install frontend dependencies
cd frontend
npm install

# Run backend (from backend folder)
npm run dev

# Run frontend (from frontend folder)
npm run dev
```

## Step 5: Access Application

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000
- **API Health Check**: http://localhost:5000/api/health

## 📋 Folder Structure After Setup

```
UGC Leaks/
├── frontend/
│   ├── .next/
│   ├── node_modules/
│   ├── src/
│   ├── package.json
│   └── ...
├── backend/
│   ├── dist/           (compiled JS)
│   ├── node_modules/
│   ├── server.ts
│   ├── package.json
│   └── ...
├── database.sql
├── .env.local          (DO NOT COMMIT - contains secrets)
├── .env.example        (Template only)
└── README.md
```

## 🔑 Key Points

- **Never commit `.env.local`** - It contains your database credentials
- **Database URL Format**: `postgresql://user:password@host.region.neon.tech/dbname`
- **Ports**: Backend (5000), Frontend (3000)
- **API Base URL**: Frontend uses `http://localhost:5000/api` for local development

## ✅ Verification

After setup, you should see:

**Backend Console:**
```
🚀 Backend server running on http://localhost:5000
💾 Database: Connected to Neon PostgreSQL
```

**Frontend Console:**
```
▲ Next.js 14.0.0
- Local:        http://localhost:3000
```

## 🐛 Troubleshooting

**Database connection error?**
- Verify DATABASE_URL in .env.local
- Check Neon project is active
- Ensure network access is allowed

**Port already in use?**
- Change BACKEND_PORT in .env.local
- Update NEXT_PUBLIC_API_BASE_URL to match

**Missing dependencies?**
```bash
cd backend && npm install
cd frontend && npm install
```

## 📚 Next Steps

1. Explore the `/leaks` page - 5-column card grid with filters
2. Check `/schedule` page - Create scheduled UGC releases
3. Review API endpoints in backend/server.ts
4. Customize Roblox color palette in tailwind.config.js

---

Need help? Check README.md for more details! 💪
