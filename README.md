# Kallbad Trip

Web platform for finding bathing sites across Sweden.

## Quick Start

```bash
# Install dependencies
npm install

# Create PostgreSQL database
createdb -U postgres kallbad_trip

# Create .env file (see .env.example)
# Set your DB credentials

# Initialize database
npm run db:init

# Start server
npm run dev
```

Server runs on http://localhost:3000

## Project Structure

```
src/
├── app.js              # Express config
├── server.js           # Entry point
├── database/           # DB scripts and schema
├── routes/             # API routes
├── util/               # Utilities (db, logger, etc.)
└── frontend/           # HTML/CSS/JS
```

## Commands

**Development:**
- `npm run dev` - Start with auto-reload
- `npm start` - Production mode
- `npm run doc` - Generate Swagger docs

**Database:**
- `npm run db:init` - First time setup
- `npm run db:reset` - Drop and recreate (requires typing "RESET")
- `npm run db:test` - Check connection

See `src/database/README.md` for database details.
See `API_GUIDE.md` for complete API documentation.

## Features

- **4,352 bathing sites** from Swedish Marine and Water Authority (HaV)
- Real-time water quality and temperature data
- Site profiles with seasonal information and classifications
- Water temperature forecasts
- User reviews and ratings
- Visit tracking
- Admin moderation
- User authentication

## API Endpoints

**Bathing Waters (External HaV API):**
- `GET /api/bathing-waters` - All active bathing sites
- `GET /api/bathing-waters/:id` - Specific site details
- `GET /api/bathing-waters/:id/profile` - Complete site profile
- `GET /api/bathing-waters/:id/results` - Water quality monitoring results
- `GET /api/forecasts` - Water temperature forecasts
- `GET /api/health` - API health check

📖 See [API_GUIDE.md](./API_GUIDE.md) for detailed documentation

## Tech Stack

- Node.js + Express
- PostgreSQL
- Swagger
- Helmet, JWT, bcrypt

## Database

Uses PostgreSQL. The `bathing_sites` table stores references to external API data.
Real-time info (water quality, temperature) is fetched from HaV API on demand.

Test accounts after `db:init`:
- admin@kallbad.se / admin123
- user@kallbad.se / user123
