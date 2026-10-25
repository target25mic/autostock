# AutoStock – Car Dealership Inventory API

Express + libSQL (SQLite locally, Turso in production) with JWT auth in HttpOnly cookies. Deployable to Vercel via `api/index.js`.

## Setup
    npm install
    cp .env.example .env     # set JWT_SECRET (export vars or use `node --env-file=.env`)
    npm run db:init && npm run db:seed
    ADMIN_EMAIL=you@x.com ADMIN_PASSWORD='longpassword' npm run admin:create
    npm run dev              # http://localhost:3001
    npm test                 # tests (isolated file:test.db)
    npm run coverage

## API
POST /api/auth/register|login|logout, GET /api/auth/me; GET /api/vehicles, /api/vehicles/search?make=&model=&category=&minPrice=&maxPrice=, GET /api/vehicles/:id;
admin: POST /api/vehicles, PUT|DELETE /api/vehicles/:id, POST /api/vehicles/:id/restock {"amount":5}; user: POST /api/vehicles/:id/purchase.

## Turso + Vercel (manual steps)
1. `turso db create autostock`, `turso db show autostock --url`, `turso db tokens create autostock`.
2. Run once locally: `DATABASE_URL=libsql://... DATABASE_AUTH_TOKEN=... npm run db:init` then `npm run admin:create` with the same vars.
3. Push to GitHub, import in Vercel, then Project Settings → Environment Variables: JWT_SECRET, DATABASE_URL, DATABASE_AUTH_TOKEN.
Not yet verified on a real Vercel deployment.

## Security notes
bcrypt hashing (bcryptjs), HttpOnly + SameSite=Strict + Secure(prod) cookie, parameterized queries, role never accepted from registration, atomic conditional UPDATE prevents overselling. SameSite=Strict is the CSRF defence; add rate limiting before real use.

## Known limitations
Frontend (React/Vite/Tailwind) not built yet. No login rate limiting. Purchases only decrement stock (no orders table).

## My AI Usage

