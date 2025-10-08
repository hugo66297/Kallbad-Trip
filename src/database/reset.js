// Database reset
// Only for development. Blocked in production.

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { pool, testConnection } = require('../util/db');

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m'
};

function askConfirmation() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question('Type "RESET" to confirm: ', (answer) => {
            rl.close();
            resolve(answer === 'RESET');
        });
    });
}

async function resetDatabase() {
    console.log('\n' + '='.repeat(60));
    console.log(`${colors.red}  WARNING: Database Reset (Destructive)${colors.reset}`);
    console.log('='.repeat(60) + '\n');

    if (process.env.NODE_ENV === 'production') {
        console.log(`${colors.red}BLOCKED - Production environment${colors.reset}`);
        console.log('This would delete all data. Not allowed in production.\n');
        process.exit(1);
    }

    console.log(`${colors.red}This will:${colors.reset}`);
    console.log('  - Drop all tables');
    console.log('  - Delete all data permanently');
    console.log('  - Recreate schema with test data only\n');
    
    console.log(`Target: ${process.env.DB_NAME} @ ${process.env.DB_HOST}\n`);

    const confirmed = await askConfirmation();
    
    if (!confirmed) {
        console.log('\nCancelled.\n');
        process.exit(0);
    }

    console.log('\n' + '='.repeat(60));
    console.log('Resetting database...');
    console.log('='.repeat(60) + '\n');

    try {
        console.log('Testing connection...');
        const connected = await testConnection();
        
        if (!connected) {
            console.log(`${colors.red}Connection failed${colors.reset}`);
            process.exit(1);
        }

        const schemaPath = path.join(__dirname, 'schema.sql');
        if (!fs.existsSync(schemaPath)) {
            console.log(`${colors.red}schema.sql not found${colors.reset}`);
            process.exit(1);
        }

        console.log('Loading schema...');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log('Dropping and recreating...');
        await pool.query(schemaSql);

        const tables = await pool.query(`
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
            ORDER BY table_name
        `);

        console.log(`\n${colors.green}Recreated ${tables.rows.length} tables:${colors.reset}`);
        tables.rows.forEach(row => console.log(`  - ${row.table_name}`));

        const users = await pool.query('SELECT COUNT(*) FROM users');
        const sites = await pool.query('SELECT COUNT(*) FROM bathing_sites');
        const reviews = await pool.query('SELECT COUNT(*) FROM reviews');
        const visits = await pool.query('SELECT COUNT(*) FROM visited_sites');
        
        console.log(`\nData: ${users.rows[0].count} users, ${sites.rows[0].count} sites, ${reviews.rows[0].count} reviews, ${visits.rows[0].count} visits`);

        console.log('\n' + '='.repeat(60));
        console.log(`${colors.green}Reset complete${colors.reset}`);
        console.log('='.repeat(60));

        console.log('\nTest accounts:');
        console.log('  admin@kallbad.se / admin123');
        console.log('  user@kallbad.se / user123\n');

    } catch (error) {
        console.log(`\n${colors.red}Failed: ${error.message}${colors.reset}\n`);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

if (require.main === module) {
    resetDatabase();
}

module.exports = { resetDatabase };

