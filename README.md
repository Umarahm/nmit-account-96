# Shiv Accounts Cloud - Modular Manufacturing Management Platform

A cloud-based accounting system for manufacturing businesses with modular architecture, HSN code integration, and comprehensive financial management capabilities.

## Tech Stack
- **Frontend:** Next.js 15+ with App Router
- **Database:** Neon PostgreSQL with Drizzle ORM
- **UI:** Shadcn/ui with Tailwind CSS
- **Authentication:** NextAuth.js

## Getting Started

### 1. Environment Setup

Copy the environment variables:
```bash
cp .env.example .env.local
```

Update `.env.local` with your Neon PostgreSQL connection string and NextAuth configuration.

### 2. Database Setup

1. Create a Neon PostgreSQL database at [console.neon.tech](https://console.neon.tech)
2. Copy the connection string to `.env.local`
3. Generate and run migrations:

```bash
npm run db:generate
npm run db:push
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
