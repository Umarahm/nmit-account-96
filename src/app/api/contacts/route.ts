import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contacts } from "@/lib/db/schema";
import { eq, desc, and, or, like, sql } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/contacts - Get all contacts with filtering and pagination
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type'); // CUSTOMER, VENDOR, BOTH
        const search = searchParams.get('search');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const offset = (page - 1) * limit;

        let whereConditions = [eq(contacts.isActive, true)];

        if (type && type !== 'ALL') {
            whereConditions.push(
                or(
                    eq(contacts.type, type),
                    eq(contacts.type, 'BOTH')
                )
            );
        }

        if (search) {
            whereConditions.push(
                or(
                    like(contacts.name, `%${search}%`),
                    like(contacts.email, `%${search}%`),
                    like(contacts.mobile, `%${search}%`)
                )
            );
        }

        const [contactsList, totalCount] = await Promise.all([
            db
                .select({
                    id: contacts.id,
                    type: contacts.type,
                    name: contacts.name,
                    displayName: contacts.displayName,
                    email: contacts.email,
                    mobile: contacts.mobile,
                    phone: contacts.phone,
                    website: contacts.website,
                    address: contacts.address,
                    billingAddress: contacts.billingAddress,
                    shippingAddress: contacts.shippingAddress,
                    taxInfo: contacts.taxInfo,
                    profile: contacts.profile,
                    creditLimit: contacts.creditLimit,
                    paymentTerms: contacts.paymentTerms,
                    currency: contacts.currency,
                    notes: contacts.notes,
                    isActive: contacts.isActive,
                    createdAt: contacts.createdAt,
                    updatedAt: contacts.updatedAt,
                })
                .from(contacts)
                .where(and(...whereConditions))
                .orderBy(desc(contacts.createdAt))
                .limit(limit)
                .offset(offset),

            db
                .select({ count: sql`count(*)` })
                .from(contacts)
                .where(and(...whereConditions))
        ]);

        return NextResponse.json({
            contacts: contactsList,
            pagination: {
                page,
                limit,
                total: totalCount[0].count,
                pages: Math.ceil(totalCount[0].count / limit)
            }
        });

    } catch (error) {
        console.error("Error fetching contacts:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// POST /api/contacts - Create new contact
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const {
            type,
            name,
            displayName,
            email,
            mobile,
            phone,
            website,
            address,
            billingAddress,
            shippingAddress,
            taxInfo,
            profile,
            creditLimit,
            paymentTerms,
            currency = 'INR',
            notes
        } = body;

        // Validation
        if (!type || !name) {
            return NextResponse.json(
                { error: "Type and name are required" },
                { status: 400 }
            );
        }

        if (!['CUSTOMER', 'VENDOR', 'BOTH'].includes(type)) {
            return NextResponse.json(
                { error: "Type must be CUSTOMER, VENDOR, or BOTH" },
                { status: 400 }
            );
        }

        // Check if contact with same email already exists
        if (email) {
            const existingContact = await db
                .select()
                .from(contacts)
                .where(and(eq(contacts.email, email), eq(contacts.isActive, true)))
                .limit(1);

            if (existingContact.length > 0) {
                return NextResponse.json(
                    { error: "Contact with this email already exists" },
                    { status: 400 }
                );
            }
        }

        // Create contact
        const [newContact] = await db
            .insert(contacts)
            .values({
                type,
                name,
                displayName,
                email,
                mobile,
                phone,
                website,
                address,
                billingAddress,
                shippingAddress,
                taxInfo,
                profile,
                creditLimit: creditLimit ? parseFloat(creditLimit) : null,
                paymentTerms: paymentTerms ? parseInt(paymentTerms) : null,
                currency,
                notes,
                createdBy: parseInt(session.user.id),
                isActive: true,
            })
            .returning();

        return NextResponse.json({
            message: "Contact created successfully",
            contact: newContact
        }, { status: 201 });

    } catch (error) {
        console.error("Error creating contact:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
