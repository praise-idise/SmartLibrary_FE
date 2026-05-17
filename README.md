# SmartLibrary Frontend

SmartLibrary is the web client for the Online Books Management System.

Core scope in this MVP:
- Landing page with educational theme and image placeholders
- Login and role-based routing
- User panel for books browsing, borrowing, returns, and loan history
- Admin panel for book management and users borrow summary
- Direct JWT auth flow (no refresh token)

## Run Locally

```bash
npm install
npm run dev
```

## Environment

Set these in `.env`:

```env
VITE_API_BASE_URL=http://localhost:5127/api/v1
VITE_STORAGE_PREFIX=smartlibrary
```

