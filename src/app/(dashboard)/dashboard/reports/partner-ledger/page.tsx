"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DashboardPageLayout } from "@/components/layout";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    Users,
    Download,
    Calendar,
    Search,
    FileText,
    CreditCard,
    Receipt,
    TrendingUp,
    TrendingDown
} from "lucide-react";

interface PartnerLedgerData {
    partner: {
        id: number;
        name: string;
        type: string;
        email?: string;
        mobile?: string;
    };
    summary: {
        openingBalance: number;
        totalDebit: number;
        totalCredit: number;
        closingBalance: number;
        transactionCount: number;
    };
    transactions: Array<{
        id: string;
        date: string;
        description: string;
        type: string;
        debit: number;
        credit: number;
        balance: number;
        debitFormatted: string;
        creditFormatted: string;
        balanceFormatted: string;
        status?: string;
        paymentMethod?: string;
    }>;
    formatted: {
        openingBalance: string;
        totalDebit: string;
        totalCredit: string;
        closingBalance: string;
    };
}

interface Contact {
    id: number;
    name: string;
    type: string;
    email?: string;
}

export default function PartnerLedgerPage() {
    const [selectedPartner, setSelectedPartner] = useState<string>("");
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");
    const [partners, setPartners] = useState<Contact[]>([]);
    const [ledgerData, setLedgerData] = useState<PartnerLedgerData | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingPartners, setLoadingPartners] = useState(true);

    useEffect(() => {
        // Fetch partners
        const fetchPartners = async () => {
            try {
                setLoadingPartners(true);
                const response = await fetch('/api/contacts');
                if (response.ok) {
                    const data = await response.json();
                    setPartners(data.contacts || []);
                }
            } catch (error) {
                console.error('Error fetching partners:', error);
            } finally {
                setLoadingPartners(false);
            }
        };

        fetchPartners();
    }, []);

    const fetchLedgerData = async () => {
        if (!selectedPartner) return;

        try {
            setLoading(true);
            const params = new URLSearchParams({
                partnerId: selectedPartner
            });

            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);

            const response = await fetch(`/api/reports/partner-ledger?${params}`);
            if (response.ok) {
                const data = await response.json();
                setLedgerData(data);
            }
        } catch (error) {
            console.error('Error fetching ledger data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateReport = () => {
        fetchLedgerData();
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN');
    };

    const getTransactionIcon = (type: string) => {
        switch (type) {
            case 'INVOICE':
                return <FileText className="h-4 w-4" />;
            case 'PAYMENT':
                return <CreditCard className="h-4 w-4" />;
            default:
                return <Receipt className="h-4 w-4" />;
        }
    };

    const getStatusBadge = (status?: string) => {
        if (!status) return null;

        const statusColors = {
            PAID: 'bg-green-100 text-green-800',
            UNPAID: 'bg-red-100 text-red-800',
            PARTIAL: 'bg-yellow-100 text-yellow-800',
            OVERDUE: 'bg-red-100 text-red-800'
        };

        return (
            <Badge className={statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
                {status}
            </Badge>
        );
    };

    return (
        <DashboardPageLayout
            title="Partner Ledger"
            description="Detailed transaction history and balances for business partners"
            actions={
                <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export PDF
                    </Button>
                </div>
            }
        >
            {/* Partner Selection and Date Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Generate Partner Ledger
                    </CardTitle>
                    <CardDescription>
                        Select a partner and date range to generate their ledger report
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="partner">Select Partner</Label>
                            <Select value={selectedPartner} onValueChange={setSelectedPartner}>
                                <SelectTrigger>
                                    <SelectValue placeholder={loadingPartners ? "Loading..." : "Choose partner"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {partners.map((partner) => (
                                        <SelectItem key={partner.id} value={partner.id.toString()}>
                                            {partner.name} ({partner.type})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="startDate">Start Date</Label>
                            <Input
                                id="startDate"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="endDate">End Date</Label>
                            <Input
                                id="endDate"
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>

                        <div className="flex items-end">
                            <Button
                                onClick={handleGenerateReport}
                                disabled={!selectedPartner || loading}
                                className="w-full"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Search className="h-4 w-4 mr-2" />
                                        Generate Report
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Partner Information and Summary */}
            {ledgerData && (
                <>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Partner Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <h4 className="font-semibold text-sm text-muted-foreground">Name</h4>
                                    <p className="text-lg font-medium">{ledgerData.partner.name}</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-sm text-muted-foreground">Type</h4>
                                    <Badge variant="outline">{ledgerData.partner.type}</Badge>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-sm text-muted-foreground">Contact</h4>
                                    <p className="text-sm">
                                        {ledgerData.partner.email && <span>{ledgerData.partner.email}</span>}
                                        {ledgerData.partner.mobile && <span className="ml-2">• {ledgerData.partner.mobile}</span>}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Opening Balance</p>
                                        <p className="text-2xl font-bold">{ledgerData.formatted.openingBalance}</p>
                                    </div>
                                    <Receipt className="h-8 w-8 text-muted-foreground" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Debit</p>
                                        <p className="text-2xl font-bold text-red-600">{ledgerData.formatted.totalDebit}</p>
                                    </div>
                                    <TrendingDown className="h-8 w-8 text-red-600" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Credit</p>
                                        <p className="text-2xl font-bold text-green-600">{ledgerData.formatted.totalCredit}</p>
                                    </div>
                                    <TrendingUp className="h-8 w-8 text-green-600" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Closing Balance</p>
                                        <p className="text-2xl font-bold">{ledgerData.formatted.closingBalance}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {ledgerData.summary.closingBalance >= 0 ? 'You are owed' : 'You owe'}
                                        </p>
                                    </div>
                                    {ledgerData.summary.closingBalance >= 0 ? (
                                        <TrendingUp className="h-8 w-8 text-green-600" />
                                    ) : (
                                        <TrendingDown className="h-8 w-8 text-red-600" />
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Transaction Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Transaction Details</CardTitle>
                            <CardDescription>
                                Complete transaction history with running balance
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {ledgerData.transactions.length === 0 ? (
                                <div className="text-center py-8">
                                    <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-muted-foreground">No transactions found for this partner</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-12"></TableHead>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Description</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead className="text-right">Debit</TableHead>
                                                <TableHead className="text-right">Credit</TableHead>
                                                <TableHead className="text-right">Balance</TableHead>
                                                <TableHead>Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {ledgerData.transactions.map((transaction) => (
                                                <TableRow key={transaction.id}>
                                                    <TableCell>
                                                        {getTransactionIcon(transaction.type)}
                                                    </TableCell>
                                                    <TableCell className="font-medium">
                                                        {formatDate(transaction.date)}
                                                    </TableCell>
                                                    <TableCell>{transaction.description}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">{transaction.type}</Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right text-red-600 font-medium">
                                                        {transaction.debit > 0 ? transaction.debitFormatted : '-'}
                                                    </TableCell>
                                                    <TableCell className="text-right text-green-600 font-medium">
                                                        {transaction.credit > 0 ? transaction.creditFormatted : '-'}
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold">
                                                        {transaction.balanceFormatted}
                                                    </TableCell>
                                                    <TableCell>
                                                        {getStatusBadge(transaction.status)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </>
            )}

            {!ledgerData && !loading && (
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center py-12">
                            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium mb-2">Select a Partner</h3>
                            <p className="text-muted-foreground">
                                Choose a partner from the dropdown above and click "Generate Report" to view their ledger.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </DashboardPageLayout>
    );
}

