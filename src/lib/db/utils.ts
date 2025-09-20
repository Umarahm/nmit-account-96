import { db } from './index';
import { sql } from 'drizzle-orm';

// Database connection test
export async function testConnection() {
    try {
        await db.execute(sql`SELECT 1`);
        console.log('✅ Database connection successful');
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        return false;
    }
}

// Helper function to create database if needed
export async function initializeDatabase() {
    try {
        console.log('🔄 Initializing database...');
        await testConnection();
        console.log('✅ Database initialized successfully');
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        throw error;
    }
}
