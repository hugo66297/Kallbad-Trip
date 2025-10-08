// Test database connection without making changes

const { testConnection, query, pool } = require('../util/db');

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m'
};

async function runTests() {
    console.log('\n' + '='.repeat(60));
    console.log(`${colors.cyan}  Database Connection Test${colors.reset}`);
    console.log('='.repeat(60) + '\n');

    try {
        console.log('1. Testing connection...');
        const connected = await testConnection();
        
        if (!connected) {
            console.log(`${colors.red}Failed${colors.reset}`);
            console.log('\nCheck:');
            console.log('  - PostgreSQL is running');
            console.log('  - .env configuration is correct\n');
            process.exit(1);
        }

        console.log('2. Checking database info...');
        const dbInfo = await query('SELECT current_database(), current_user, version()');
        console.log(`   DB: ${dbInfo.rows[0].current_database}`);
        console.log(`   User: ${dbInfo.rows[0].current_user}`);

        console.log('\n3. Checking tables...');
        const tables = await query(`
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
            ORDER BY table_name
        `);

        if (tables.rows.length === 0) {
            console.log(`${colors.yellow}   No tables found${colors.reset}`);
            console.log('\n   Run: npm run db:init\n');
        } else {
            console.log(`   Found ${tables.rows.length}:`);
            tables.rows.forEach(row => console.log(`   - ${row.table_name}`));
        }

        if (tables.rows.length > 0) {
            console.log('\n4. Checking data...');
            
            try {
                const users = await query('SELECT COUNT(*) FROM users');
                const sites = await query('SELECT COUNT(*) FROM bathing_sites');
                const reviews = await query('SELECT COUNT(*) FROM reviews');
                const visits = await query('SELECT COUNT(*) FROM visited_sites');
                
                console.log(`   ${users.rows[0].count} users, ${sites.rows[0].count} sites, ${reviews.rows[0].count} reviews, ${visits.rows[0].count} visits`);
            } catch (error) {
                console.log(`${colors.yellow}   Some tables might be corrupted${colors.reset}`);
                console.log('   Try: npm run db:reset');
            }
        }

        console.log('\n5. Configuration:');
        console.log(`   Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
        console.log(`   Database: ${process.env.DB_NAME}`);
        console.log(`   User: ${process.env.DB_USER}`);
        console.log(`   Env: ${process.env.NODE_ENV || 'dev'}`);

        console.log('\n' + '='.repeat(60));
        console.log(`${colors.green}All tests passed${colors.reset}`);
        console.log('='.repeat(60) + '\n');

        if (tables.rows.length === 0) {
            console.log('Next: npm run db:init\n');
        } else {
            console.log('Ready: npm run dev\n');
        }

    } catch (error) {
        console.log(`\n${colors.red}Test failed: ${error.message}${colors.reset}\n`);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('PostgreSQL not running. Start it or open pgAdmin4.\n');
        } else if (error.code === '3D000') {
            console.log(`Database "${process.env.DB_NAME}" doesn't exist.`);
            console.log('Create it in pgAdmin4 or run: createdb kallbad_trip\n');
        } else if (error.code === '28P01') {
            console.log('Wrong password. Check DB_PASSWORD in .env\n');
        }
        
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Execute
if (require.main === module) {
    runTests();
}

module.exports = { runTests };

