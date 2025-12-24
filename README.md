# UGC Leaks - Roblox UGC Tracking System

A modern full-stack application for tracking Roblox UGC (User-Generated Content) drops with real-time information, scheduling, and a beautiful Roblox-themed interface.

## 📁 Project Structure

```
UGC Leaks/
├── frontend/                 # Next.js 14 frontend application
│   ├── src/
│   │   ├── app/
│   │   │   ├── leaks/       # UGC items display page
│   │   │   ├── schedule/    # Schedule creation page
│   │   │   ├── page.tsx     # Landing page
│   │   │   └── layout.tsx   # Root layout
│   │   └── InstructionParser.tsx  # URL parsing utility
│   ├── package.json
│   ├── tailwind.config.js
│   └── tsconfig.json
│
├── backend/                  # Express.js backend API
│   ├── server.ts            # Main API server with CRUD endpoints
│   ├── package.json
│   ├── tsconfig.json
│   └── .gitignore
│
├── database.sql             # PostgreSQL schema (Neon.tech)
├── .env.example             # Environment variables template
├── .env.local               # Local environment variables (gitignored)
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (Neon.tech recommended)
- Git

### 1. Setup Database (Neon.tech)

1. Sign up at [neon.tech](https://console.neon.tech/)
2. Create a new project and database
3. Copy your connection string: `postgresql://[username]:[password]@[host]/[database]`

### 2. Run Database Schema

```bash
# Using psql (PostgreSQL command line)
psql postgresql://[username]:[password]@[host]/[database] < database.sql
```

Or run the SQL commands in the Neon dashboard query editor.

### 3. Environment Setup

```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local and add your Neon database URL
DATABASE_URL=postgresql://[username]:[password]@[host]/[database]
BACKEND_PORT=5000
NODE_ENV=development
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api
CORS_ORIGIN=http://localhost:3000
```

### 4. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend (in another terminal)
cd frontend
npm install
```

### 5. Start Development Servers

```bash
# Terminal 1 - Backend (from backend directory)
npm run dev
# Server runs on http://localhost:5000

# Terminal 2 - Frontend (from frontend directory)
npm run dev
# Application runs on http://localhost:3000
```

## 📊 Database Schema

### Tables

- **ugc_items** - Published UGC items in the catalog
- **scheduled_items** - Upcoming scheduled UGC releases
- **creators** - Creator information and statistics
- **color_gradients** - Pre-generated random gradients for cards

### Key Fields

Each item includes:
- `title` - Item display name
- `item_name` - Technical item name
- `creator` - Creator username
- `creator_link` - Creator profile URL
- `stock` - Available quantity
- `release_date_time` - Release timestamp
- `method` - Drop method (Web Drop, In-Game, Unknown)
- `instruction` - How to obtain the item
- `game_link` - Game experience link
- `item_link` - Direct catalog link
- `image_url` - Item preview image
- `limit_per_user` - Purchase limit per account
- `color` - Card border color (HEX)

## 🎨 Features

### Frontend (Next.js)
- **5-Column Grid Layout** - Display cards in responsive grid
- **Random Color Generation** - Each card gets unique border color from 5 main colors
- **Random Gradient Animations** - 4-color gradient background per card
- **Search & Filter** - Filter by creator, method, stock
- **Schedule Management** - Create and manage UGC release schedules
- **Clickable Links** - Automatic URL detection in instructions
- **Timezone Support** - Relative time display with user timezone
- **Roblox Theme** - Vibrant blocky UI with Roblox aesthetic

### Backend (Express.js)
- **REST API** - Full CRUD operations for UGC items
- **Database Integration** - PostgreSQL via Neon.tech
- **CORS Support** - Cross-origin requests from frontend
- **Error Handling** - Comprehensive error management
- **UUID Support** - Unique identification for all items
- **Filtering & Pagination** - Query filtering and result pagination

## 🔌 API Endpoints

### Items
- `GET /api/items` - List all UGC items
- `GET /api/items/:id` - Get specific item
- `POST /api/items` - Create new item
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item

### Scheduled Items
- `GET /api/scheduled` - List scheduled items
- `POST /api/scheduled` - Create scheduled item
- `DELETE /api/scheduled/:id` - Remove scheduled item

### Health
- `GET /api/health` - Check API and database status

## 🛠️ Development

### Frontend Development

```bash
cd frontend
npm run dev
npm run build
npm start
```

### Backend Development

```bash
cd backend
npm run dev     # Uses nodemon for auto-restart
npm run build   # Compile TypeScript
npm start       # Run compiled JavaScript
```

## 📝 Environment Variables

Create `.env.local` in the root directory:

```env
# Database
DATABASE_URL=postgresql://[username]:[password]@[host]/[database]

# Backend
BACKEND_PORT=5000
NODE_ENV=development

# Frontend
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api

# CORS
CORS_ORIGIN=http://localhost:3000
```

## 🎯 Roblox Color Palette

```javascript
#ff006e - Pink (Primary)
#00d9ff - Cyan (Secondary)
#ffbe0b - Yellow (Accent 1)
#00ff41 - Lime (Accent 2)
#b54eff - Purple (Accent 3)
#ff8c42 - Orange
#ff1744 - Red
#2196f3 - Blue
#667eea - Indigo
#764ba2 - Violet
```

## 🚀 Production Deployment

### Frontend (Vercel)
```bash
cd frontend
npm run build
vercel
```

### Backend (Railway/Heroku)
```bash
cd backend
npm run build
# Deploy to Railway or Heroku
```

Update `NEXT_PUBLIC_API_BASE_URL` to production backend URL.

## 📚 Technologies Used

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Express.js, TypeScript, PostgreSQL
- **Database**: Neon.tech PostgreSQL
- **Tools**: Nodemon, CORS, UUID

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

MIT License - Feel free to use this project!

## 🆘 Support

For issues or questions:
1. Check `.env.local` configuration
2. Verify database connection
3. Check backend/frontend console for errors
4. Ensure both servers are running on correct ports

---
