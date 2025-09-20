#!/usr/bin/env tsx

// Load environment variables manually before any imports
import { readFileSync, existsSync } from 'fs';

if (existsSync('.env')) {
  const envFile = readFileSync('.env', 'utf8');
  envFile.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      let value = valueParts.join('=').trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  });
}

// Create database connection directly
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

const sqlClient = neon(process.env.DATABASE_URL);
const db = drizzle(sqlClient);

async function checkDatabase() {
  try {
    console.log('🔍 Checking database status...\n');

    // Test basic connection
    console.log('1️⃣ Testing connection...');
    await db.execute(sql`SELECT 1 as test`);
    console.log('✅ Database connection successful');

    // Check for existing tables
    console.log('\n2️⃣ Checking tables...');
    const tables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    if (tables.rows.length > 0) {
      console.log(`📋 Found ${tables.rows.length} tables:`);
      tables.rows.forEach((table: any) => {
        console.log(`   • ${table.table_name}`);
      });
    } else {
      console.log('📋 No tables found - empty database');
    }

    // Check migrations table
    console.log('\n3️⃣ Checking migrations...');
    try {
      const migrations = await db.execute(sql`
        SELECT * FROM drizzle.__drizzle_migrations ORDER BY id;
      `);
      console.log(`📝 Found ${migrations.rows.length} migrations applied`);
      migrations.rows.forEach((migration: any, index: number) => {
        console.log(`   ${index + 1}. ${migration.hash}`);
      });
    } catch (error) {
      console.log('📝 No migrations table found');
    }

    // Check data counts
    console.log('\n4️⃣ Checking data...');
    const dataChecks = [
      { table: 'users', name: 'Users' },
      { table: 'contacts', name: 'Contacts' },
      { table: 'products', name: 'Products' },
      { table: 'chart_of_accounts', name: 'Chart of Accounts' },
      { table: 'taxes', name: 'Tax Configurations' },
      { table: 'currencies', name: 'Currencies' },
      { table: 'payment_methods', name: 'Payment Methods' },
      { table: 'company_settings', name: 'Company Settings' }
    ];

    for (const check of dataChecks) {
      try {
        const result = await db.execute(sql.raw(`SELECT COUNT(*) FROM ${check.table};`));
        const count = result.rows[0]?.count || 0;
        console.log(`   📊 ${check.name}: ${count} records`);
      } catch (error) {
        console.log(`   ❌ ${check.name}: Table not found`);
      }
    }

    console.log('\n✅ Database check completed!');

  } catch (error: any) {
    console.error('\n❌ Database check failed:', error?.message || error);
    console.log('\n🔧 Suggestions:');
    console.log('• Check your DATABASE_URL in .env.local');
    console.log('• Run: npm run db:setup');
    console.log('• Or try: npm run db:fresh');
    process.exit(1);
  }
}

checkDatabase();