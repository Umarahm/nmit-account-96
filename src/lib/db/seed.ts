import { db } from './index';
import { 
  chartOfAccounts, 
  taxes, 
  currencies, 
  paymentMethods, 
  companySettings, 
  productCategories,
  type NewChartOfAccount,
  type NewTax,
  type NewCurrency,
  type NewPaymentMethod,
  type NewCompanySetting,
  type NewProductCategory
} from './schema';

// Default Chart of Accounts for Indian businesses
const defaultChartOfAccounts: NewChartOfAccount[] = [
  // Assets
  { code: '1000', name: 'ASSETS', type: 'ASSET', level: 0, isGroup: true },
  { code: '1100', name: 'Current Assets', type: 'ASSET', parentId: 1, level: 1, isGroup: true },
  { code: '1110', name: 'Cash', type: 'ASSET', parentId: 2, level: 2 },
  { code: '1120', name: 'Bank Accounts', type: 'ASSET', parentId: 2, level: 2, isGroup: true },
  { code: '1121', name: 'Bank - Current Account', type: 'ASSET', parentId: 4, level: 3 },
  { code: '1122', name: 'Bank - Savings Account', type: 'ASSET', parentId: 4, level: 3 },
  { code: '1130', name: 'Accounts Receivable', type: 'ASSET', parentId: 2, level: 2 },
  { code: '1140', name: 'Inventory', type: 'ASSET', parentId: 2, level: 2 },
  { code: '1150', name: 'Prepaid Expenses', type: 'ASSET', parentId: 2, level: 2 },
  { code: '1200', name: 'Fixed Assets', type: 'ASSET', parentId: 1, level: 1, isGroup: true },
  { code: '1210', name: 'Property, Plant & Equipment', type: 'ASSET', parentId: 10, level: 2 },
  { code: '1220', name: 'Accumulated Depreciation', type: 'ASSET', parentId: 10, level: 2 },
  
  // Liabilities
  { code: '2000', name: 'LIABILITIES', type: 'LIABILITY', level: 0, isGroup: true },
  { code: '2100', name: 'Current Liabilities', type: 'LIABILITY', parentId: 13, level: 1, isGroup: true },
  { code: '2110', name: 'Accounts Payable', type: 'LIABILITY', parentId: 14, level: 2 },
  { code: '2120', name: 'Tax Payable', type: 'LIABILITY', parentId: 14, level: 2, isGroup: true },
  { code: '2121', name: 'GST Payable', type: 'LIABILITY', parentId: 16, level: 3 },
  { code: '2122', name: 'TDS Payable', type: 'LIABILITY', parentId: 16, level: 3 },
  { code: '2130', name: 'Accrued Expenses', type: 'LIABILITY', parentId: 14, level: 2 },
  { code: '2200', name: 'Long-term Liabilities', type: 'LIABILITY', parentId: 13, level: 1, isGroup: true },
  { code: '2210', name: 'Long-term Loans', type: 'LIABILITY', parentId: 20, level: 2 },
  
  // Equity
  { code: '3000', name: 'EQUITY', type: 'EQUITY', level: 0, isGroup: true },
  { code: '3100', name: 'Capital', type: 'EQUITY', parentId: 22, level: 1 },
  { code: '3200', name: 'Retained Earnings', type: 'EQUITY', parentId: 22, level: 1 },
  { code: '3300', name: 'Current Year Earnings', type: 'EQUITY', parentId: 22, level: 1 },
  
  // Income
  { code: '4000', name: 'INCOME', type: 'INCOME', level: 0, isGroup: true },
  { code: '4100', name: 'Sales Revenue', type: 'INCOME', parentId: 26, level: 1, isGroup: true },
  { code: '4110', name: 'Product Sales', type: 'INCOME', parentId: 27, level: 2 },
  { code: '4120', name: 'Service Revenue', type: 'INCOME', parentId: 27, level: 2 },
  { code: '4200', name: 'Other Income', type: 'INCOME', parentId: 26, level: 1, isGroup: true },
  { code: '4210', name: 'Interest Income', type: 'INCOME', parentId: 30, level: 2 },
  { code: '4220', name: 'Miscellaneous Income', type: 'INCOME', parentId: 30, level: 2 },
  
  // Expenses
  { code: '5000', name: 'EXPENSES', type: 'EXPENSE', level: 0, isGroup: true },
  { code: '5100', name: 'Cost of Goods Sold', type: 'EXPENSE', parentId: 33, level: 1, isGroup: true },
  { code: '5110', name: 'Purchase - Raw Materials', type: 'EXPENSE', parentId: 34, level: 2 },
  { code: '5120', name: 'Direct Labor', type: 'EXPENSE', parentId: 34, level: 2 },
  { code: '5130', name: 'Manufacturing Overhead', type: 'EXPENSE', parentId: 34, level: 2 },
  { code: '5200', name: 'Operating Expenses', type: 'EXPENSE', parentId: 33, level: 1, isGroup: true },
  { code: '5210', name: 'Salaries & Wages', type: 'EXPENSE', parentId: 38, level: 2 },
  { code: '5220', name: 'Rent', type: 'EXPENSE', parentId: 38, level: 2 },
  { code: '5230', name: 'Utilities', type: 'EXPENSE', parentId: 38, level: 2 },
  { code: '5240', name: 'Office Supplies', type: 'EXPENSE', parentId: 38, level: 2 },
  { code: '5250', name: 'Marketing & Advertising', type: 'EXPENSE', parentId: 38, level: 2 },
  { code: '5260', name: 'Professional Fees', type: 'EXPENSE', parentId: 38, level: 2 },
  { code: '5270', name: 'Travel & Transportation', type: 'EXPENSE', parentId: 38, level: 2 },
  { code: '5280', name: 'Depreciation', type: 'EXPENSE', parentId: 38, level: 2 },
];

// Default tax configurations for India
const defaultTaxes: NewTax[] = [
  { name: 'GST 0%', shortName: 'GST0', rate: '0', applicableOn: 'BOTH' },
  { name: 'GST 5%', shortName: 'GST5', rate: '5', applicableOn: 'BOTH' },
  { name: 'GST 12%', shortName: 'GST12', rate: '12', applicableOn: 'BOTH' },
  { name: 'GST 18%', shortName: 'GST18', rate: '18', applicableOn: 'BOTH' },
  { name: 'GST 28%', shortName: 'GST28', rate: '28', applicableOn: 'BOTH' },
  { name: 'CGST 9%', shortName: 'CGST9', rate: '9', applicableOn: 'BOTH' },
  { name: 'SGST 9%', shortName: 'SGST9', rate: '9', applicableOn: 'BOTH' },
  { name: 'IGST 18%', shortName: 'IGST18', rate: '18', applicableOn: 'BOTH' },
];

// Default currencies
const defaultCurrencies: NewCurrency[] = [
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', exchangeRate: '1.0000', isBaseCurrency: true },
  { code: 'USD', name: 'US Dollar', symbol: '$', exchangeRate: '83.0000' },
  { code: 'EUR', name: 'Euro', symbol: '€', exchangeRate: '90.0000' },
  { code: 'GBP', name: 'British Pound', symbol: '£', exchangeRate: '105.0000' },
];

// Default payment methods
const defaultPaymentMethods: NewPaymentMethod[] = [
  { name: 'Cash', type: 'CASH', description: 'Cash payments' },
  { name: 'Bank Transfer', type: 'BANK', description: 'Bank transfer payments' },
  { name: 'Cheque', type: 'BANK', description: 'Cheque payments' },
  { name: 'Credit Card', type: 'CARD', description: 'Credit card payments' },
  { name: 'Debit Card', type: 'CARD', description: 'Debit card payments' },
  { name: 'UPI', type: 'DIGITAL', description: 'UPI payments' },
  { name: 'Net Banking', type: 'DIGITAL', description: 'Net banking payments' },
];

// Default product categories
const defaultProductCategories: NewProductCategory[] = [
  { name: 'Raw Materials', description: 'Basic materials used in production' },
  { name: 'Finished Goods', description: 'Completed products ready for sale' },
  { name: 'Work in Progress', description: 'Items currently being manufactured' },
  { name: 'Consumables', description: 'Items consumed in the production process' },
  { name: 'Spare Parts', description: 'Replacement parts for machinery' },
  { name: 'Services', description: 'Service-based offerings' },
];

// Default company settings
const defaultCompanySettings: NewCompanySetting = {
  companyName: 'Your Company Name',
  address: {
    line1: '123 Business Street',
    line2: 'Business Area',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    country: 'India'
  },
  taxInfo: {
    gstin: 'GSTIN-TO-BE-UPDATED',
    pan: 'PAN-TO-BE-UPDATED',
    cin: 'CIN-TO-BE-UPDATED'
  },
  email: 'info@yourcompany.com',
  phone: '+91-123-456-7890',
  fiscalYearStart: '04-01',
  baseCurrency: 'INR',
  timezone: 'Asia/Kolkata',
  dateFormat: 'DD/MM/YYYY',
  settings: {
    autoGenerateNumbers: true,
    defaultTaxRate: 18,
    defaultPaymentTerms: 30,
    stockValuationMethod: 'FIFO'
  }
};

export async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Seed Chart of Accounts
    console.log('📊 Seeding Chart of Accounts...');
    for (const account of defaultChartOfAccounts) {
      try {
        await db.insert(chartOfAccounts).values(account).onConflictDoNothing();
      } catch (error: any) {
        // Ignore duplicate key errors
        if (!error?.message?.includes('duplicate key') && !error?.message?.includes('already exists')) {
          throw error;
        }
      }
    }

    // Seed Taxes
    console.log('💰 Seeding Tax configurations...');
    for (const tax of defaultTaxes) {
      try {
        await db.insert(taxes).values(tax).onConflictDoNothing();
      } catch (error: any) {
        if (!error?.message?.includes('duplicate key') && !error?.message?.includes('already exists')) {
          throw error;
        }
      }
    }

    // Seed Currencies
    console.log('💱 Seeding Currencies...');
    for (const currency of defaultCurrencies) {
      try {
        await db.insert(currencies).values(currency).onConflictDoNothing();
      } catch (error: any) {
        if (!error?.message?.includes('duplicate key') && !error?.message?.includes('already exists')) {
          throw error;
        }
      }
    }

    // Seed Payment Methods
    console.log('💳 Seeding Payment Methods...');
    for (const method of defaultPaymentMethods) {
      try {
        await db.insert(paymentMethods).values(method).onConflictDoNothing();
      } catch (error: any) {
        if (!error?.message?.includes('duplicate key') && !error?.message?.includes('already exists')) {
          throw error;
        }
      }
    }

    // Seed Product Categories
    console.log('📦 Seeding Product Categories...');
    for (const category of defaultProductCategories) {
      try {
        await db.insert(productCategories).values(category).onConflictDoNothing();
      } catch (error: any) {
        if (!error?.message?.includes('duplicate key') && !error?.message?.includes('already exists')) {
          throw error;
        }
      }
    }

    // Seed Company Settings
    console.log('🏢 Seeding Company Settings...');
    try {
      await db.insert(companySettings).values(defaultCompanySettings).onConflictDoNothing();
    } catch (error: any) {
      if (!error?.message?.includes('duplicate key') && !error?.message?.includes('already exists')) {
        throw error;
      }
    }

    console.log('✅ Database seeding completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  }
}

export async function resetDatabase() {
  try {
    console.log('🔄 Resetting database...');
    
    // Clear all tables in reverse dependency order
    await db.delete(companySettings);
    await db.delete(productCategories);
    await db.delete(paymentMethods);
    await db.delete(currencies);
    await db.delete(taxes);
    await db.delete(chartOfAccounts);
    
    console.log('✅ Database reset completed!');
    
    // Re-seed the database
    await seedDatabase();
    
    return true;
  } catch (error) {
    console.error('❌ Database reset failed:', error);
    throw error;
  }
}