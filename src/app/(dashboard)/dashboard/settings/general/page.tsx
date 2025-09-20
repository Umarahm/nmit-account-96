'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { DashboardPageLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Building, MapPin, Phone, Mail, Globe, Calendar, DollarSign, Clock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface CompanySettings {
    id?: number;
    companyName: string;
    email: string;
    phone: string;
    website: string;
    address: {
        line1: string;
        line2?: string;
        city: string;
        state: string;
        pincode: string;
        country: string;
    };
    taxInfo: {
        gstin?: string;
        pan?: string;
        cin?: string;
    };
    fiscalYearStart: string;
    baseCurrency: string;
    timezone: string;
    dateFormat: string;
    logo?: string;
}

const currencies = [
    { code: 'INR', name: 'Indian Rupee (₹)' },
    { code: 'USD', name: 'US Dollar ($)' },
    { code: 'EUR', name: 'Euro (€)' },
    { code: 'GBP', name: 'British Pound (£)' },
];

const timezones = [
    'Asia/Kolkata',
    'Asia/Dubai',
    'Asia/Singapore',
    'Europe/London',
    'America/New_York',
    'America/Los_Angeles',
];

const dateFormats = [
    'DD/MM/YYYY',
    'MM/DD/YYYY',
    'YYYY-MM-DD',
    'DD-MM-YYYY',
];

export default function GeneralSettingsPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [settings, setSettings] = useState<CompanySettings>({
        companyName: '',
        email: '',
        phone: '',
        website: '',
        address: {
            line1: '',
            line2: '',
            city: '',
            state: '',
            pincode: '',
            country: 'India',
        },
        taxInfo: {
            gstin: '',
            pan: '',
            cin: '',
        },
        fiscalYearStart: '04-01',
        baseCurrency: 'INR',
        timezone: 'Asia/Kolkata',
        dateFormat: 'DD/MM/YYYY',
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/settings/company');
            if (response.ok) {
                const data = await response.json();
                if (data.settings) {
                    setSettings(data.settings);
                }
            }
        } catch (err) {
            console.error('Error fetching settings:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setError(null);
            setSuccess(null);

            const response = await fetch('/api/settings/company', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(settings),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save settings');
            }

            setSuccess('Settings saved successfully!');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setSaving(false);
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setSettings(prev => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleAddressChange = (field: string, value: string) => {
        setSettings(prev => ({
            ...prev,
            address: {
                ...prev.address,
                [field]: value,
            },
        }));
    };

    const handleTaxInfoChange = (field: string, value: string) => {
        setSettings(prev => ({
            ...prev,
            taxInfo: {
                ...prev.taxInfo,
                [field]: value,
            },
        }));
    };

    if (loading) {
        return (
            <DashboardPageLayout
                title="General Settings"
                description="Configure company information and preferences"
            >
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p>Loading settings...</p>
                    </div>
                </div>
            </DashboardPageLayout>
        );
    }

    return (
        <DashboardPageLayout
            title="General Settings"
            description="Configure company information and preferences"
            actions={
                <Button variant="outline" asChild>
                    <Link href="/dashboard/settings">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Settings
                    </Link>
                </Button>
            }
        >
            <div className="space-y-6">
                {/* Company Information */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center space-x-2">
                            <Building className="h-5 w-5" />
                            <CardTitle>Company Information</CardTitle>
                        </div>
                        <CardDescription>
                            Basic company details and contact information
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="companyName">Company Name *</Label>
                                <Input
                                    id="companyName"
                                    value={settings.companyName}
                                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                                    placeholder="Enter company name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={settings.email}
                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                    placeholder="company@example.com"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                    id="phone"
                                    value={settings.phone}
                                    onChange={(e) => handleInputChange('phone', e.target.value)}
                                    placeholder="+91-XXXXXXXXXX"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="website">Website</Label>
                                <Input
                                    id="website"
                                    value={settings.website}
                                    onChange={(e) => handleInputChange('website', e.target.value)}
                                    placeholder="https://www.example.com"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Address Information */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center space-x-2">
                            <MapPin className="h-5 w-5" />
                            <CardTitle>Address Information</CardTitle>
                        </div>
                        <CardDescription>
                            Company address and location details
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="addressLine1">Address Line 1</Label>
                            <Input
                                id="addressLine1"
                                value={settings.address.line1}
                                onChange={(e) => handleAddressChange('line1', e.target.value)}
                                placeholder="Street address"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="addressLine2">Address Line 2</Label>
                            <Input
                                id="addressLine2"
                                value={settings.address.line2 || ''}
                                onChange={(e) => handleAddressChange('line2', e.target.value)}
                                placeholder="Apartment, suite, etc. (optional)"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="city">City</Label>
                                <Input
                                    id="city"
                                    value={settings.address.city}
                                    onChange={(e) => handleAddressChange('city', e.target.value)}
                                    placeholder="City"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="state">State</Label>
                                <Input
                                    id="state"
                                    value={settings.address.state}
                                    onChange={(e) => handleAddressChange('state', e.target.value)}
                                    placeholder="State"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pincode">PIN Code</Label>
                                <Input
                                    id="pincode"
                                    value={settings.address.pincode}
                                    onChange={(e) => handleAddressChange('pincode', e.target.value)}
                                    placeholder="PIN Code"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="country">Country</Label>
                            <Input
                                id="country"
                                value={settings.address.country}
                                onChange={(e) => handleAddressChange('country', e.target.value)}
                                placeholder="Country"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Tax Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>Tax Information</CardTitle>
                        <CardDescription>
                            Tax registration numbers and compliance details
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="gstin">GSTIN</Label>
                                <Input
                                    id="gstin"
                                    value={settings.taxInfo.gstin || ''}
                                    onChange={(e) => handleTaxInfoChange('gstin', e.target.value)}
                                    placeholder="GST Number"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pan">PAN</Label>
                                <Input
                                    id="pan"
                                    value={settings.taxInfo.pan || ''}
                                    onChange={(e) => handleTaxInfoChange('pan', e.target.value)}
                                    placeholder="PAN Number"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cin">CIN</Label>
                                <Input
                                    id="cin"
                                    value={settings.taxInfo.cin || ''}
                                    onChange={(e) => handleTaxInfoChange('cin', e.target.value)}
                                    placeholder="CIN Number"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Preferences */}
                <Card>
                    <CardHeader>
                        <CardTitle>Preferences</CardTitle>
                        <CardDescription>
                            Configure application preferences and defaults
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="fiscalYearStart">Fiscal Year Start</Label>
                                <Select
                                    value={settings.fiscalYearStart}
                                    onValueChange={(value) => handleInputChange('fiscalYearStart', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="01-01">January 1</SelectItem>
                                        <SelectItem value="04-01">April 1</SelectItem>
                                        <SelectItem value="07-01">July 1</SelectItem>
                                        <SelectItem value="10-01">October 1</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="baseCurrency">Base Currency</Label>
                                <Select
                                    value={settings.baseCurrency}
                                    onValueChange={(value) => handleInputChange('baseCurrency', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {currencies.map((currency) => (
                                            <SelectItem key={currency.code} value={currency.code}>
                                                {currency.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="timezone">Timezone</Label>
                                <Select
                                    value={settings.timezone}
                                    onValueChange={(value) => handleInputChange('timezone', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {timezones.map((tz) => (
                                            <SelectItem key={tz} value={tz}>
                                                {tz}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="dateFormat">Date Format</Label>
                                <Select
                                    value={settings.dateFormat}
                                    onValueChange={(value) => handleInputChange('dateFormat', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {dateFormats.map((format) => (
                                            <SelectItem key={format} value={format}>
                                                {format}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Status Messages */}
                {error && (
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-red-600 bg-red-50 p-3 rounded-lg">
                                {error}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {success && (
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-green-600 bg-green-50 p-3 rounded-lg">
                                {success}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Save Button */}
                <div className="flex justify-end">
                    <Button onClick={handleSave} disabled={saving || !settings.companyName}>
                        {saving ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                Save Settings
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </DashboardPageLayout>
    );
}