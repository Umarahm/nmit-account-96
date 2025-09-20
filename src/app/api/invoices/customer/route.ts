import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { invoices, contacts, users } from '@/lib/db/schema';
import { eq, and, or, desc, like } from 'drizzle-orm';

interface CustomerInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  amount: number;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  description?: string;
  currency: string;
  customerName?: string;
  vendorName?: string;
}

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const search = searchParams.get('search');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');

        const userRole = session.user.role;
        const userEmail = session.user.email;

        let whereConditions = [];
        let customerInvoices = [];

        if (userRole === 'CONTACT') {
            // Customer can only see their own invoices
            // Find the contact record for this user
            const customerContact = await db
                .select({ id: contacts.id })
                .from(contacts)
                .where(eq(contacts.email, userEmail))
                .limit(1);

            if (customerContact.length === 0) {
                // No contact record found, return empty result
                return NextResponse.json({
                    invoices: [],
                    pagination: {
                        page: 1,
                        limit,
                        total: 0,
                        totalPages: 0,
                        hasNextPage: false,
                        hasPreviousPage: false
                    },
                    stats: {
                        total: 0,
                        totalOutstanding: 0,
                        totalPaid: 0,
                        totalOverdue: 0,
                        totalDraft: 0,
                        counts: { sent: 0, paid: 0, overdue: 0, draft: 0 }
                    },
                    lastUpdated: new Date().toISOString()
                });
            }

            whereConditions.push(eq(invoices.contactId, customerContact[0].id));
            whereConditions.push(eq(invoices.type, 'SALES')); // Customers see sales invoices sent to them
        } else {
            // Admin and Accountant can see all customer invoices
            whereConditions.push(eq(invoices.type, 'SALES'));
        }

        // Add status filter if provided
        if (status && status !== 'ALL') {
            whereConditions.push(eq(invoices.status, status));
        }

        // Build search conditions
        let searchConditions = [];
        if (search) {
            const searchLower = `%${search.toLowerCase()}%`;
            searchConditions.push(
                like(invoices.invoiceNumber, searchLower),
                like(invoices.notes, searchLower),
                like(contacts.name, searchLower)
            );
        }

        // Fetch invoices from database
        const query = db
            .select({
                id: invoices.id,
                invoiceNumber: invoices.invoiceNumber,
                invoiceDate: invoices.invoiceDate,
                dueDate: invoices.dueDate,
                totalAmount: invoices.totalAmount,
                status: invoices.status,
                notes: invoices.notes,
                currency: invoices.currency,
                contactName: contacts.name,
                contactEmail: contacts.email,
            })
            .from(invoices)
            .leftJoin(contacts, eq(invoices.contactId, contacts.id))
            .where(and(...whereConditions, ...(searchConditions.length > 0 ? [or(...searchConditions)] : [])))
            .orderBy(desc(invoices.invoiceDate))
            .limit(limit)
            .offset((page - 1) * limit);

        const dbInvoices = await query;

        // Convert to CustomerInvoice format
        customerInvoices = dbInvoices.map(inv => ({
            id: inv.id.toString(),
            invoiceNumber: inv.invoiceNumber,
            date: inv.invoiceDate?.toISOString().split('T')[0] || '',
            dueDate: inv.dueDate?.toISOString().split('T')[0] || '',
            amount: parseFloat(inv.totalAmount || '0'),
            status: inv.status as 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED',
            description: inv.notes || '',
            currency: inv.currency || 'INR',
            customerName: userRole === 'CONTACT' ? undefined : inv.contactName || '',
            vendorName: userRole === 'CONTACT' ? 'Shiv Accounts Services' : undefined,
        }));

        // Get total count for pagination
        const totalCountQuery = db
            .select({ count: invoices.id })
            .from(invoices)
            .leftJoin(contacts, eq(invoices.contactId, contacts.id))
            .where(and(...whereConditions, ...(searchConditions.length > 0 ? [or(...searchConditions)] : [])));

        const totalResult = await totalCountQuery;
        const total = totalResult.length;

        const totalPages = Math.ceil(total / limit);

        // Calculate statistics from actual data
        const stats = {
            total: customerInvoices.length,
            totalOutstanding: customerInvoices
                .filter(inv => ['SENT', 'OVERDUE'].includes(inv.status))
                .reduce((sum, inv) => sum + inv.amount, 0),
            totalPaid: customerInvoices
                .filter(inv => inv.status === 'PAID')
                .reduce((sum, inv) => sum + inv.amount, 0),
            totalOverdue: customerInvoices
                .filter(inv => inv.status === 'OVERDUE')
                .reduce((sum, inv) => sum + inv.amount, 0),
            totalDraft: customerInvoices
                .filter(inv => inv.status === 'DRAFT')
                .reduce((sum, inv) => sum + inv.amount, 0),
            counts: {
                sent: customerInvoices.filter(inv => inv.status === 'SENT').length,
                paid: customerInvoices.filter(inv => inv.status === 'PAID').length,
                overdue: customerInvoices.filter(inv => inv.status === 'OVERDUE').length,
                draft: customerInvoices.filter(inv => inv.status === 'DRAFT').length
            }
        };

        return NextResponse.json({
            invoices: customerInvoices,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1
            },
            stats,
            lastUpdated: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error fetching customer invoices:', error);
        return NextResponse.json(
            { error: 'Failed to fetch invoices' },
            { status: 500 }
        );
    }
}