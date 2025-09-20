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

// Invoice-specific utilities
export async function getNextInvoiceSequence(type: 'PURCHASE' | 'SALES'): Promise<number> {
  const currentYear = new Date().getFullYear();
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');

  const [lastInvoice] = await db
    .select({ invoiceNumber: sql<string>`invoice_number` })
    .from(sql`invoices`)
    .where(sql`
      type = ${type} AND 
      EXTRACT(YEAR FROM invoice_date) = ${currentYear} AND 
      EXTRACT(MONTH FROM invoice_date) = ${currentMonth}
    `)
    .orderBy(sql`created_at DESC`)
    .limit(1);

  if (!lastInvoice) {
    return 1;
  }

  // Extract sequence number from invoice number (format: PREFIX-YYYYMM####)
  const parts = lastInvoice.invoiceNumber.split('-');
  if (parts.length >= 2) {
    const sequencePart = parts[parts.length - 1];
    const sequence = parseInt(sequencePart.slice(-4)); // Get last 4 digits
    return isNaN(sequence) ? 1 : sequence + 1;
  }

  return 1;
}

export function generateInvoiceNumber(type: 'PURCHASE' | 'SALES', sequence: number): string {
  const prefix = type === 'PURCHASE' ? 'BILL' : 'INV';
  return generateDocumentNumber(`${prefix}-`, sequence);
}

export function calculateInvoiceTotals(items: Array<{
  quantity: number;
  unitPrice: number;
  taxAmount?: number;
  discountAmount?: number;
}>) {
  let subTotal = 0;
  let taxAmount = 0;
  let discountAmount = 0;
  let totalAmount = 0;

  for (const item of items) {
    const itemSubTotal = item.quantity * item.unitPrice;
    const itemTaxAmount = item.taxAmount || 0;
    const itemDiscountAmount = item.discountAmount || 0;
    const itemTotal = itemSubTotal + itemTaxAmount - itemDiscountAmount;

    subTotal += itemSubTotal;
    taxAmount += itemTaxAmount;
    discountAmount += itemDiscountAmount;
    totalAmount += itemTotal;
  }

  return {
    subTotal,
    taxAmount,
    discountAmount,
    totalAmount,
    balanceAmount: totalAmount
  };
}

export function calculateDueDate(invoiceDate: Date, paymentTerms: number = 30): Date {
  const dueDate = new Date(invoiceDate);
  dueDate.setDate(dueDate.getDate() + paymentTerms);
  return dueDate;
}

export function isInvoiceOverdue(invoiceDate: Date, dueDate: Date | null, status: string): boolean {
  if (status === 'PAID' || status === 'CANCELLED' || !dueDate) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);

  return today > dueDate;
}