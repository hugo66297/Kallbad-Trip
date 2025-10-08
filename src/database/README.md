# Database - Kallbad Trip

## Files

- `schema.sql` - Complete database schema
- `init.js` - First-time initialization
- `reset.js` - Database reset (destructive)
- `test-connection.js` - Connection test

## Commands

### Initialize (first time only)
```bash
npm run db:init
```
Creates tables, indexes, and inserts test data.

### Test Connection
```bash
npm run db:test
```
Verifies connection and displays current state. No modifications.

### Reset Database ⚠️
```bash
npm run db:reset
```
**WARNING: Deletes all data!** Requires typing "RESET" to confirm. Blocked in production.

## Schema

### Tables
- **users** - User accounts (id, username, email, password_hash, role, timestamps)
- **bathing_sites** - API site references (api_id, name, location, last_synced)
- **reviews** - User reviews (user_id, site_api_id, rating, review_text, moderation)
- **visited_sites** - Visit history (user_id, site_api_id, visited_on, notes)

### Views
- **site_statistics** - Aggregated stats per site
- **user_activity** - User activity summary
- **pending_moderation** - Reviews awaiting moderation

### Triggers
- Auto-update `updated_at` on users and reviews
- Auto-sync cache when reviews/visits are created

## Test Accounts

| Role  | Email             | Password |
|-------|-------------------|----------|
| Admin | admin@kallbad.se  | admin123 |
| User  | user@kallbad.se   | user123  |

## Configuration

Set in `.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=kallbad_trip
DB_USER=postgres
DB_PASSWORD=postgres
```

## Troubleshooting

**Cannot connect**: Check PostgreSQL is running and `.env` credentials  
**Database not found**: Create `kallbad_trip` database in pgAdmin4  
**Permission denied**: Verify DB_USER has sufficient rights  
**Tables exist**: Run `npm run db:reset`

## Notes

- API data (temperature, water quality) is fetched in real-time, not stored
- `bathing_sites` only stores API references for linking reviews/visits
- Never commit `.env` to Git
- Never run `db:reset` in production
