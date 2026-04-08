# GiveForward — Volunteer Marketplace

A bilingual (EN/BG) marketplace connecting NGOs, corporations, and volunteers across Bulgaria.

## Tech Stack

| Layer    | Technology                        |
|----------|-----------------------------------|
| Frontend | React 18 + Vite + Tailwind CSS    |
| Auth/DB  | Supabase (PostgreSQL + Auth)      |
| i18n     | i18next (English + Bulgarian)     |
| State    | Zustand                           |
| Deploy   | Vercel (CI/CD)                    |

## Project Structure

```
marketplace/
├── frontend/          # React app
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Route-level pages
│   │   ├── store/        # Zustand stores
│   │   ├── lib/          # Supabase client
│   │   ├── i18n/         # EN + BG translations
│   │   └── styles/       # Global CSS
│   └── .env.example
├── backend/           # Node.js API (future)
├── supabase/
│   └── migrations/    # DB migration files
├── .github/
│   └── workflows/     # GitHub Actions CI
└── vercel.json
```

## Getting Started

### 1. Clone the repo
```bash
git clone https://github.com/gyotoff/marketplace.git
cd marketplace
```

### 2. Set up environment variables
```bash
cp frontend/.env.example frontend/.env.local
# Fill in your Supabase URL and anon key
```

### 3. Install and run
```bash
cd frontend
npm install
npm run dev
```

App runs at **http://localhost:3000**

## Actors / Roles

| Role         | Description                                      |
|--------------|--------------------------------------------------|
| `volunteer`  | Individual or employee signing up for projects   |
| `org_admin`  | NGO / non-profit managing projects and events    |
| `corp_admin` | Corporation managing CSR programs and employees  |
| `super_admin`| Platform administrator                           |

## Database

Supabase project: `marketplace` (`eu-central-1`)  
URL: `https://yxqqxjyuqjoraxjjwcdp.supabase.co`

Run migrations via Supabase MCP or the Supabase dashboard SQL editor.

## Deployment

Pushes to `main` → auto-deployed to Vercel production.  
Pushes to `develop` → preview deployments.

## Environment Variables (Vercel)

Set these in Vercel → Project Settings → Environment Variables:

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```
