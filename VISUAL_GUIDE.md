# 🎨 Visual Guide - UGC Leaks

## Project Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    UGC LEAKS - FULL STACK                       │
└─────────────────────────────────────────────────────────────────┘

                         ┌─────────────────┐
                         │   Neon.tech     │
                         │   PostgreSQL    │
                         │   (Database)    │
                         └────────┬────────┘
                                  │
                    ┌─────────────▼──────────────┐
                    │    Backend (Express.js)    │
                    │    Port: 5000              │
                    │    /api/items              │
                    │    /api/scheduled          │
                    │    /api/health             │
                    └─────────────┬──────────────┘
                                  │ (Fetch/API Calls)
                    ┌─────────────▼──────────────┐
                    │  Frontend (Next.js 14)     │
                    │  Port: 3000                │
                    │  /leaks (5-col grid)       │
                    │  /schedule (create)        │
                    └────────────────────────────┘
                                  │
                         ┌────────▼────────┐
                         │   User Browser   │
                         └──────────────────┘
```

---

## Component Structure

```
┌─ Layout
│  ├─ FloatingBlocks (animated background)
│  └─ Navigation
│
├─ Pages
│  ├─ / (Home)
│  │  ├─ Rainbow Title
│  │  ├─ Feature Cards
│  │  └─ CTA Buttons
│  │
│  ├─ /leaks (Main Page)
│  │  ├─ Search Bar
│  │  ├─ Filter/Sort Controls
│  │  └─ Card Grid (5 columns)
│  │     ├─ Random Color Border
│  │     ├─ Animated Gradient Bar
│  │     ├─ Item Image
│  │     ├─ Title (Clickable)
│  │     ├─ Creator (Clickable)
│  │     ├─ Stats Grid (4 items)
│  │     ├─ Instructions (URL Parsing)
│  │     └─ Action Buttons
│  │
│  └─ /schedule (Create Schedule)
│     ├─ Form (Create Items)
│     └─ Scheduled Items Grid
│        └─ Same as /leaks cards
│
└─ Components
   ├─ InstructionParser
   │  ├─ ClickableInstructions (URL detection)
   │  └─ NoLinkTemplate (empty state)
   │
   └─ API Client
      └─ lib/api.ts (utility functions)
```

---

## Grid Layout Progression

### Mobile (1 Column)
```
┌──────────────────┐
│   Card 1         │
└──────────────────┘
┌──────────────────┐
│   Card 2         │
└──────────────────┘
┌──────────────────┐
│   Card 3         │
└──────────────────┘
```

### Tablet (2-3 Columns)
```
┌────────────┐  ┌────────────┐
│  Card 1    │  │  Card 2    │
└────────────┘  └────────────┘
┌────────────┐  ┌────────────┐
│  Card 3    │  │  Card 4    │
└────────────┘  └────────────┘
```

### Desktop (5 Columns)
```
┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐
│ 1  │ │ 2  │ │ 3  │ │ 4  │ │ 5  │
└────┘ └────┘ └────┘ └────┘ └────┘
┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐
│ 6  │ │ 7  │ │ 8  │ │ 9  │ │ 10 │
└────┘ └────┘ └────┘ └────┘ └────┘
```

---

## Card Component Breakdown

```
┌──────────────────────────────────────┐
│ ═══════════════════════════════════  │  ◄─ Animated Gradient Bar (6s)
│ [Outline Color - Randomly Selected]  │  ◄─ Card Border (1 of 5 colors)
│                                      │
│      ┌──────────────────────┐        │
│      │                      │        │
│      │    Item Image        │        │  ◄─ Image with colored border
│      │                      │        │
│      └──────────────────────┘        │
│                                      │
│  Neon Glow Visor                     │  ◄─ Title (Clickable if itemLink)
│  by RobloxianCreations               │  ◄─ Creator (Clickable if creatorLink)
│                                      │
│  ┌─────────┬─────────┬─────────┐    │
│  │ 📦 500  │ 🎯 Web  │ 🔢 3x  │  ◄─ Stats (4 items total)
│  └─────────┴─────────┴─────────┘    │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ 📖 How to Get It               │  │ ◄─ Instructions with clickable URLs
│  │ Visit https://... (clickable)  │  │
│  └────────────────────────────────┘  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ 🛍️ View Item   (or disabled)   │  │ ◄─ Action Buttons (conditional)
│  │ 🎮 Join Game   (or disabled)   │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

---

## Color System

### Main Palette (Outline Selection)
```
#ff006e ███ Pink    (Primary)
#00d9ff ███ Cyan    (Secondary)
#ffbe0b ███ Yellow  (Accent 1)
#00ff41 ███ Lime    (Accent 2)
#b54eff ███ Purple  (Accent 3)
```

### Extended Palette (Gradient Sources)
```
#ff006e ███ Pink         #ff1744 ███ Red
#00d9ff ███ Cyan         #2196f3 ███ Blue
#ffbe0b ███ Yellow       #667eea ███ Indigo
#00ff41 ███ Lime         #764ba2 ███ Violet
#b54eff ███ Purple       #f093fb ███ Pink
#ff8c42 ███ Orange       #4facfe ███ Blue
```

---

## Data Flow Diagram

```
User Browser
    │
    ├─ View /leaks page
    │
    └─► Frontend (Next.js)
        │
        ├─ Load initial state (mock data)
        │
        ├─ Render 5-column grid
        │  ├─ generateRandomColor()
        │  └─ generateRandomGradient()
        │
        ├─ User Actions:
        │  ├─ Search
        │  ├─ Filter
        │  ├─ Sort
        │  └─ Click Links
        │
        └─► (Optional) Call Backend API
            │
            └─► Backend (Express.js)
                │
                ├─ Query PostgreSQL
                │  └─ Neon.tech
                │
                └─► Return JSON Data
                    │
                    └─► Frontend Updates Grid
                        └─► User Sees New Data
```

---

## API Endpoint Flow

```
POST /api/items
  ├─ Request Body
  │  ├─ title: string
  │  ├─ item_name: string
  │  ├─ creator: string
  │  ├─ stock: number
  │  ├─ release_date_time: timestamp
  │  ├─ method: enum
  │  ├─ instruction: string
  │  ├─ game_link: string
  │  ├─ item_link: string
  │  ├─ image_url: string
  │  ├─ limit_per_user: number
  │  └─ color: hex (optional)
  │
  └─► Database
      ├─ Validate input
      ├─ Generate UUID
      ├─ INSERT into ugc_items
      └─ Return created item with ID
```

---

## Development Workflow

```
1. Create .env.local
   │
   ├─ DATABASE_URL=postgresql://...
   ├─ BACKEND_PORT=5000
   └─ NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api
   │
2. Setup Database
   │
   ├─ Run: psql <url> < database.sql
   └─ Tables created ✓
   │
3. Start Backend
   │
   ├─ cd backend
   ├─ npm install
   ├─ npm run dev
   └─ Listening on :5000 ✓
   │
4. Start Frontend
   │
   ├─ cd frontend
   ├─ npm install
   ├─ npm run dev
   └─ Ready on :3000 ✓
   │
5. Development
   │
   ├─ Edit files
   ├─ Hot reload active
   └─ Test features
   │
6. Deploy
   │
   ├─ Frontend → Vercel
   ├─ Backend → Railway/Heroku
   └─ Database → Neon.tech (already set)
```

---

## Responsive Breakpoints

```
Mobile (< 640px)
├─ 1 column
├─ Full width padding
└─ Stacked controls

Tablet (640px - 1024px)
├─ 2-3 columns
├─ Responsive padding
└─ Side-by-side controls

Desktop (> 1024px)
├─ 5 columns
├─ Max-width container
└─ Flex controls
```

---

## Animation States

### Gradient Animation (Per Card)
```
Frame 0%:     ████ (background-position: 0%)
Frame 50%:    ████ (background-position: 100%)
Frame 100%:   ████ (background-position: 0%)
Duration: 6 seconds, infinite loop, ease timing
```

### Card Entrance
```
Scale: 0% → 100%
Opacity: 0 → 1
Duration: 0.5s
Easing: cubic-bezier(0.68, -0.55, 0.265, 1.55)
```

### Hover Effects
```
Card:
  ├─ Scale: 1 → 1.05
  └─ Duration: 0.3s

Button:
  ├─ Scale: 1 → 1.05
  ├─ Glow: shadow increases
  └─ Duration: 0.3s
```

---

## File Size References

| File | Size | Purpose |
|------|------|---------|
| server.ts | ~10KB | Full backend API |
| leaks/page.tsx | ~15KB | Card grid display |
| schedule/page.tsx | ~18KB | Schedule manager |
| database.sql | ~8KB | DB schema |
| api.ts | ~6KB | API utilities |
| InstructionParser.tsx | ~2KB | URL parsing |

**Total Frontend Code**: ~50KB
**Total Backend Code**: ~10KB
**Database Schema**: ~8KB

---

## Testing Checklist

```
Frontend Tests:
☐ Grid displays 5 columns on desktop
☐ Grid displays 3 columns on tablet
☐ Grid displays 2 columns on mobile
☐ Grid displays 1 column on small mobile
☐ Colors are randomly selected
☐ Gradients animate correctly
☐ Search filters work
☐ Filter dropdown works
☐ Sort options work
☐ Click links work
☐ Creator links work (if provided)
☐ Buttons are disabled when links empty

Backend Tests:
☐ GET /api/items returns data
☐ GET /api/items/:id returns single item
☐ POST /api/items creates item
☐ PUT /api/items/:id updates item
☐ DELETE /api/items/:id deletes item
☐ Filtering works (creator, method)
☐ Pagination works (limit, offset)
☐ Health check passes
☐ CORS headers present
☐ Error handling works

Database Tests:
☐ Tables exist
☐ Sample data loads
☐ Indexes created
☐ Timestamps work
☐ UUIDs generate
☐ Relationships valid
```

---

## Deployment Checklist

```
Before Deploy:
☐ All tests passing
☐ No console errors
☐ Environment variables set
☐ Database backups made
☐ Code reviewed

Frontend (Vercel):
☐ Repository connected
☐ Build command: npm run build
☐ Start command: npm start
☐ NEXT_PUBLIC_API_BASE_URL set
☐ Deploy button clicked

Backend (Railway/Heroku):
☐ Repository connected
☐ Build command: npm run build
☐ Start command: npm start
☐ DATABASE_URL set
☐ NODE_ENV=production

Post-Deploy:
☐ Health check endpoint works
☐ API calls succeed
☐ Database connected
☐ Frontend loads
☐ Cards display correctly
```

---

## Performance Metrics (Target)

```
Frontend:
- Initial Load: < 3s
- Time to Interactive: < 2s
- First Contentful Paint: < 1.5s
- Lighthouse Score: 85+

Backend:
- Response Time: < 200ms
- Database Query: < 100ms
- Health Check: < 50ms

Database:
- Connection Pool: 20
- Query Timeout: 5s
- Max Connections: 100
```

---

**Last Updated**: December 2025
**Version**: 1.0.0
**Status**: ✨ Production Ready ✨
