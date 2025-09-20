import { db } from './index';
import { sql } from 'drizzle-orm';
import { chartOfAccounts, taxes, currencies, paymentMethods, companySettings, productCategories } from './schema';

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

// Utility functions for database operations
export async function getAccountByCode(code: string) {
  const [account] = await db
    .select()
    .from(chartOfAccounts)
    .where(sql`${chartOfAccounts.code} = ${code}`)
    .limit(1);
  return account;
}

export async function getActiveAccounts() {
  return await db
    .select()
    .from(chartOfAccounts)
    .where(sql`${chartOfAccounts.isActive} = true`)
    .orderBy(chartOfAccounts.code);
}

export async function getAccountsByType(type: string) {
  return await db
    .select()
    .from(chartOfAccounts)
    .where(sql`${chartOfAccounts.type} = ${type} AND ${chartOfAccounts.isActive} = true`)
    .orderBy(chartOfAccounts.code);
}

export async function getActiveTaxes() {
  return await db
    .select()
    .from(taxes)
    .where(sql`${taxes.isActive} = true`)
    .orderBy(taxes.name);
}

export async function getBaseCurrency() {
  const [currency] = await db
    .select()
    .from(currencies)
    .where(sql`${currencies.isBaseCurrency} = true`)
    .limit(1);
  return currency;
}

export async function getActivePaymentMethods() {
  return await db
    .select()
    .from(paymentMethods)
    .where(sql`${paymentMethods.isActive} = true`)
    .orderBy(paymentMethods.name);
}

export async function getCompanySettings() {
  const [settings] = await db
    .select()
    .from(companySettings)
    .limit(1);
  return settings;
}

export async function getProductCategories() {
  return await db
    .select()
    .from(productCategories)
    .where(sql`${productCategories.isActive} = true`)
    .orderBy(productCategories.name);
}

// Generate unique numbers for documents
export function generateDocumentNumber(prefix: string, sequence: number): string {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const sequenceStr = String(sequence).padStart(4, '0');
  return `${prefix}${year}${month}${sequenceStr}`;
}

// Fiscal year utilities
export function getFiscalYear(date: Date = new Date(), startMonth: number = 4): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  
  if (month >= startMonth) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
}

export function getFiscalYearStartDate(fiscalYear?: string, startMonth: number = 4): Date {
  let year: number;
  
  if (fiscalYear) {
    year = parseInt(fiscalYear.split('-')[0]);
  } else {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    year = currentMonth >= startMonth ? currentDate.getFullYear() : currentDate.getFullYear() - 1;
  }
  
  return new Date(year, startMonth - 1, 1);
}

export function getFiscalYearEndDate(fiscalYear?: string, startMonth: number = 4): Date {
  const startDate = getFiscalYearStartDate(fiscalYear, startMonth);
  return new Date(startDate.getFullYear() + 1, startMonth - 1, 0); // Last day of the month before start month
}

// Helper function to format currency
export function formatCurrency(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}
