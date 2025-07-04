const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Database configuration
const connectionString = `postgresql://postgres.gqdbmvtgychgwztlbaus:NovaGuard2024!@aws-0-us-west-1.pooler.supabase.com:6543/postgres`;

async function runMigrations() {
    console.log('🚀 Starting NovaGuard database migrations with direct PostgreSQL connection...');
    
    const client = new Client({
        connectionString: connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        // Connect to database
        console.log('🔌 Connecting to database...');
        await client.connect();
        console.log('✅ Connected to database successfully!');

        // Read migration files
        const migrationsDir = path.join(__dirname, 'supabase', 'migrations');
        const migrationFiles = fs.readdirSync(migrationsDir)
            .filter(file => file.endsWith('.sql'))
            .sort();

        console.log(`\nFound ${migrationFiles.length} migration files:`);
        migrationFiles.forEach(file => console.log(`  - ${file}`));

        // Create migrations tracking table if it doesn't exist
        await client.query(`
            CREATE TABLE IF NOT EXISTS _migrations (
                id SERIAL PRIMARY KEY,
                filename VARCHAR(255) UNIQUE NOT NULL,
                executed_at TIMESTAMP DEFAULT NOW()
            );
        `);

        // Check which migrations have already been run
        const { rows: executedMigrations } = await client.query(
            'SELECT filename FROM _migrations ORDER BY id'
        );
        const executedFilenames = executedMigrations.map(row => row.filename);

        console.log(`\nPreviously executed migrations: ${executedFilenames.length}`);
        executedFilenames.forEach(filename => console.log(`  ✅ ${filename}`));

        // Run pending migrations
        const pendingMigrations = migrationFiles.filter(file => !executedFilenames.includes(file));
        
        if (pendingMigrations.length === 0) {
            console.log('\n🎉 No pending migrations. Database is up to date!');
            return;
        }

        console.log(`\nRunning ${pendingMigrations.length} pending migrations:`);

        for (const file of pendingMigrations) {
            console.log(`\n📄 Running migration: ${file}`);
            
            const migrationPath = path.join(migrationsDir, file);
            const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
            
            try {
                // Begin transaction
                await client.query('BEGIN');
                
                // Execute migration
                await client.query(migrationSQL);
                
                // Record migration as executed
                await client.query(
                    'INSERT INTO _migrations (filename) VALUES ($1)',
                    [file]
                );
                
                // Commit transaction
                await client.query('COMMIT');
                
                console.log(`✅ Migration ${file} completed successfully`);
                
            } catch (error) {
                // Rollback transaction on error
                await client.query('ROLLBACK');
                console.error(`❌ Migration ${file} failed:`, error.message);
                throw error;
            }
        }

        console.log('\n🎉 All migrations completed successfully!');
        
        // Test some basic queries
        console.log('\n🔍 Testing database structure...');
        
        const { rows: tables } = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        `);
        
        console.log(`✅ Found ${tables.length} tables:`);
        tables.forEach(table => console.log(`  - ${table.table_name}`));

        // Test a specific table
        try {
            const { rows: userCount } = await client.query('SELECT COUNT(*) as count FROM users');
            console.log(`✅ Users table accessible (${userCount[0].count} records)`);
        } catch (error) {
            console.log('⚠️  Users table test failed:', error.message);
        }

    } catch (error) {
        console.error('❌ Migration process failed:', error.message);
        console.error('Full error:', error);
        process.exit(1);
    } finally {
        // Close database connection
        await client.end();
        console.log('\n🔌 Database connection closed');
    }
}

// Run migrations
runMigrations().catch(console.error);
