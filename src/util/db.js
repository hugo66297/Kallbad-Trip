const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
    console.error('Unexpected pool error:', err);
    process.exit(-1);
});

pool.on('connect', () => {
    console.log('✓ Connected to PostgreSQL');
});

// Execute query with optional logging
const query = async (text, params) => {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        
        if (process.env.NODE_ENV === 'dev') {
            console.log('Query executed', { text, duration, rows: res.rowCount });
        }
        
        return res;
    } catch (error) {
        console.error('Query error:', error.message);
        throw error;
    }
};

// Get client for transactions
const getClient = async () => {
    const client = await pool.connect();
    const originalQuery = client.query;
    const originalRelease = client.release;
    
    client.release = () => {
        client.query = originalQuery;
        client.release = originalRelease;
        return originalRelease.apply(client);
    };
    
    return client;
};

// Test connection
const testConnection = async () => {
    try {
        const result = await pool.query('SELECT NOW()');
        console.log('✓ Connection test passed:', result.rows[0].now);
        return true;
    } catch (error) {
        console.error('✗ Connection test failed:', error.message);
        return false;
    }
};

module.exports = {
    query,
    getClient,
    pool,
    testConnection
};

