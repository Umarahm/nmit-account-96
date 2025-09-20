import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { invoices, contacts, users } from '@/lib/db/schema';
import { eq, and, or, desc, like } from 'drizzle-orm';

interface CustomerVendorBill {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  amount: number;
  status: 'DRAFT' | 'UNPAID' | 'PAID' | 'PARTIAL' | 'OVERDUE' | 'CANCELLED';
  description?: string;
  currency: string;
  vendorName?: string;
  paymentTerms?: string;
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
        let customerBills = [];

        if (userRole === 'CONTACT') {
            // Customer can only see vendor bills where they are the customer
            // Find the contact record for this user
            const customerContact = await db
                .select({ id: contacts.id })
                .from(contacts)
                .where(eq(contacts.email, userEmail))
                .limit(1);

            if (customerContact.length === 0) {
                // No contact record found, return empty result
                return NextResponse.json({
                    bills: [],
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
                        counts: { unpaid: 0, paid: 0, overdue: 0, draft: 0, partial: 0 }
                    },
                    lastUpdated: new Date().toISOString()
                });
            }

            whereConditions.push(eq(invoices.contactId, customerContact[0].id));
            whereConditions.push(eq(invoices.type, 'PURCHASE')); // Customers see purchase invoices (vendor bills)
        } else {
            // Admin and Accountant can see all vendor bills
            whereConditions.push(eq(invoices.type, 'PURCHASE'));
        }

        // Add status filter if provided
        if (status && status !== 'ALL') {
            // Map status values to match database values
            const statusMap: { [key: string]: string } = {
                'UNPAID': 'UNPAID',
                'PAID': 'PAID',
                'PARTIAL': 'PARTIAL',
                'OVERDUE': 'OVERDUE',
                'DRAFT': 'DRAFT',
                'CANCELLED': 'CANCELLED'
            };
            const dbStatus = statusMap[status] || status;
            whereConditions.push(eq(invoices.status, dbStatus));
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

        // Fetch vendor bills from database
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
                terms: invoices.terms,
                contactName: contacts.name,
                contactEmail: contacts.email,
            })
            .from(invoices)
            .leftJoin(contacts, eq(invoices.contactId, contacts.id))
            .where(and(...whereConditions, ...(searchConditions.length > 0 ? [or(...searchConditions)] : [])))
            .orderBy(desc(invoices.invoiceDate))
            .limit(limit)
            .offset((page - 1) * limit);

        const dbBills = await query;

        // Convert to CustomerVendorBill format
        customerBills = dbBills.map(bill => ({
            id: bill.id.toString(),
            invoiceNumber: bill.invoiceNumber,
            date: bill.invoiceDate?.toISOString().split('T')[0] || '',
            dueDate: bill.dueDate?.toISOString().split('T')[0] || '',
            amount: parseFloat(bill.totalAmount || '0'),
            status: bill.status as 'DRAFT' | 'UNPAID' | 'PAID' | 'PARTIAL' | 'OVERDUE' | 'CANCELLED',
            description: bill.notes || '',
            currency: bill.currency || 'INR',
            vendorName: userRole === 'CONTACT' ? bill.contactName || 'Unknown Vendor' : bill.contactName || '',
            paymentTerms: bill.terms || '',
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
            total: customerBills.length,
            totalOutstanding: customerBills
                .filter(bill => ['UNPAID', 'OVERDUE', 'PARTIAL'].includes(bill.status))
                .reduce((sum, bill) => sum + bill.amount, 0),
            totalPaid: customerBills
                .filter(bill => bill.status === 'PAID')
                .reduce((sum, bill) => sum + bill.amount, 0),
            totalOverdue: customerBills
                .filter(bill => bill.status === 'OVERDUE')
                .reduce((sum, bill) => sum + bill.amount, 0),
            totalDraft: customerBills
                .filter(bill => bill.status === 'DRAFT')
                .reduce((sum, bill) => sum + bill.amount, 0),
            counts: {
                unpaid: customerBills.filter(bill => bill.status === 'UNPAID').length,
                paid: customerBills.filter(bill => bill.status === 'PAID').length,
                overdue: customerBills.filter(bill => bill.status === 'OVERDUE').length,
                draft: customerBills.filter(bill => bill.status === 'DRAFT').length,
                partial: customerBills.filter(bill => bill.status === 'PARTIAL').length,
            }
        };

        return NextResponse.json({
            bills: customerBills,
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
        console.error('Error fetching customer vendor bills:', error);
        return NextResponse.json(
            { error: 'Failed to fetch vendor bills' },
            { status: 500 }
        );
    }
}