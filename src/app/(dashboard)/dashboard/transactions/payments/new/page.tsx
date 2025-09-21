"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Invoice {
    id: number;
    invoiceNumber: string;
    contactName: string;
    totalAmount: string;
    balanceAmount: string;
    status: string;
}

export default function NewPaymentPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

    const [formData, setFormData] = useState({
        invoiceId: "",
        paymentDate: new Date().toISOString().split("T")[0],
        amount: "",
        paymentMethod: "CASH",
        reference: "",
        notes: "",
    });

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        try {
            const response = await fetch("/api/invoices");
            const data = await response.json();

            if (response.ok) {
                // Filter only unpaid or partial invoices
                const unpaidInvoices = data.invoices.filter(
                    (invoice: Invoice) =>
                        invoice.status === "UNPAID" ||
                        invoice.status === "PARTIAL" ||
                        parseFloat(invoice.balanceAmount) > 0
                );
                setInvoices(unpaidInvoices);
            } else {
                console.error("Error fetching invoices:", data.error);
            }
        } catch (error) {
            console.error("Error fetching invoices:", error);
        }
    };

    const handleInvoiceChange = (invoiceId: string) => {
        const invoice = invoices.find((inv) => inv.id.toString() === invoiceId);
        setSelectedInvoice(invoice || null);
        setFormData({
            ...formData,
            invoiceId,
            amount: invoice ? invoice.balanceAmount : "",
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch("/api/payments", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                const data = await response.json();
                router.push("/dashboard/transactions/payments");
            } else {
                console.error("Error creating payment");
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: string) => {
        return `₹${parseFloat(amount).toFixed(2)}`;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" asChild>
                    <Link href="/dashboard/transactions/payments">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Payments
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold">New Payment</h1>
                    <p className="text-muted-foreground">Record a new payment for an invoice</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Payment Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="invoice">Invoice *</Label>
                                <Select value={formData.invoiceId} onValueChange={handleInvoiceChange}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select invoice" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {invoices.map((invoice) => (
                                            <SelectItem key={invoice.id} value={invoice.id.toString()}>
                                                {invoice.invoiceNumber} - {invoice.contactName} ({formatCurrency(
                                                    invoice.balanceAmount
                                                )})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="paymentDate">Payment Date *</Label>
                                <Input
                                    id="paymentDate"
                                    type="date"
                                    value={formData.paymentDate}
                                    onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="amount">Amount *</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    placeholder="Enter payment amount"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="paymentMethod">Payment Method *</Label>
                                <Select
                                    value={formData.paymentMethod}
                                    onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="CASH">Cash</SelectItem>
                                        <SelectItem value="BANK">Bank Transfer</SelectItem>
                                        <SelectItem value="CHEQUE">Cheque</SelectItem>
                                        <SelectItem value="CARD">Card</SelectItem>
                                        <SelectItem value="DIGITAL">Digital Wallet</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="reference">Reference</Label>
                                <Input
                                    id="reference"
                                    value={formData.reference}
                                    onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                                    placeholder="Cheque number, transaction ID, etc."
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea
                                id="notes"
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Additional notes..."
                                rows={3}
                            />
                        </div>
                    </CardContent>
                </Card>

                {selectedInvoice && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Invoice Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Invoice</p>
                                    <p className="font-medium">{selectedInvoice.invoiceNumber}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Customer</p>
                                    <p className="font-medium">{selectedInvoice.contactName}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Outstanding Balance</p>
                                    <p className="font-medium">{formatCurrency(selectedInvoice.balanceAmount)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="flex justify-end space-x-4">
                    <Button type="button" variant="outline" asChild>
                        <Link href="/dashboard/transactions/payments">Cancel</Link>
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading ? "Creating..." : "Create Payment"}
                    </Button>
                </div>
            </form>
        </div>
    );
}

