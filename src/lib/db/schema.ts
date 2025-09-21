import { pgTable, serial, text, integer, decimal, timestamp, boolean, varchar, jsonb, index, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table for authentication and roles
export const users = pgTable('users', {
    id: serial('id').primaryKey(),
    email: varchar('email', { length: 255 }).unique().notNull(),
    name: varchar('name', { length: 255 }),
    password: text('password'),
    role: varchar('role', { length: 50 }).default('CONTACT').notNull(), // ADMIN, ACCOUNTANT, CONTACT
    profileImage: text('profile_image'),
    lastLoginAt: timestamp('last_login_at'),
    emailVerifiedAt: timestamp('email_verified_at'),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => {
    return {
        emailIdx: index('users_email_idx').on(table.email),
        roleIdx: index('users_role_idx').on(table.role),
    };
});

// Contacts table (customers and vendors)
export const contacts = pgTable('contacts', {
    id: serial('id').primaryKey(),
    type: varchar('type', { length: 20 }).notNull(), // CUSTOMER, VENDOR, BOTH
    name: varchar('name', { length: 255 }).notNull(),
    displayName: varchar('display_name', { length: 255 }),
    email: varchar('email', { length: 255 }),
    mobile: varchar('mobile', { length: 20 }),
    phone: varchar('phone', { length: 20 }),
    website: varchar('website', { length: 255 }),
    address: jsonb('address'), // Store address as JSON
    billingAddress: jsonb('billing_address'),
    shippingAddress: jsonb('shipping_address'),
    taxInfo: jsonb('tax_info'), // GST, PAN, etc.
    profile: jsonb('profile'), // Additional profile information
    creditLimit: decimal('credit_limit', { precision: 12, scale: 2 }),
    paymentTerms: integer('payment_terms'), // Days
    currency: varchar('currency', { length: 3 }).default('INR'),
    notes: text('notes'),
    isActive: boolean('is_active').default(true),
    createdBy: integer('created_by').references(() => users.id),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => {
    return {
        typeIdx: index('contacts_type_idx').on(table.type),
        nameIdx: index('contacts_name_idx').on(table.name),
        emailIdx: index('contacts_email_idx').on(table.email),
        mobileIdx: index('contacts_mobile_idx').on(table.mobile),
    };
});

// Products/Services table
export const products = pgTable('products', {
    id: serial('id').primaryKey(),
    sku: varchar('sku', { length: 100 }),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    type: varchar('type', { length: 20 }).default('GOODS').notNull(), // GOODS, SERVICE
    salesPrice: decimal('sales_price', { precision: 10, scale: 2 }),
    purchasePrice: decimal('purchase_price', { precision: 10, scale: 2 }),
    costPrice: decimal('cost_price', { precision: 10, scale: 2 }),
    taxPercentage: decimal('tax_percentage', { precision: 5, scale: 2 }),
    hsnCode: varchar('hsn_code', { length: 20 }),
    sacCode: varchar('sac_code', { length: 20 }), // For services
    category: varchar('category', { length: 100 }),
    brand: varchar('brand', { length: 100 }),
    unit: varchar('unit', { length: 20 }).default('PCS'), // Units of measurement
    minStockLevel: integer('min_stock_level'),
    maxStockLevel: integer('max_stock_level'),
    currentStock: decimal('current_stock', { precision: 10, scale: 2 }).default('0'),
    stockValue: decimal('stock_value', { precision: 12, scale: 2 }).default('0'),
    images: jsonb('images'), // Product images array
    specifications: jsonb('specifications'),
    isActive: boolean('is_active').default(true),
    isStockTracked: boolean('is_stock_tracked').default(true),
    createdBy: integer('created_by').references(() => users.id),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => {
    return {
        skuIdx: index('products_sku_idx').on(table.sku),
        nameIdx: index('products_name_idx').on(table.name),
        hsnIdx: index('products_hsn_idx').on(table.hsnCode),
        categoryIdx: index('products_category_idx').on(table.category),
        typeIdx: index('products_type_idx').on(table.type),
    };
});

// Tax configurations
export const taxes = pgTable('taxes', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    shortName: varchar('short_name', { length: 20 }),
    computation: varchar('computation', { length: 20 }).default('PERCENTAGE').notNull(), // PERCENTAGE, FIXED
    applicableOn: varchar('applicable_on', { length: 20 }).default('SALES').notNull(), // SALES, PURCHASE, BOTH
    rate: decimal('rate', { precision: 5, scale: 2 }).notNull(),
    description: text('description'),
    accountId: integer('account_id').references(() => chartOfAccounts.id),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => {
    return {
        nameIdx: index('taxes_name_idx').on(table.name),
        applicableOnIdx: index('taxes_applicable_on_idx').on(table.applicableOn),
    };
});

// Tax Settings (for advanced tax management)
export const taxSettings = pgTable('tax_settings', {
    id: varchar('id', { length: 50 }).primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description'),
    rate: decimal('rate', { precision: 5, scale: 2 }).notNull(),
    type: varchar('type', { length: 20 }).default('exclusive').notNull(), // inclusive, exclusive
    isDefault: boolean('is_default').default(false),
    isActive: boolean('is_active').default(true),
    category: varchar('category', { length: 20 }).default('both').notNull(), // goods, services, both
    hsnCodes: jsonb('hsn_codes'), // Array of applicable HSN codes
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => {
    return {
        nameIdx: index('tax_settings_name_idx').on(table.name),
        isDefaultIdx: index('tax_settings_default_idx').on(table.isDefault),
        categoryIdx: index('tax_settings_category_idx').on(table.category),
    };
});

// Tax Configuration (global tax settings)
export const taxConfiguration = pgTable('tax_configuration', {
    id: varchar('id', { length: 10 }).primaryKey(),
    enableTax: boolean('enable_tax').default(true),
    defaultTaxRate: decimal('default_tax_rate', { precision: 5, scale: 2 }).default('18.00'),
    taxDisplayFormat: varchar('tax_display_format', { length: 20 }).default('percentage'), // percentage, decimal
    roundingMethod: varchar('rounding_method', { length: 10 }).default('round'), // round, floor, ceil
    compoundTax: boolean('compound_tax').default(false),
    taxOnShipping: boolean('tax_on_shipping').default(false),
    pricesIncludeTax: boolean('prices_include_tax').default(false),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// Product Categories
export const productCategories = pgTable('product_categories', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description'),
    parentId: integer('parent_id'),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
}, (table) => {
    return {
        nameIdx: index('product_categories_name_idx').on(table.name),
        parentIdx: index('product_categories_parent_idx').on(table.parentId),
    };
});

// Payment Methods
export const paymentMethods = pgTable('payment_methods', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    type: varchar('type', { length: 20 }).notNull(), // CASH, BANK, CARD, DIGITAL
    accountId: integer('account_id').references(() => chartOfAccounts.id),
    description: text('description'),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
});

// Currency Settings
export const currencies = pgTable('currencies', {
    id: serial('id').primaryKey(),
    code: varchar('code', { length: 3 }).unique().notNull(), // INR, USD, EUR
    name: varchar('name', { length: 100 }).notNull(),
    symbol: varchar('symbol', { length: 10 }).notNull(),
    exchangeRate: decimal('exchange_rate', { precision: 10, scale: 4 }).default('1.0000'),
    isBaseCurrency: boolean('is_base_currency').default(false),
    isActive: boolean('is_active').default(true),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// Company Settings
export const companySettings = pgTable('company_settings', {
    id: serial('id').primaryKey(),
    companyName: varchar('company_name', { length: 255 }).notNull(),
    address: jsonb('address'),
    taxInfo: jsonb('tax_info'), // GST, PAN, CIN, etc.
    logo: text('logo'),
    email: varchar('email', { length: 255 }),
    phone: varchar('phone', { length: 20 }),
    website: varchar('website', { length: 255 }),
    fiscalYearStart: varchar('fiscal_year_start', { length: 5 }).default('04-01'), // MM-DD format
    baseCurrency: varchar('base_currency', { length: 3 }).default('INR'),
    timezone: varchar('timezone', { length: 50 }).default('Asia/Kolkata'),
    dateFormat: varchar('date_format', { length: 20 }).default('DD/MM/YYYY'),
    settings: jsonb('settings'), // Additional settings
    updatedBy: integer('updated_by').references(() => users.id),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// Chart of Accounts (COA)
export const chartOfAccounts = pgTable('chart_of_accounts', {
    id: serial('id').primaryKey(),
    code: varchar('code', { length: 20 }).unique().notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    type: varchar('type', { length: 50 }).notNull(), // ASSET, LIABILITY, EQUITY, INCOME, EXPENSE
    parentId: integer('parent_id'),
    level: integer('level').default(0), // Account hierarchy level
    isGroup: boolean('is_group').default(false), // Is this a group account
    description: text('description'),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => {
    return {
        codeIdx: index('coa_code_idx').on(table.code),
        typeIdx: index('coa_type_idx').on(table.type),
        parentIdx: index('coa_parent_idx').on(table.parentId),
    };
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
    status: varchar('status', { length: 20 }).default('UNPAID').notNull(), // PAID, UNPAID, PARTIAL, OVERDUE, CANCELLED
    subTotal: decimal('sub_total', { precision: 12, scale: 2 }),
    totalAmount: decimal('total_amount', { precision: 12, scale: 2 }),
    taxAmount: decimal('tax_amount', { precision: 12, scale: 2 }),
    discountAmount: decimal('discount_amount', { precision: 12, scale: 2 }),
    paidAmount: decimal('paid_amount', { precision: 12, scale: 2 }).default('0'),
    balanceAmount: decimal('balance_amount', { precision: 12, scale: 2 }),
    currency: varchar('currency', { length: 3 }).default('INR'),
    exchangeRate: decimal('exchange_rate', { precision: 10, scale: 4 }).default('1.0000'),
    terms: text('terms'),
    notes: text('notes'),
    attachments: jsonb('attachments'),
    createdBy: integer('created_by').references(() => users.id),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => {
    return {
        invoiceNumberIdx: index('invoices_number_idx').on(table.invoiceNumber),
        typeIdx: index('invoices_type_idx').on(table.type),
        contactIdx: index('invoices_contact_idx').on(table.contactId),
        statusIdx: index('invoices_status_idx').on(table.status),
        dateIdx: index('invoices_date_idx').on(table.invoiceDate),
        dueDateIdx: index('invoices_due_date_idx').on(table.dueDate),
    };
});

// Payments
export const payments = pgTable('payments', {
    id: serial('id').primaryKey(),
    paymentNumber: varchar('payment_number', { length: 50 }).unique(),
    invoiceId: integer('invoice_id').references(() => invoices.id).notNull(),
    paymentDate: timestamp('payment_date').notNull(),
    amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
    paymentMethodId: integer('payment_method_id').references(() => paymentMethods.id),
    paymentMethod: varchar('payment_method', { length: 20 }).default('CASH').notNull(), // CASH, BANK, CHEQUE, CARD, DIGITAL
    reference: varchar('reference', { length: 100 }), // Cheque number, transaction ID, etc.
    bankAccount: varchar('bank_account', { length: 100 }),
    chequeDate: timestamp('cheque_date'),
    clearanceDate: timestamp('clearance_date'),
    status: varchar('status', { length: 20 }).default('COMPLETED').notNull(), // PENDING, COMPLETED, FAILED, BOUNCED
    currency: varchar('currency', { length: 3 }).default('INR'),
    exchangeRate: decimal('exchange_rate', { precision: 10, scale: 4 }).default('1.0000'),
    notes: text('notes'),
    attachments: jsonb('attachments'),
    createdBy: integer('created_by').references(() => users.id),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => {
    return {
        paymentNumberIdx: index('payments_number_idx').on(table.paymentNumber),
        invoiceIdx: index('payments_invoice_idx').on(table.invoiceId),
        dateIdx: index('payments_date_idx').on(table.paymentDate),
        methodIdx: index('payments_method_idx').on(table.paymentMethod),
        statusIdx: index('payments_status_idx').on(table.status),
    };
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

export type TaxSetting = typeof taxSettings.$inferSelect;
export type NewTaxSetting = typeof taxSettings.$inferInsert;

export type TaxConfiguration = typeof taxConfiguration.$inferSelect;
export type NewTaxConfiguration = typeof taxConfiguration.$inferInsert;

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

// Additional type exports for new tables
export type ProductCategory = typeof productCategories.$inferSelect;
export type NewProductCategory = typeof productCategories.$inferInsert;

export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type NewPaymentMethod = typeof paymentMethods.$inferInsert;

export type Currency = typeof currencies.$inferSelect;
export type NewCurrency = typeof currencies.$inferInsert;

export type CompanySetting = typeof companySettings.$inferSelect;
export type NewCompanySetting = typeof companySettings.$inferInsert;

// Drizzle Relations for better type safety and joins
export const usersRelations = relations(users, ({ many }) => ({
    createdContacts: many(contacts),
    createdProducts: many(products),
    createdInvoices: many(invoices),
    createdPayments: many(payments),
}));

export const contactsRelations = relations(contacts, ({ one, many }) => ({
    createdBy: one(users, {
        fields: [contacts.createdBy],
        references: [users.id],
    }),
    purchaseOrders: many(purchaseOrders),
    salesOrders: many(salesOrders),
    invoices: many(invoices),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
    createdBy: one(users, {
        fields: [products.createdBy],
        references: [users.id],
    }),
    orderItems: many(orderItems),
}));

export const chartOfAccountsRelations = relations(chartOfAccounts, ({ one, many }) => ({
    parent: one(chartOfAccounts, {
        fields: [chartOfAccounts.parentId],
        references: [chartOfAccounts.id],
    }),
    children: many(chartOfAccounts),
    debitTransactions: many(transactions, { relationName: 'debitAccount' }),
    creditTransactions: many(transactions, { relationName: 'creditAccount' }),
    taxes: many(taxes),
    paymentMethods: many(paymentMethods),
}));

export const taxesRelations = relations(taxes, ({ one }) => ({
    account: one(chartOfAccounts, {
        fields: [taxes.accountId],
        references: [chartOfAccounts.id],
    }),
}));

export const paymentMethodsRelations = relations(paymentMethods, ({ one, many }) => ({
    account: one(chartOfAccounts, {
        fields: [paymentMethods.accountId],
        references: [chartOfAccounts.id],
    }),
    payments: many(payments),
}));

export const purchaseOrdersRelations = relations(purchaseOrders, ({ one, many }) => ({
    vendor: one(contacts, {
        fields: [purchaseOrders.vendorId],
        references: [contacts.id],
    }),
    orderItems: many(orderItems),
}));

export const salesOrdersRelations = relations(salesOrders, ({ one, many }) => ({
    customer: one(contacts, {
        fields: [salesOrders.customerId],
        references: [contacts.id],
    }),
    orderItems: many(orderItems),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
    contact: one(contacts, {
        fields: [invoices.contactId],
        references: [contacts.id],
    }),
    createdBy: one(users, {
        fields: [invoices.createdBy],
        references: [users.id],
    }),
    payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
    invoice: one(invoices, {
        fields: [payments.invoiceId],
        references: [invoices.id],
    }),
    paymentMethod: one(paymentMethods, {
        fields: [payments.paymentMethodId],
        references: [paymentMethods.id],
    }),
    createdBy: one(users, {
        fields: [payments.createdBy],
        references: [users.id],
    }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
    debitAccount: one(chartOfAccounts, {
        fields: [transactions.debitAccountId],
        references: [chartOfAccounts.id],
        relationName: 'debitAccount',
    }),
    creditAccount: one(chartOfAccounts, {
        fields: [transactions.creditAccountId],
        references: [chartOfAccounts.id],
        relationName: 'creditAccount',
    }),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
    product: one(products, {
        fields: [orderItems.productId],
        references: [products.id],
    }),
}));

export const productCategoriesRelations = relations(productCategories, ({ one, many }) => ({
    parent: one(productCategories, {
        fields: [productCategories.parentId],
        references: [productCategories.id],
    }),
    children: many(productCategories),
}));

export const companySettingsRelations = relations(companySettings, ({ one }) => ({
    updatedBy: one(users, {
        fields: [companySettings.updatedBy],
        references: [users.id],
    }),
}));
