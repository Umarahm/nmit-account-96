# Database Schema Documentation - Shiv Accounts Cloud

## Overview

This document describes the complete database schema for Shiv Accounts Cloud, a comprehensive accounting management system designed for manufacturing businesses with HSN code integration.

## Schema Design Principles

1. **Double-Entry Bookkeeping**: Full support for accounting standards
2. **Multi-Currency Support**: Handle multiple currencies with exchange rates
3. **Tax Compliance**: Built-in GST and tax management for Indian businesses
4. **Audit Trail**: Complete tracking of all changes and transactions
5. **Scalability**: Designed for growth from small to enterprise businesses
6. **Performance**: Optimized with proper indexes and relationships

## Core Tables

### 1. Users Management

#### `users`
- **Purpose**: System users and authentication
- **Key Fields**: 
  - `email` (unique): User login email
  - `role`: ADMIN, ACCOUNTANT, CONTACT
  - `isActive`: Enable/disable user access
- **Features**: Role-based access control, profile management

### 2. Master Data

#### `contacts`
- **Purpose**: Customers and vendors management
- **Key Fields**:
  - `type`: CUSTOMER, VENDOR, BOTH
  - `taxInfo`: GST, PAN details (JSON)
  - `address`, `billingAddress`, `shippingAddress`: Structured address data
  - `creditLimit`, `paymentTerms`: Business terms
- **Features**: Multi-address support, tax information storage

#### `products`
- **Purpose**: Product and service catalog
- **Key Fields**:
  - `sku`: Stock keeping unit
  - `hsnCode`, `sacCode`: Tax classification codes
  - `currentStock`, `stockValue`: Inventory tracking
  - `specifications`: Detailed product info (JSON)
- **Features**: Stock tracking, HSN integration, multi-unit support

#### `product_categories`
- **Purpose**: Product organization
- **Features**: Hierarchical categories with parent-child relationships

### 3. Chart of Accounts

#### `chart_of_accounts`
- **Purpose**: Financial account structure
- **Key Fields**:
  - `code`: Unique account code
  - `type`: ASSET, LIABILITY, EQUITY, INCOME, EXPENSE
  - `parentId`: Hierarchical structure
  - `level`: Account depth level
  - `isGroup`: Group accounts vs transaction accounts
- **Features**: Standard Indian accounting structure, unlimited hierarchy

### 4. Tax Management

#### `taxes`
- **Purpose**: Tax rate configuration
- **Key Fields**:
  - `rate`: Tax percentage
  - `applicableOn`: SALES, PURCHASE, BOTH
  - `computation`: PERCENTAGE, FIXED
- **Features**: Multiple tax types, account mapping

### 5. Financial Settings

#### `currencies`
- **Purpose**: Multi-currency support
- **Key Fields**:
  - `code`: ISO currency code (INR, USD, EUR)
  - `exchangeRate`: Current exchange rate
  - `isBaseCurrency`: Base currency flag
- **Features**: Automatic exchange rate updates

#### `payment_methods`
- **Purpose**: Payment method configuration
- **Key Fields**:
  - `type`: CASH, BANK, CARD, DIGITAL
  - `accountId`: Linked chart of account
- **Features**: Account integration, digital payment support

#### `company_settings`
- **Purpose**: Global system configuration
- **Key Fields**:
  - `companyName`, `address`: Company details
  - `taxInfo`: GST, PAN, CIN details
  - `fiscalYearStart`: Fiscal year configuration
  - `settings`: Additional configuration (JSON)
- **Features**: Centralized configuration management

## Transaction Tables

### 6. Order Management

#### `purchase_orders`
- **Purpose**: Vendor purchase orders
- **Key Fields**:
  - `poNumber`: Unique purchase order number
  - `vendorId`: Reference to contacts
  - `status`: DRAFT, APPROVED, RECEIVED
- **Features**: Auto-numbering, status workflow

#### `sales_orders`
- **Purpose**: Customer sales orders
- **Key Fields**:
  - `soNumber`: Unique sales order number
  - `customerId`: Reference to contacts
  - `status`: DRAFT, APPROVED, DELIVERED
- **Features**: Auto-numbering, delivery tracking

#### `order_items`
- **Purpose**: Line items for orders
- **Key Fields**:
  - `orderType`: PURCHASE, SALES
  - `quantity`, `unitPrice`: Item details
  - `taxAmount`, `discountAmount`: Calculations
- **Features**: Flexible order line items, automatic calculations

### 7. Invoicing

#### `invoices`
- **Purpose**: Sales invoices and purchase bills
- **Key Fields**:
  - `invoiceNumber`: Unique invoice number
  - `type`: PURCHASE, SALES
  - `status`: PAID, UNPAID, PARTIAL, OVERDUE, CANCELLED
  - `subTotal`, `taxAmount`, `totalAmount`: Amount breakdown
  - `paidAmount`, `balanceAmount`: Payment tracking
- **Features**: Multi-currency support, payment tracking, aging reports

### 8. Payment Management

#### `payments`
- **Purpose**: Payment transactions
- **Key Fields**:
  - `paymentNumber`: Unique payment reference
  - `paymentMethod`: Payment type
  - `status`: PENDING, COMPLETED, FAILED, BOUNCED
  - `reference`: External reference (cheque, UPI ID)
- **Features**: Multiple payment methods, bank reconciliation

### 9. Financial Transactions

#### `transactions`
- **Purpose**: Double-entry bookkeeping ledger
- **Key Fields**:
  - `debitAccountId`, `creditAccountId`: Account references
  - `amount`: Transaction amount
  - `reference`: Source document reference
- **Features**: Automatic journal entries, audit trail

## Key Features

### Relationships and Constraints

1. **Foreign Key Relationships**: Proper referential integrity
2. **Indexes**: Performance optimization on frequently queried fields
3. **Cascading**: Proper handling of related data
4. **Validation**: Data integrity at database level

### Data Types

1. **Decimal Fields**: Precise monetary calculations
2. **JSON Fields**: Flexible structured data storage
3. **Timestamp Fields**: Complete audit trail
4. **Varchar Constraints**: Appropriate field lengths

### Business Logic Support

1. **Multi-Currency**: Exchange rate handling
2. **Tax Calculations**: Automatic tax computation
3. **Stock Tracking**: Real-time inventory management
4. **Document Numbering**: Auto-generated unique numbers
5. **Fiscal Year**: Indian fiscal year support (April-March)

## Setup and Migration

### Initial Setup

1. **Create Database**: Neon PostgreSQL database
2. **Run Migrations**: `npm run db:migrate`
3. **Seed Data**: `npm run db:setup`

### Seed Data Includes

1. **Chart of Accounts**: Standard Indian accounting structure
2. **Tax Rates**: Common GST rates (0%, 5%, 12%, 18%, 28%)
3. **Currencies**: INR, USD, EUR, GBP with exchange rates
4. **Payment Methods**: Cash, Bank, Card, Digital payments
5. **Product Categories**: Manufacturing categories
6. **Company Settings**: Template configuration

### Database Utilities

```bash
# Setup complete database
npm run db:setup

# Generate new migration
npm run db:generate

# Run migrations
npm run db:migrate

# Seed data only
npm run db:seed

# Reset and re-seed
npm run db:reset

# Open Drizzle Studio
npm run db:studio
```

## Performance Considerations

### Indexes

- **Primary Keys**: All tables have efficient primary keys
- **Foreign Keys**: Proper indexing on relationship fields
- **Search Fields**: Indexes on frequently searched columns
- **Composite Indexes**: Multi-column indexes where needed

### Query Optimization

- **Selective Queries**: Avoid SELECT * patterns
- **Pagination**: Built-in support for large datasets
- **Joins**: Efficient relationship handling
- **Caching**: Support for query result caching

## Security Features

1. **User Roles**: Role-based access control
2. **Audit Trail**: Complete change tracking
3. **Data Validation**: Input sanitization
4. **Soft Deletes**: Preserve data integrity
5. **Encryption**: Sensitive data protection

## Compliance and Standards

1. **Indian Accounting Standards**: AS compliance
2. **GST Compliance**: Built-in GST handling
3. **Audit Requirements**: Complete audit trail
4. **Data Retention**: Configurable retention policies

This schema provides a solid foundation for a comprehensive accounting system that can scale from small businesses to enterprise-level operations while maintaining compliance with Indian business requirements.