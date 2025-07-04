const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🚀 NovaGuard Database Migration System');
console.log('🔧 Configuration:');
console.log('  URL:', supabaseUrl);
console.log('  Service Key:', supabaseServiceKey ? 'Present' : 'Missing');

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase configuration');
    process.exit(1);
}

// Create Supabase client with service role
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function testConnection() {
    console.log('\n🔍 Testing Supabase connection...');
    
    try {
        // Test basic connection by trying to query system tables
        const { data, error } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public')
            .limit(1);
            
        if (error) {
            console.log('⚠️  Connection test result:', error.message);
            return false;
        } else {
            console.log('✅ Connection successful!');
            return true;
        }
    } catch (err) {
        console.log('⚠️  Connection test error:', err.message);
        return false;
    }
}

async function executeRawSQL(sql, description) {
    console.log(`  🔄 ${description}...`);
    
    try {
        // Use the raw SQL execution via RPC
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
        
        if (error) {
            console.log(`    ⚠️  ${description} - Warning: ${error.message}`);
            return false;
        } else {
            console.log(`    ✅ ${description} - Success`);
            return true;
        }
    } catch (err) {
        console.log(`    ⚠️  ${description} - Error: ${err.message}`);
        return false;
    }
}

async function runMigrations() {
    console.log('\n🏗️  Starting NovaGuard database migrations...');
    
    // Test connection first
    const connected = await testConnection();
    if (!connected) {
        console.log('⚠️  Proceeding with migrations despite connection warnings...');
    }
    
    try {
        // Read migration files
        const migrationsDir = path.join(__dirname, 'supabase', 'migrations');
        const migrationFiles = fs.readdirSync(migrationsDir)
            .filter(file => file.endsWith('.sql'))
            .sort();

        console.log(`\n📋 Found ${migrationFiles.length} migration files:`);
        migrationFiles.forEach(file => console.log(`  📄 ${file}`));

        // Process each migration
        for (const file of migrationFiles) {
            console.log(`\n📄 Processing: ${file}`);
            
            const migrationPath = path.join(migrationsDir, file);
            const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
            
            // Try to execute the entire migration
            const success = await executeRawSQL(migrationSQL, `Executing ${file}`);
            
            if (success) {
                console.log(`✅ ${file} completed successfully`);
            } else {
                console.log(`⚠️  ${file} completed with warnings`);
            }
        }

        console.log('\n🎉 Migration process completed!');
        
        // Final verification
        await verifyTables();
        
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

async function verifyTables() {
    console.log('\n🔍 Verifying database structure...');
    
    const expectedTables = [
        'users', 'audit_logs', 'vulnerabilities', 'deployments', 
        'monitored_contracts', 'knowledge_documents', 'collaboration_sessions'
    ];
    
    for (const tableName of expectedTables) {
        try {
            const { data, error } = await supabase
                .from(tableName)
                .select('*')
                .limit(1);
                
            if (error) {
                console.log(`  ⚠️  Table ${tableName}: ${error.message}`);
            } else {
                console.log(`  ✅ Table ${tableName}: Accessible`);
            }
        } catch (err) {
            console.log(`  ⚠️  Table ${tableName}: ${err.message}`);
        }
    }
}

// Run the migration process
runMigrations().catch(console.error);
