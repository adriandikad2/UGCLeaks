# 🎮 UGC Leaks

Track upcoming Roblox UGC drops with real-time updates, scheduling, and a customizable theme system.

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql)
![JWT](https://img.shields.io/badge/JWT-Auth-000?logo=jsonwebtokens)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-11-0055FF?logo=framer)

---

## 🚀 Quick Start

```bash
# Clone and install
cd frontend && npm install

# Set environment
cp .env.example .env.local
# Edit DATABASE_URL and JWT_SECRET

# Run development
npm run dev
```

---

## 🗂️ Structure

```
frontend/src/
├── app/
│   ├── api/           # Next.js API routes
│   ├── leaks/         # Main UGC display page
│   ├── schedule/      # Schedule management
│   ├── auth/          # Sign in/up pages
│   └── components/    # Theme, Playground, etc.
└── lib/               # Auth, API, DB utilities
```

---

## 📦 Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| Database | PostgreSQL (Neon.tech) |
| Auth | JWT + bcryptjs |
| Animation | Framer Motion |
| Icons | Lucide React |

---

## 📄 License

MIT License
