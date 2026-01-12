# Run Local Development Server

Start the Book of Life blog application for local development and testing.

## Prerequisites

- Node.js 18+ installed
- Docker installed and running
- Port 3001 available

## Steps

1. **Start the PostgreSQL database:**
   ```bash
   docker compose up -d
   ```

2. **Install dependencies (if needed):**
   ```bash
   npm install
   ```

3. **Run database migrations (if needed):**
   ```bash
   npx prisma migrate dev
   ```

4. **Seed the database (optional, for test data):**
   ```bash
   npx prisma db seed
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

6. **Open in browser:**
   - Application: http://localhost:3001
   - Database UI: `npx prisma studio`

## Admin Credentials

After seeding the database, use these credentials to log in as admin:

- **Email:** admin@bookoflife.com
- **Password:** admin123
- **Role:** ADMIN

## Quick Start (One Command)

```bash
docker compose up -d && npm run dev
```

## Stopping

- Stop dev server: `Ctrl+C`
- Stop database: `docker compose down`

## Ports

| Service | Port |
|---------|------|
| Next.js App | 3001 |
| PostgreSQL | 5435 |
| Mailpit (SMTP) | 1025 |
| Mailpit (UI) | 8025 |
