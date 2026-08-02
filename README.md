# Permanence Exclusive

Private chauffeur booking site for the Arizona Valley. Built with Next.js and ready for Vercel.

## Prerequisites

- Node.js `>=20.9.0`
- A SQLite database URL (local file for development, [Turso](https://turso.tech) for production)

## Local development

```bash
cp .env.example .env.local
npm install
npm run db:push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Admin: [http://localhost:3000/admin](http://localhost:3000/admin)

## Deploy to Vercel

1. Push this repo to GitHub.
2. Create a free [Turso](https://turso.tech) database:
   ```bash
   # optional CLI
   brew install tursodatabase/tap/turso
   turso auth login
   turso db create permanence-exclusive
   turso db show permanence-exclusive --url
   turso db tokens create permanence-exclusive
   ```
3. Apply the schema:
   ```bash
   DATABASE_URL="libsql://..." DATABASE_AUTH_TOKEN="..." npm run db:push
   ```
4. In [Vercel](https://vercel.com/new), import the GitHub repo.
5. Add environment variables:
   - `DATABASE_URL` — Turso URL (`libsql://...`)
   - `DATABASE_AUTH_TOKEN` — Turso token
   - `ADMIN_PASSWORD` — owner dashboard password
   - `ADMIN_SECRET` — long random string for session signing
   - `ADMIN_NAME` — optional display name
   - `NEXT_PUBLIC_SITE_URL` — optional production URL (e.g. `https://permanenceexclusive.com`)
6. Deploy. Node.js 22 is recommended in Project Settings → General.

## Useful commands

- `npm run dev` — local development
- `npm run build` — production build
- `npm run start` — run the production build locally
- `npm run db:push` — push Drizzle schema to the database
- `npm run db:generate` — generate SQL migrations after schema changes

## Notes

- Booking estimates use the curated Arizona Valley place network (no map API key required).
- Admin auth is password-based (not ChatGPT SIWC). Sign in at `/admin/login`.
- Public booking POST works without login; admin GET/PATCH require a session.
