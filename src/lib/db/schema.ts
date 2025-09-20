import { pgTable, serial, text, integer, decimal, timestamp, boolean, varchar, jsonb } from 'drizzle-orm/pg-core';

// Users table for authentication and roles
export const users = pgTable('users', {
    id: serial('id').primaryKey(),
    email: varchar('email', { length: 255 }).unique().notNull(),
    name: varchar('name', { length: 255 }),
    password: text('password'),
    role: varchar('role', { length: 50 }).default('ACCOUNTANT').notNull(), // ADMIN, ACCOUNTANT, CONTACT
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// Contacts table (customers and vendors)
export const contacts = pgTable('contacts', {
    id: serial('id').primaryKey(),
    type: varchar('type', { length: 20 }).notNull(), // CUSTOMER, VENDOR, BOTH
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }),
    mobile: varchar('mobile', { length: 20 }),
    address: jsonb('address'), // Store address as JSON
    profile: jsonb('profile'), // Additional profile information
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// Products/Services table
export const products = pgTable('products', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    type: varchar('type', { length: 20 }).default('GOODS').notNull(), // GOODS, SERVICE
    salesPrice: decimal('sales_price', { precision: 10, scale: 2 }),
    purchasePrice: decimal('purchase_price', { precision: 10, scale: 2 }),
    taxPercentage: decimal('tax_percentage', { precision: 5, scale: 2 }),
    hsnCode: varchar('hsn_code', { length: 20 }),
    category: varchar('category', { length: 100 }),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// Tax configurations
export const taxes = pgTable('taxes', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    computation: varchar('computation', { length: 20 }).default('PERCENTAGE').notNull(), // PERCENTAGE, FIXED
    applicableOn: varchar('applicable_on', { length: 20 }).default('SALES').notNull(), // SALES, PURCHASE
    rate: decimal('rate', { precision: 5, scale: 2 }).notNull(),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
});

// Chart of Accounts (COA)
export const chartOfAccounts = pgTable('chart_of_accounts', {
    id: serial('id').primaryKey(),
    code: varchar('code', { length: 20 }).unique().notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    type: varchar('type', { length: 50 }).notNull(), // ASSET, LIABILITY, EQUITY, INCOME, EXPENSE
    parentId: integer('parent_id').references(() => chartOfAccounts.id),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
});

// Purchase Orders
export const purchaseOrders = pgTable('purchase_orders', {
    id: serial('id').primaryKey(),
    poNumber: varchar('po_number', { length: 50 }).unique().notNull(),
    vendorId: integer('vendor_id').references(() => contacts.id).notNull(),
    orderDate: timestamp('order_date').notNull(),
    status: varchar('status', { length: 20 }).default('DRAFT').notNull(), // DRAFT, APPROVED, RECEIVED
    totalAmount: decimal('total_amount', { precision: 12, scale: 2 }),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// Sales Orders
export const salesOrders = pgTable('sales_orders', {
    id: serial('id').primaryKey(),
    soNumber: varchar('so_number', { length: 50 }).unique().notNull(),
    customerId: integer('customer_id').references(() => contacts.id).notNull(),
    orderDate: timestamp('order_date').notNull(),
    status: varchar('status', { length: 20 }).default('DRAFT').notNull(), // DRAFT, APPROVED, DELIVERED
    totalAmount: decimal('total_amount', { precision: 12, scale: 2 }),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// Invoices (both vendor bills and customer invoices)
export const invoices = pgTable('invoices', {
    id: serial('id').primaryKey(),
    invoiceNumber: varchar('invoice_number', { length: 50 }).unique().notNull(),
    type: varchar('type', { length: 20 }).notNull(), // PURCHASE, SALES
    contactId: integer('contact_id').references(() => contacts.id).notNull(),
    orderId: integer('order_id'), // Can reference either PO or SO
    invoiceDate: timestamp('invoice_date').notNull(),
    dueDate: timestamp('due_date'),
    status: varchar('status', { length: 20 }).default('UNPAID').notNull(), // PAID, UNPAID, PARTIAL
    totalAmount: decimal('total_amount', { precision: 12, scale: 2 }),
    taxAmount: decimal('tax_amount', { precision: 12, scale: 2 }),
    discountAmount: decimal('discount_amount', { precision: 12, scale: 2 }),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// Payments
export const payments = pgTable('payments', {
    id: serial('id').primaryKey(),
    invoiceId: integer('invoice_id').references(() => invoices.id).notNull(),
    paymentDate: timestamp('payment_date').notNull(),
    amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
    paymentMethod: varchar('payment_method', { length: 20 }).default('CASH').notNull(), // CASH, BANK, CHEQUE
    reference: varchar('reference', { length: 100 }), // Cheque number, transaction ID, etc.
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow(),
});

// Transaction ledger for double-entry bookkeeping
export const transactions = pgTable('transactions', {
    id: serial('id').primaryKey(),
    date: timestamp('date').notNull(),
    description: text('description').notNull(),
    debitAccountId: integer('debit_account_id').references(() => chartOfAccounts.id),
    creditAccountId: integer('credit_account_id').references(() => chartOfAccounts.id),
    amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
    reference: varchar('reference', { length: 100 }), // Invoice number, etc.
    createdAt: timestamp('created_at').defaultNow(),
});

// Order items (for both purchase and sales orders)
export const orderItems = pgTable('order_items', {
    id: serial('id').primaryKey(),
    orderId: integer('order_id').notNull(), // Can be PO or SO ID
    orderType: varchar('order_type', { length: 20 }).notNull(), // PURCHASE, SALES
    productId: integer('product_id').references(() => products.id).notNull(),
    quantity: decimal('quantity', { precision: 10, scale: 2 }).notNull(),
    unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
    taxAmount: decimal('tax_amount', { precision: 10, scale: 2 }),
    discountAmount: decimal('discount_amount', { precision: 10, scale: 2 }),
    totalAmount: decimal('total_amount', { precision: 10, scale: 2 }),
    createdAt: timestamp('created_at').defaultNow(),
});

// Type exports for TypeScript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Contact = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

export type Tax = typeof taxes.$inferSelect;
export type NewTax = typeof taxes.$inferInsert;

export type ChartOfAccount = typeof chartOfAccounts.$inferSelect;
export type NewChartOfAccount = typeof chartOfAccounts.$inferInsert;

export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type NewPurchaseOrder = typeof purchaseOrders.$inferInsert;

export type SalesOrder = typeof salesOrders.$inferSelect;
export type NewSalesOrder = typeof salesOrders.$inferInsert;

export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;

export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
