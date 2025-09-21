import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contacts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/contacts/[id] - Get single contact
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const contactId = parseInt(id);
        if (isNaN(contactId)) {
            return NextResponse.json(
                { error: "Invalid contact ID" },
                { status: 400 }
            );
        }

        const [contact] = await db
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
            .where(and(eq(contacts.id, contactId), eq(contacts.isActive, true)));

        if (!contact) {
            return NextResponse.json(
                { error: "Contact not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ contact });

    } catch (error) {
        console.error("Error fetching contact:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// PUT /api/contacts/[id] - Update contact
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const contactId = parseInt(id);
        if (isNaN(contactId)) {
            return NextResponse.json(
                { error: "Invalid contact ID" },
                { status: 400 }
            );
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
            currency,
            notes
        } = body;

        // Check if contact exists
        const [existingContact] = await db
            .select()
            .from(contacts)
            .where(and(eq(contacts.id, contactId), eq(contacts.isActive, true)));

        if (!existingContact) {
            return NextResponse.json(
                { error: "Contact not found" },
                { status: 404 }
            );
        }

        // Check if email is being changed and if it already exists
        if (email && email !== existingContact.email) {
            const duplicateContact = await db
                .select()
                .from(contacts)
                .where(and(eq(contacts.email, email), eq(contacts.isActive, true)))
                .limit(1);

            if (duplicateContact.length > 0) {
                return NextResponse.json(
                    { error: "Contact with this email already exists" },
                    { status: 400 }
                );
            }
        }

        // Update contact
        const [updatedContact] = await db
            .update(contacts)
            .set({
                type: type || existingContact.type,
                name: name || existingContact.name,
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
                creditLimit: creditLimit ? String(parseFloat(creditLimit)) : existingContact.creditLimit,
                paymentTerms: paymentTerms ? parseInt(paymentTerms) : existingContact.paymentTerms,
                currency: currency || existingContact.currency,
                notes,
                updatedAt: new Date(),
            })
            .where(eq(contacts.id, contactId))
            .returning();

        return NextResponse.json({
            message: "Contact updated successfully",
            contact: updatedContact
        });

    } catch (error) {
        console.error("Error updating contact:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// DELETE /api/contacts/[id] - Soft delete contact
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const contactId = parseInt(id);
        if (isNaN(contactId)) {
            return NextResponse.json(
                { error: "Invalid contact ID" },
                { status: 400 }
            );
        }

        // Check if contact exists
        const [existingContact] = await db
            .select()
            .from(contacts)
            .where(and(eq(contacts.id, contactId), eq(contacts.isActive, true)));

        if (!existingContact) {
            return NextResponse.json(
                { error: "Contact not found" },
                { status: 404 }
            );
        }

        // Soft delete contact
        await db
            .update(contacts)
            .set({
                isActive: false,
                updatedAt: new Date(),
            })
            .where(eq(contacts.id, contactId));

        return NextResponse.json({
            message: "Contact deleted successfully"
        });

    } catch (error) {
        console.error("Error deleting contact:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
