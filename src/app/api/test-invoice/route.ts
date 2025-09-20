import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { invoices, contacts, orderItems, products } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";

// GET /api/test-invoice - Test invoice creation and retrieval
export async function GET(request: NextRequest) {
    try {
        // Test 1: Check if we can fetch invoices
        const invoiceCount = await db
            .select({ count: sql`count(*)` })
            .from(invoices);

        // Test 2: Check if we can fetch contacts
        const contactCount = await db
            .select({ count: sql`count(*)` })
            .from(contacts);

        // Test 3: Check if we can fetch products
        const productCount = await db
            .select({ count: sql`count(*)` })
            .from(products);

        // Test 4: Try to create a test invoice (if we have contacts and products)
        let testInvoice = null;
        if (contactCount[0].count > 0 && productCount[0].count > 0) {
            try {
                // Get first contact and product
                const [contact] = await db
                    .select()
                    .from(contacts)
                    .limit(1);

                const [product] = await db
                    .select()
                    .from(products)
                    .limit(1);

                if (contact && product) {
                    // Create test invoice
                    const [newInvoice] = await db
                        .insert(invoices)
                        .values({
                            invoiceNumber: `TEST-${Date.now()}`,
                            type: 'SALES',
                            contactId: contact.id,
                            invoiceDate: new Date().toISOString(),
                            status: 'UNPAID',
                            subTotal: '100.00',
                            totalAmount: '100.00',
                            taxAmount: '0.00',
                            discountAmount: '0.00',
                            paidAmount: '0.00',
                            balanceAmount: '100.00',
                            currency: 'INR',
                            notes: 'Test invoice created by API test',
                        })
                        .returning();

                    // Create test invoice item
                    await db
                        .insert(orderItems)
                        .values({
                            orderId: newInvoice.id,
                            orderType: 'INVOICE',
                            productId: product.id,
                            quantity: '1.00',
                            unitPrice: '100.00',
                            taxAmount: '0.00',
                            discountAmount: '0.00',
                            totalAmount: '100.00',
                        });

                    testInvoice = newInvoice;
                }
            } catch (error) {
                console.error('Error creating test invoice:', error);
            }
        }

        return NextResponse.json({
            success: true,
            message: "Invoice API test completed",
            results: {
                invoiceCount: invoiceCount[0].count,
                contactCount: contactCount[0].count,
                productCount: productCount[0].count,
                testInvoiceCreated: testInvoice ? true : false,
                testInvoiceId: testInvoice?.id || null,
            }
        });

    } catch (error) {
        console.error("Error in invoice API test:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Internal server error",
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
