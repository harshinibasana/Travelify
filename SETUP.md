# 🌍 Travelify — Launch Guide

## Admin URL
**http://localhost:3000/admin** (requires admin role — first registered user is auto-admin)

---

## Quick Start

### 1. Backend
```bash
cd backend
cp .env.example .env          # Edit with your MongoDB URI
npm install
npm run dev                   # Starts on http://localhost:5001
```

Required `.env` values:
```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/travelify
JWT_SECRET=any_random_32+_char_string
PORT=5001
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

### 2. Frontend
```bash
cd frontend
npm install
npm start                     # Starts on http://localhost:3000
```

---

## Features
| Feature | Where |
|---------|-------|
| Dashboard | /dashboard |
| My Trips | /trips |
| Create Trip | /trips/new |
| Trip Detail (10 tabs) | /trips/:id |
| Explore Destinations | /explore |
| Trip Calendar | /explore → Calendar tab |
| Travel Stats | /stats |
| Bucket List | /bucket-list |
| Admin Panel | /admin |
| Public Share | /shared/:token |

### Trip tabs: Overview · Plans · Journal · Budget · Hotels · Places · Car Rentals · Photos · Packing · Misc

---

## No API Keys Needed
All core features work without any API keys:
- **Maps** — OpenStreetMap (free, embedded iframe)
- **Nearby places** — Overpass/OSM API (free)
- **Weather** — Open-Meteo (free, no key)
- **Currency** — open.er-api.com (free)
- **Geocoding** — Nominatim (free)

Optional: Add `REACT_APP_GOOGLE_MAPS_KEY` to `frontend/.env` for Google Maps upgrade.

---

## Troubleshooting
- **Can't login** → Check backend is running (`npm run dev` in /backend)
- **MongoDB error** → Verify MONGODB_URI in backend/.env
- **First user admin** → Register at /register, first account is auto-admin
- **Make existing user admin** → MongoDB: `db.users.updateOne({email:"you@x.com"},{$set:{role:"admin"}})`
