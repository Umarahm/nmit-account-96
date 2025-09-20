import puppeteer from 'puppeteer';
import { Invoice, Contact, OrderItem, Product } from '@/lib/db/schema';
import { formatCurrency } from './db/utils';

export interface InvoiceData {
    invoice: Invoice & {
        contact: Contact;
        items: (OrderItem & { product: Product })[];
    };
    companyInfo: {
        name: string;
        address: string;
        email: string;
        phone: string;
        gstNumber?: string;
        panNumber?: string;
    };
}

export async function generateInvoicePDF(invoiceData: InvoiceData): Promise<Buffer> {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();

        const html = generateInvoiceHTML(invoiceData);

        await page.setContent(html, { waitUntil: 'networkidle0' });

        const pdf = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20mm',
                right: '20mm',
                bottom: '20mm',
                left: '20mm'
            }
        });

        return pdf;
    } finally {
        await browser.close();
    }
}

function generateInvoiceHTML(data: InvoiceData): string {
    const { invoice, companyInfo } = data;
    const isPurchase = invoice.type === 'PURCHASE';
    const documentTitle = isPurchase ? 'VENDOR BILL' : 'INVOICE';

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${documentTitle} - ${invoice.invoiceNumber}</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Arial', sans-serif;
                line-height: 1.6;
                color: #333;
                background: white;
            }
            
            .container {
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
            }
            
            .header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 30px;
                border-bottom: 2px solid #e5e7eb;
                padding-bottom: 20px;
            }
            
            .company-info h1 {
                font-size: 24px;
                color: #1f2937;
                margin-bottom: 10px;
            }
            
            .company-info p {
                margin: 2px 0;
                color: #6b7280;
            }
            
            .document-info {
                text-align: right;
            }
            
            .document-title {
                font-size: 28px;
                font-weight: bold;
                color: #1f2937;
                margin-bottom: 10px;
            }
            
            .document-number {
                font-size: 18px;
                color: #6b7280;
                margin-bottom: 5px;
            }
            
            .document-date {
                color: #6b7280;
            }
            
            .billing-section {
                display: flex;
                justify-content: space-between;
                margin-bottom: 30px;
            }
            
            .billing-info {
                flex: 1;
                margin-right: 20px;
            }
            
            .billing-info h3 {
                color: #1f2937;
                margin-bottom: 10px;
                font-size: 16px;
            }
            
            .billing-info p {
                margin: 2px 0;
                color: #6b7280;
            }
            
            .items-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
            }
            
            .items-table th {
                background-color: #f9fafb;
                padding: 12px 8px;
                text-align: left;
                font-weight: 600;
                color: #374151;
                border: 1px solid #e5e7eb;
            }
            
            .items-table td {
                padding: 12px 8px;
                border: 1px solid #e5e7eb;
                color: #374151;
            }
            
            .items-table tr:nth-child(even) {
                background-color: #f9fafb;
            }
            
            .text-right {
                text-align: right;
            }
            
            .text-center {
                text-align: center;
            }
            
            .totals-section {
                display: flex;
                justify-content: flex-end;
                margin-top: 20px;
            }
            
            .totals-table {
                width: 300px;
                border-collapse: collapse;
            }
            
            .totals-table td {
                padding: 8px 12px;
                border: 1px solid #e5e7eb;
            }
            
            .totals-table .label {
                background-color: #f9fafb;
                font-weight: 600;
                color: #374151;
            }
            
            .totals-table .amount {
                text-align: right;
                color: #1f2937;
            }
            
            .total-row {
                background-color: #1f2937;
                color: white;
                font-weight: bold;
                font-size: 16px;
            }
            
            .total-row .label {
                background-color: #1f2937;
                color: white;
            }
            
            .total-row .amount {
                color: white;
            }
            
            .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                color: #6b7280;
                font-size: 14px;
            }
            
            .footer p {
                margin: 5px 0;
            }
            
            .status-badge {
                display: inline-block;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: 600;
                text-transform: uppercase;
            }
            
            .status-unpaid {
                background-color: #fef3c7;
                color: #92400e;
            }
            
            .status-paid {
                background-color: #d1fae5;
                color: #065f46;
            }
            
            .status-partial {
                background-color: #dbeafe;
                color: #1e40af;
            }
            
            .status-overdue {
                background-color: #fee2e2;
                color: #991b1b;
            }
            
            .status-cancelled {
                background-color: #f3f4f6;
                color: #6b7280;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="company-info">
                    <h1>${companyInfo.name}</h1>
                    <p>${companyInfo.address}</p>
                    <p>Email: ${companyInfo.email}</p>
                    <p>Phone: ${companyInfo.phone}</p>
                    ${companyInfo.gstNumber ? `<p>GST: ${companyInfo.gstNumber}</p>` : ''}
                    ${companyInfo.panNumber ? `<p>PAN: ${companyInfo.panNumber}</p>` : ''}
                </div>
                <div class="document-info">
                    <div class="document-title">${documentTitle}</div>
                    <div class="document-number">${invoice.invoiceNumber}</div>
                    <div class="document-date">Date: ${new Date(invoice.invoiceDate).toLocaleDateString()}</div>
                    ${invoice.dueDate ? `<div class="document-date">Due: ${new Date(invoice.dueDate).toLocaleDateString()}</div>` : ''}
                    <div class="status-badge status-${invoice.status.toLowerCase()}">${invoice.status}</div>
                </div>
            </div>
            
            <div class="billing-section">
                <div class="billing-info">
                    <h3>Bill To:</h3>
                    <p><strong>${invoice.contact.name}</strong></p>
                    ${invoice.contact.email ? `<p>${invoice.contact.email}</p>` : ''}
                    ${invoice.contact.mobile ? `<p>${invoice.contact.mobile}</p>` : ''}
                    ${invoice.contact.address ? `<p>${JSON.stringify(invoice.contact.address)}</p>` : ''}
                </div>
            </div>
            
            <table class="items-table">
                <thead>
                    <tr>
                        <th style="width: 5%;">#</th>
                        <th style="width: 35%;">Description</th>
                        <th style="width: 10%;" class="text-center">Qty</th>
                        <th style="width: 15%;" class="text-right">Rate</th>
                        <th style="width: 15%;" class="text-right">Tax</th>
                        <th style="width: 10%;" class="text-right">Discount</th>
                        <th style="width: 15%;" class="text-right">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${invoice.items.map((item, index) => `
                        <tr>
                            <td class="text-center">${index + 1}</td>
                            <td>
                                <strong>${item.product.name}</strong>
                                ${item.product.sku ? `<br><small>SKU: ${item.product.sku}</small>` : ''}
                                ${item.product.hsnCode ? `<br><small>HSN: ${item.product.hsnCode}</small>` : ''}
                            </td>
                            <td class="text-center">${item.quantity}</td>
                            <td class="text-right">${formatCurrency(parseFloat(item.unitPrice), invoice.currency)}</td>
                            <td class="text-right">${formatCurrency(parseFloat(item.taxAmount || '0'), invoice.currency)}</td>
                            <td class="text-right">${formatCurrency(parseFloat(item.discountAmount || '0'), invoice.currency)}</td>
                            <td class="text-right">${formatCurrency(parseFloat(item.totalAmount), invoice.currency)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div class="totals-section">
                <table class="totals-table">
                    <tr>
                        <td class="label">Sub Total:</td>
                        <td class="amount">${formatCurrency(parseFloat(invoice.subTotal || '0'), invoice.currency)}</td>
                    </tr>
                    <tr>
                        <td class="label">Tax Amount:</td>
                        <td class="amount">${formatCurrency(parseFloat(invoice.taxAmount || '0'), invoice.currency)}</td>
                    </tr>
                    <tr>
                        <td class="label">Discount:</td>
                        <td class="amount">-${formatCurrency(parseFloat(invoice.discountAmount || '0'), invoice.currency)}</td>
                    </tr>
                    <tr class="total-row">
                        <td class="label">Total Amount:</td>
                        <td class="amount">${formatCurrency(parseFloat(invoice.totalAmount || '0'), invoice.currency)}</td>
                    </tr>
                    ${parseFloat(invoice.paidAmount || '0') > 0 ? `
                        <tr>
                            <td class="label">Paid Amount:</td>
                            <td class="amount">${formatCurrency(parseFloat(invoice.paidAmount || '0'), invoice.currency)}</td>
                        </tr>
                        <tr>
                            <td class="label">Balance Due:</td>
                            <td class="amount">${formatCurrency(parseFloat(invoice.balanceAmount || '0'), invoice.currency)}</td>
                        </tr>
                    ` : ''}
                </table>
            </div>
            
            ${invoice.terms || invoice.notes ? `
                <div class="footer">
                    ${invoice.terms ? `<p><strong>Terms & Conditions:</strong></p><p>${invoice.terms}</p>` : ''}
                    ${invoice.notes ? `<p><strong>Notes:</strong> ${invoice.notes}</p>` : ''}
                </div>
            ` : ''}
        </div>
    </body>
    </html>
  `;
}

export async function generateInvoicePDFBuffer(invoiceData: InvoiceData): Promise<Buffer> {
    return await generateInvoicePDF(invoiceData);
}
