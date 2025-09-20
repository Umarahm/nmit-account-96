import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { invoices, contacts, orderItems, products, companySettings } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateInvoicePDF } from "@/lib/pdf-generator";

// GET /api/invoices/[id]/pdf - Generate PDF for invoice
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const invoiceId = parseInt(params.id);
        if (isNaN(invoiceId)) {
            return NextResponse.json(
                { error: "Invalid invoice ID" },
                { status: 400 }
            );
        }

        // Get invoice with contact details
        const [invoice] = await db
            .select({
                id: invoices.id,
                invoiceNumber: invoices.invoiceNumber,
                type: invoices.type,
                contactId: invoices.contactId,
                orderId: invoices.orderId,
                invoiceDate: invoices.invoiceDate,
                dueDate: invoices.dueDate,
                status: invoices.status,
                subTotal: invoices.subTotal,
                totalAmount: invoices.totalAmount,
                taxAmount: invoices.taxAmount,
                discountAmount: invoices.discountAmount,
                paidAmount: invoices.paidAmount,
                balanceAmount: invoices.balanceAmount,
                currency: invoices.currency,
                terms: invoices.terms,
                notes: invoices.notes,
                createdAt: invoices.createdAt,
                updatedAt: invoices.updatedAt,
                contact: {
                    id: contacts.id,
                    name: contacts.name,
                    email: contacts.email,
                    mobile: contacts.mobile,
                    address: contacts.address,
                }
            })
            .from(invoices)
            .leftJoin(contacts, eq(invoices.contactId, contacts.id))
            .where(eq(invoices.id, invoiceId));

        if (!invoice) {
            return NextResponse.json(
                { error: "Invoice not found" },
                { status: 404 }
            );
        }

        // Get invoice items with product details
        const items = await db
            .select({
                id: orderItems.id,
                productId: orderItems.productId,
                quantity: orderItems.quantity,
                unitPrice: orderItems.unitPrice,
                taxAmount: orderItems.taxAmount,
                discountAmount: orderItems.discountAmount,
                totalAmount: orderItems.totalAmount,
                product: {
                    id: products.id,
                    name: products.name,
                    sku: products.sku,
                    hsnCode: products.hsnCode,
                }
            })
            .from(orderItems)
            .leftJoin(products, eq(orderItems.productId, products.id))
            .where(and(
                eq(orderItems.orderId, invoiceId),
                eq(orderItems.orderType, 'INVOICE')
            ));

        // Get company settings
        const [companyInfo] = await db
            .select()
            .from(companySettings)
            .limit(1);

        const companyData = companyInfo ? {
            name: companyInfo.companyName,
            address: companyInfo.address ? JSON.stringify(companyInfo.address) : '',
            email: companyInfo.email || '',
            phone: companyInfo.phone || '',
            gstNumber: companyInfo.taxInfo?.gstNumber || '',
            panNumber: companyInfo.taxInfo?.panNumber || '',
        } : {
            name: 'Shiv Furniture',
            address: 'Your Company Address',
            email: 'info@shivfurniture.com',
            phone: '+91 1234567890',
            gstNumber: '',
            panNumber: '',
        };

        // Generate PDF
        const pdfBuffer = await generateInvoicePDF({
            invoice: {
                ...invoice,
                items: items as any
            },
            companyInfo: companyData
        });

        // Return PDF as response
        return new NextResponse(pdfBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${invoice.invoiceNumber}.pdf"`,
                'Content-Length': pdfBuffer.length.toString(),
            },
        });

    } catch (error) {
        console.error("Error generating invoice PDF:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
