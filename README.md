# AutoStock – Car Dealership Inventory System

**Live demo:** https://autostock-2.vercel.app

React (Vite + Tailwind) frontend and an Express API using libSQL (SQLite locally, Turso in production), with JWT auth in HttpOnly cookies. Deployed on Vercel, with the API served through `api/index.js`.



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
No login rate limiting. Purchases only decrement stock (no orders table).

## My AI Usage


**Tool used:** Claude (Anthropic), through the Claude chat interface.

**What Claude did:**
- Wrote the Express backend (authentication, vehicle CRUD, search, purchase and restock endpoints) using libSQL, so it runs on SQLite locally and Turso in production.
- Wrote the backend tests first and ran them to see them fail, then wrote the code to pass them (17 tests). It also wrote the React frontend with Tailwind (10 tests), the database scripts, `vercel.json`, and the first drafts of this README and PROMPTS.md.
- Ran the tests and production build in its own sandbox and reported the results. It did not deploy anything, and it did not test the app in a browser.
- Gave me step-by-step instructions for setup, Git, Turso and Vercel, and helped me debug errors I pasted in (PowerShell syntax, a Git push rejection, a merge conflict, and a Vercel Root Directory error).

**What I did myself:**
- Downloaded the project and ran it on my own computer. 
- Created the GitHub repository, fixed the push and merge conflicts, and pushed the code.
- Created the Turso database, set the environment variables in Vercel, and deployed the app.
- Created my own admin account with a script. 
- Edited this README section myself.

**What I reviewed or changed:** frontend changes mostly

**What I verified myself:** ran the tests locally and saw them pass

**How AI affected my workflow:** It produced the whole first version quickly, which let me spend my time on setup, deployment and understanding how the pieces fit together. 

## Frontend
    cd frontend && npm install
    npm run dev      # http://localhost:5173 (proxies /api to :3001; run the API too)
    npm test         # frontend tests
    npm run build
