// Database initialization - run this once when setting up
// Usage: npm run db:init

const fs = require('fs');
const path = require('path');
const { pool, testConnection } = require('../util/db');

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m'
};

async function initDatabase() {
    console.log('\n' + '='.repeat(60));
    console.log(`${colors.cyan}  Initializing database...${colors.reset}`);
    console.log('='.repeat(60) + '\n');

    try {
        console.log('Testing connection...');
        const connected = await testConnection();
        
        if (!connected) {
            console.log(`${colors.red}Connection failed. Check .env and PostgreSQL.${colors.reset}`);
            process.exit(1);
        }

        const schemaPath = path.join(__dirname, 'schema.sql');
        if (!fs.existsSync(schemaPath)) {
            console.log(`${colors.red}schema.sql not found${colors.reset}`);
            process.exit(1);
        }

        console.log('Loading schema...');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log('Creating tables...');
        await pool.query(schemaSql);

        const tables = await pool.query(`
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
            ORDER BY table_name
        `);

        console.log(`\n${colors.green}Created ${tables.rows.length} tables:${colors.reset}`);
        tables.rows.forEach(row => console.log(`  - ${row.table_name}`));

        const users = await pool.query('SELECT COUNT(*) FROM users');
        const sites = await pool.query('SELECT COUNT(*) FROM bathing_sites');
        const reviews = await pool.query('SELECT COUNT(*) FROM reviews');
        
        console.log(`\nData: ${users.rows[0].count} users, ${sites.rows[0].count} sites, ${reviews.rows[0].count} reviews`);

        console.log('\n' + '='.repeat(60));
        console.log(`${colors.green}Done!${colors.reset}`);
        console.log('='.repeat(60));

        if (users.rows[0].count > 0) {
            console.log('\nTest accounts:');
            console.log('  admin@kallbad.se / admin123');
            console.log('  user@kallbad.se / user123\n');
        }

    } catch (error) {
        console.log(`\n${colors.red}Failed: ${error.message}${colors.reset}\n`);
        
        if (error.code === '42P07') {
            console.log('Tables already exist. Run "npm run db:reset" instead.\n');
        }
        
        process.exit(1);
    } finally {
        await pool.end();
    }
}

if (require.main === module) {
    initDatabase();
}

module.exports = { initDatabase };

