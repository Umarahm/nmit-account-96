import { pgTable, serial, varchar, numeric, boolean, timestamp, foreignKey, integer, unique, text, jsonb } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const products = pgTable("products", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	type: varchar({ length: 20 }).default('GOODS').notNull(),
	salesPrice: numeric("sales_price", { precision: 10, scale:  2 }),
	purchasePrice: numeric("purchase_price", { precision: 10, scale:  2 }),
	taxPercentage: numeric("tax_percentage", { precision: 5, scale:  2 }),
	hsnCode: varchar("hsn_code", { length: 20 }),
	category: varchar({ length: 100 }),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const orderItems = pgTable("order_items", {
	id: serial().primaryKey().notNull(),
	orderId: integer("order_id").notNull(),
	orderType: varchar("order_type", { length: 20 }).notNull(),
	productId: integer("product_id").notNull(),
	quantity: numeric({ precision: 10, scale:  2 }).notNull(),
	unitPrice: numeric("unit_price", { precision: 10, scale:  2 }).notNull(),
	taxAmount: numeric("tax_amount", { precision: 10, scale:  2 }),
	discountAmount: numeric("discount_amount", { precision: 10, scale:  2 }),
	totalAmount: numeric("total_amount", { precision: 10, scale:  2 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "order_items_product_id_products_id_fk"
		}),
]);

export const purchaseOrders = pgTable("purchase_orders", {
	id: serial().primaryKey().notNull(),
	poNumber: varchar("po_number", { length: 50 }).notNull(),
	vendorId: integer("vendor_id").notNull(),
	orderDate: timestamp("order_date", { mode: 'string' }).notNull(),
	status: varchar({ length: 20 }).default('DRAFT').notNull(),
	totalAmount: numeric("total_amount", { precision: 12, scale:  2 }),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.vendorId],
			foreignColumns: [contacts.id],
			name: "purchase_orders_vendor_id_contacts_id_fk"
		}),
	unique("purchase_orders_po_number_unique").on(table.poNumber),
]);

export const salesOrders = pgTable("sales_orders", {
	id: serial().primaryKey().notNull(),
	soNumber: varchar("so_number", { length: 50 }).notNull(),
	customerId: integer("customer_id").notNull(),
	orderDate: timestamp("order_date", { mode: 'string' }).notNull(),
	status: varchar({ length: 20 }).default('DRAFT').notNull(),
	totalAmount: numeric("total_amount", { precision: 12, scale:  2 }),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.customerId],
			foreignColumns: [contacts.id],
			name: "sales_orders_customer_id_contacts_id_fk"
		}),
	unique("sales_orders_so_number_unique").on(table.soNumber),
]);

export const taxes = pgTable("taxes", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	computation: varchar({ length: 20 }).default('PERCENTAGE').notNull(),
	applicableOn: varchar("applicable_on", { length: 20 }).default('SALES').notNull(),
	rate: numeric({ precision: 5, scale:  2 }).notNull(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const contacts = pgTable("contacts", {
	id: serial().primaryKey().notNull(),
	type: varchar({ length: 20 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 255 }),
	mobile: varchar({ length: 20 }),
	address: jsonb(),
	profile: jsonb(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const payments = pgTable("payments", {
	id: serial().primaryKey().notNull(),
	invoiceId: integer("invoice_id").notNull(),
	paymentDate: timestamp("payment_date", { mode: 'string' }).notNull(),
	amount: numeric({ precision: 12, scale:  2 }).notNull(),
	paymentMethod: varchar("payment_method", { length: 20 }).default('CASH').notNull(),
	reference: varchar({ length: 100 }),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.invoiceId],
			foreignColumns: [invoices.id],
			name: "payments_invoice_id_invoices_id_fk"
		}),
]);

export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	email: varchar({ length: 255 }).notNull(),
	name: varchar({ length: 255 }),
	password: text(),
	role: varchar({ length: 50 }).default('ACCOUNTANT').notNull(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("users_email_unique").on(table.email),
]);

export const chartOfAccounts = pgTable("chart_of_accounts", {
	id: serial().primaryKey().notNull(),
	code: varchar({ length: 20 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	type: varchar({ length: 50 }).notNull(),
	parentId: integer("parent_id"),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.parentId],
			foreignColumns: [table.id],
			name: "chart_of_accounts_parent_id_chart_of_accounts_id_fk"
		}),
	unique("chart_of_accounts_code_unique").on(table.code),
]);

export const invoices = pgTable("invoices", {
	id: serial().primaryKey().notNull(),
	invoiceNumber: varchar("invoice_number", { length: 50 }).notNull(),
	type: varchar({ length: 20 }).notNull(),
	contactId: integer("contact_id").notNull(),
	orderId: integer("order_id"),
	invoiceDate: timestamp("invoice_date", { mode: 'string' }).notNull(),
	dueDate: timestamp("due_date", { mode: 'string' }),
	status: varchar({ length: 20 }).default('UNPAID').notNull(),
	totalAmount: numeric("total_amount", { precision: 12, scale:  2 }),
	taxAmount: numeric("tax_amount", { precision: 12, scale:  2 }),
	discountAmount: numeric("discount_amount", { precision: 12, scale:  2 }),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.contactId],
			foreignColumns: [contacts.id],
			name: "invoices_contact_id_contacts_id_fk"
		}),
	unique("invoices_invoice_number_unique").on(table.invoiceNumber),
]);

export const transactions = pgTable("transactions", {
	id: serial().primaryKey().notNull(),
	date: timestamp({ mode: 'string' }).notNull(),
	description: text().notNull(),
	debitAccountId: integer("debit_account_id"),
	creditAccountId: integer("credit_account_id"),
	amount: numeric({ precision: 12, scale:  2 }).notNull(),
	reference: varchar({ length: 100 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.debitAccountId],
			foreignColumns: [chartOfAccounts.id],
			name: "transactions_debit_account_id_chart_of_accounts_id_fk"
		}),
	foreignKey({
			columns: [table.creditAccountId],
			foreignColumns: [chartOfAccounts.id],
			name: "transactions_credit_account_id_chart_of_accounts_id_fk"
		}),
]);
