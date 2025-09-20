#!/usr/bin/env tsx

import { execSync } from 'child_process';
import { seedDatabase, resetDatabase } from '../src/lib/db/seed';
import { testConnection } from '../src/lib/db/utils';
import { db } from '../src/lib/db';
import { sql } from 'drizzle-orm';

async function checkMigrationStatus() {
  try {
    // Check if migrations table exists
    const result = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = '__drizzle_migrations'
      );
    `);
    
    const migrationsTableExists = result.rows[0]?.exists;
    
    if (migrationsTableExists) {
      // Check migration status
      const migrations = await db.execute(sql`
        SELECT * FROM __drizzle_migrations ORDER BY id;
      `);
      
      console.log(`📋 Found ${migrations.rows.length} migration(s) applied:`);
      migrations.rows.forEach((migration: any, index: number) => {
        console.log(`   ${index + 1}. ${migration.hash} - ${migration.created_at}`);
      });
      
      return { exists: true, count: migrations.rows.length, migrations: migrations.rows };
    } else {
      console.log('📋 No migrations table found - fresh database');
      return { exists: false, count: 0, migrations: [] };
    }
  } catch (error) {
    console.log('⚠️ Could not check migration status:', error);
    return { exists: false, count: 0, migrations: [] };
  }
}

async function setupDatabase() {
  try {
    console.log('🚀 Setting up Shiv Accounts Cloud Database...\n');

    // Test database connection
    console.log('1️⃣ Testing database connection...');
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Database connection failed. Please check your DATABASE_URL in .env.local');
    }

    // Check migration status
    console.log('\n2️⃣ Checking migration status...');
    const migrationStatus = await checkMigrationStatus();

    // Run migrations if needed
    console.log('\n3️⃣ Running database migrations...');
    try {
      if (migrationStatus.count === 0) {
        console.log('🆕 No migrations found, pushing schema directly...');
        execSync('npx drizzle-kit push', { stdio: 'inherit' });
      } else {
        console.log('🔄 Running incremental migrations...');
        execSync('npx drizzle-kit migrate', { stdio: 'inherit' });
      }
      console.log('✅ Migrations completed successfully');
    } catch (error: any) {
      if (error?.message?.includes('relation') && error?.message?.includes('already exists')) {
        console.log('ℹ️ Some tables already exist, continuing with seed...');
      } else {
        console.warn('⚠️ Migration warning (continuing):', error?.message?.split('\n')[0]);
      }
    }

    // Seed database with initial data
    console.log('\n4️⃣ Seeding database with initial data...');
    await seedDatabase();

    console.log('\n🎉 Database setup completed successfully!');
    console.log('\nYour Shiv Accounts Cloud database is ready to use with:');
    console.log('- ✅ Chart of Accounts (Indian standard)');
    console.log('- ✅ Tax configurations (GST rates)');
    console.log('- ✅ Currency settings');
    console.log('- ✅ Payment methods');
    console.log('- ✅ Product categories');
    console.log('- ✅ Company settings template');
    console.log('\n🌐 You can now start the application with: npm run dev');

  } catch (error: any) {
    console.error('\n❌ Database setup failed:', error?.message || error);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('1. Check your DATABASE_URL in .env.local');
    console.log('2. Ensure your database is accessible');
    console.log('3. Try running: npm run db:push (for fresh setup)');
    console.log('4. Or reset with: npm run db:reset --force');
    process.exit(1);
  }
}

async function resetDatabaseData() {
  try {
    console.log('🔄 Resetting Shiv Accounts Cloud Database...\n');
    
    const answer = process.argv.includes('--force') || 
      (process.argv.includes('--confirm') && process.argv.includes('reset'));
    
    if (!answer) {
      console.log('❌ Database reset cancelled. Use --force flag to confirm reset.');
      process.exit(1);
    }

    await resetDatabase();
    console.log('\n🎉 Database reset completed successfully!');
  } catch (error) {
    console.error('\n❌ Database reset failed:', error);
    process.exit(1);
  }
}

// Parse command line arguments
const command = process.argv[2];

switch (command) {
  case 'setup':
    setupDatabase();
    break;
  case 'reset':
    resetDatabaseData();
    break;
  case 'seed':
    seedDatabase();
    break;
  default:
    console.log('Available commands:');
    console.log('  setup  - Run migrations and seed database');
    console.log('  reset  - Reset and re-seed database (use --force to confirm)');
    console.log('  seed   - Seed database with initial data');
    console.log('\nExample: npm run db:setup');
}