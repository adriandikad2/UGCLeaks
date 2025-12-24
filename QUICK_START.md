# 🚀 UGC Leaks Authentication System - Quick Start

## What Was Added

### 3 New Frontend Pages
1. **Sign Up** → `/auth/signup` - Create new account
2. **Sign In** → `/auth/signin` - Login to existing account
3. **Protected Schedule Layout** → `/schedule/layout.tsx` - Redirects non-editors

### 1 New Utility Library
- **Auth Library** → `src/lib/auth.ts` - All auth functions

### 5 New Backend API Endpoints
```
POST   /api/auth/signup          Create account
POST   /api/auth/signin          Login
POST   /api/auth/signout         Logout
GET    /api/auth/me              Get current user
POST   /api/auth/grant-access    Owner grants roles
```

### 3 New Database Tables (Already in Neon)
- `users` - User accounts
- `sessions` - Active sessions
- `audit_log` - Action history

## How to Run

### Backend Setup
```bash
cd backend
npm install        # Already done
npm run dev        # Starts on port 5000
```

### Frontend Setup
```bash
cd src/../..
npm run dev        # Starts on port 3000
```

### Access the App
Open http://localhost:3000 in your browser

## User Flow

### First Time User
1. Click "Sign Up" button
2. Enter username, email, password
3. Account created → Automatically becomes **OWNER**
4. Redirects to Sign In page
5. Sign in with credentials
6. See schedule button on /leaks/
7. Can access /schedule/ dashboard

### Subsequent Users
1. Click "Sign Up" button
2. Enter details
3. Account created → Becomes **USER** (read-only)
4. Sign in
5. NO schedule button on /leaks/
6. Redirected away from /schedule/
7. Owner must grant editor role first

### Owner Granting Access
Owner can POST to `/api/auth/grant-access` with:
```json
{
  "targetUserId": "user-id-uuid",
  "newRole": "editor"  // or "owner"
}
```

## Role Capabilities

| Feature | User | Editor | Owner |
|---------|------|--------|-------|
| View /leaks/ | ✅ | ✅ | ✅ |
| See schedule button | ❌ | ✅ | ✅ |
| Access /schedule/ | ❌ | ✅ | ✅ |
| Create schedules | ❌ | ✅ | ✅ |
| Edit schedules | ❌ | ✅ | ✅ |
| Delete schedules | ❌ | ✅ | ✅ |
| Grant access to others | ❌ | ❌ | ✅ |

## Files Modified

- `src/app/page.tsx` - Added auth buttons
- `src/app/leaks/page.tsx` - Conditional schedule button
- `backend/server.ts` - Added 5 auth endpoints
- `backend/package.json` - Added bcrypt + jwt

## Files Created

- `src/lib/auth.ts` - Auth utilities (139 lines)
- `src/app/auth/signup/page.tsx` - Signup form (156 lines)
- `src/app/auth/signin/page.tsx` - Signin form (124 lines)
- `src/app/schedule/layout.tsx` - Protected route (38 lines)
- `AUTH_SYSTEM.md` - Full documentation

## How Auth Works

1. **Password** → Hashed with bcrypt (10 rounds)
2. **Stored** → In users table with hash only
3. **Login** → Password compared with hash
4. **Token** → JWT generated (7-day expiry)
5. **Storage** → Token + user object in localStorage
6. **Access** → Checked via `hasAccess(role)` function
7. **Protected** → Routes redirect if no access

## Testing Quick Commands

```bash
# Test signup
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"Test123456"}'

# Test signin
curl -X POST http://localhost:5000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123456"}'

# Test get user (use token from signin response)
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Debugging

### User stuck on redirect loop
- Check localStorage has valid token: `localStorage.getItem('token')`
- Check user object: `JSON.parse(localStorage.getItem('user'))`
- Check browser console for errors

### Can't sign up
- Ensure backend is running on :5000
- Check DATABASE_URL in backend .env
- Verify database tables exist in Neon

### Schedule button not showing
- User must be logged in
- User must have editor+ role
- Check: `hasAccess('editor')` in console

### 401 errors on API calls
- Token expired (7 days)
- Sign out and sign in again
- Token not being sent in Authorization header

## Environment Variables (Backend)

Required in `backend/.env`:
```
DATABASE_URL=your-neon-postgres-url
JWT_SECRET=your-secret-key-min-32-chars
BACKEND_PORT=5000
CORS_ORIGIN=http://localhost:3000
```

## Production Checklist

- [ ] Use environment variables for JWT_SECRET
- [ ] Set CORS_ORIGIN to production domain
- [ ] Use httpOnly cookies instead of localStorage for token
- [ ] Implement refresh token mechanism
- [ ] Add email verification
- [ ] Add password reset flow
- [ ] Enable HTTPS
- [ ] Setup rate limiting on auth endpoints
- [ ] Add request logging
- [ ] Monitor audit_log for suspicious activity

---

**Everything is ready to test!** 🎉
Run backend and frontend, then visit http://localhost:3000
