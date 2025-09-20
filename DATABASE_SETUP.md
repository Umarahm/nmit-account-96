# Database Setup Guide - Shiv Accounts Cloud

## Quick Setup

### 1. Environment Configuration

Create a `.env.local` file in the project root:

```bash
# Database Configuration (Required)
DATABASE_URL="postgresql://username:password@host:port/database"

# NextAuth Configuration (Required)
NEXTAUTH_SECRET="your-random-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Optional Configuration
COMPANY_NAME="Your Company Name"
COMPANY_EMAIL="info@yourcompany.com"
NODE_ENV="development"
```

### 2. Database Setup Commands

```bash
# Option 1: Complete setup (recommended for new projects)
npm run db:setup

# Option 2: Fresh setup (if you have issues)
npm run db:fresh

# Option 3: Manual setup
npm run db:push      # Push schema to database
npm run db:seed      # Add initial data

# Check database status
npm run db:check
```

## Troubleshooting

### Error: "relation already exists" (42P07)

This error occurs when tables already exist in your database. Here are the solutions:

#### Solution 1: Use db:fresh (Recommended)
```bash
npm run db:fresh
```
This command will push the schema and seed data, handling existing tables gracefully.

#### Solution 2: Reset Database
```bash
npm run db:reset --force
```
⚠️ **Warning**: This will delete all existing data!

#### Solution 3: Manual Migration
```bash
# Generate new migration
npm run db:generate

# Apply migrations
npm run db:migrate
```

### Error: "Database connection failed"

1. **Check DATABASE_URL**: Ensure your `.env.local` file has the correct database URL
2. **Test Connection**: Run `npm run db:check` to diagnose the issue
3. **Verify Database**: Make sure your PostgreSQL database is running and accessible

### Error: "No migrations found"

This usually means you're using a fresh database:

```bash
# Push schema directly to fresh database
npm run db:push

# Then seed with initial data
npm run db:seed
```

## Database Commands Reference

| Command | Description | Use Case |
|---------|-------------|----------|
| `npm run db:setup` | Complete setup with error handling | New project setup |
| `npm run db:fresh` | Push schema + seed data | Quick setup/reset |
| `npm run db:check` | Check database status | Troubleshooting |
| `npm run db:generate` | Generate new migration | After schema changes |
| `npm run db:push` | Push schema to database | Fresh database |
| `npm run db:migrate` | Run pending migrations | Apply schema changes |
| `npm run db:seed` | Add initial data only | Populate empty tables |
| `npm run db:reset` | Reset and re-seed | Complete reset |
| `npm run db:studio` | Open Drizzle Studio | Visual database management |

## What Gets Seeded

The initial database setup includes:

### Chart of Accounts
- Complete Indian accounting structure
- Assets, Liabilities, Equity, Income, Expenses
- Hierarchical account organization

### Tax Configurations
- GST rates: 0%, 5%, 12%, 18%, 28%
- CGST, SGST, IGST configurations
- Tax account mappings

### Currencies
- INR (Indian Rupee) as base currency
- USD, EUR, GBP with exchange rates
- Multi-currency support ready

### Payment Methods
- Cash, Bank Transfer, Cheque
- Credit/Debit Cards
- Digital payments (UPI, Net Banking)

### Product Categories
- Manufacturing categories
- Raw Materials, Finished Goods
- Work in Progress, Consumables

### Company Settings
- Template company configuration
- Indian business settings
- Fiscal year: April - March

## Advanced Setup

### Custom Seed Data

To customize the initial data, edit `src/lib/db/seed.ts`:

```typescript
// Modify default data arrays
const defaultChartOfAccounts = [
  // Your custom accounts
];

const defaultTaxes = [
  // Your custom tax rates
];
```

### Migration Workflow

1. **Make Schema Changes**: Edit `src/lib/db/schema.ts`
2. **Generate Migration**: `npm run db:generate`
3. **Review Migration**: Check the generated SQL file
4. **Apply Migration**: `npm run db:migrate`

### Development Workflow

```bash
# Daily development
npm run dev          # Start application
npm run db:studio    # Manage database visually

# When schema changes
npm run db:generate  # Generate migration
npm run db:migrate   # Apply changes

# When adding new seed data
npm run db:seed      # Add new data only
```

## Database Structure

See [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) for complete schema documentation.

## Support

If you encounter issues:

1. **Check Status**: `npm run db:check`
2. **Review Logs**: Check console output for specific errors
3. **Fresh Start**: Try `npm run db:fresh`
4. **Manual Reset**: Use `npm run db:reset --force` as last resort

The database system is designed to be robust and handle most common scenarios automatically.