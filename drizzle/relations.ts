import { relations } from "drizzle-orm/relations";
import { products, orderItems, contacts, purchaseOrders, salesOrders, invoices, payments, chartOfAccounts, transactions } from "./schema";

export const orderItemsRelations = relations(orderItems, ({one}) => ({
	product: one(products, {
		fields: [orderItems.productId],
		references: [products.id]
	}),
}));

export const productsRelations = relations(products, ({many}) => ({
	orderItems: many(orderItems),
}));

export const purchaseOrdersRelations = relations(purchaseOrders, ({one}) => ({
	contact: one(contacts, {
		fields: [purchaseOrders.vendorId],
		references: [contacts.id]
	}),
}));

export const contactsRelations = relations(contacts, ({many}) => ({
	purchaseOrders: many(purchaseOrders),
	salesOrders: many(salesOrders),
	invoices: many(invoices),
}));

export const salesOrdersRelations = relations(salesOrders, ({one}) => ({
	contact: one(contacts, {
		fields: [salesOrders.customerId],
		references: [contacts.id]
	}),
}));

export const paymentsRelations = relations(payments, ({one}) => ({
	invoice: one(invoices, {
		fields: [payments.invoiceId],
		references: [invoices.id]
	}),
}));

export const invoicesRelations = relations(invoices, ({one, many}) => ({
	payments: many(payments),
	contact: one(contacts, {
		fields: [invoices.contactId],
		references: [contacts.id]
	}),
}));

export const chartOfAccountsRelations = relations(chartOfAccounts, ({one, many}) => ({
	chartOfAccount: one(chartOfAccounts, {
		fields: [chartOfAccounts.parentId],
		references: [chartOfAccounts.id],
		relationName: "chartOfAccounts_parentId_chartOfAccounts_id"
	}),
	chartOfAccounts: many(chartOfAccounts, {
		relationName: "chartOfAccounts_parentId_chartOfAccounts_id"
	}),
	transactions_debitAccountId: many(transactions, {
		relationName: "transactions_debitAccountId_chartOfAccounts_id"
	}),
	transactions_creditAccountId: many(transactions, {
		relationName: "transactions_creditAccountId_chartOfAccounts_id"
	}),
}));

export const transactionsRelations = relations(transactions, ({one}) => ({
	chartOfAccount_debitAccountId: one(chartOfAccounts, {
		fields: [transactions.debitAccountId],
		references: [chartOfAccounts.id],
		relationName: "transactions_debitAccountId_chartOfAccounts_id"
	}),
	chartOfAccount_creditAccountId: one(chartOfAccounts, {
		fields: [transactions.creditAccountId],
		references: [chartOfAccounts.id],
		relationName: "transactions_creditAccountId_chartOfAccounts_id"
	}),
}));