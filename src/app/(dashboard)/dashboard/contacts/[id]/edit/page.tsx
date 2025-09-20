"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save, X } from "lucide-react";
import Link from "next/link";
import { Contact, UpdateContactRequest, Address, TaxInfo, ContactProfile } from "@/types/contacts";

export default function EditContactPage() {
    const params = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [contact, setContact] = useState<Contact | null>(null);
    const [formData, setFormData] = useState<UpdateContactRequest>({
        id: 0,
        type: 'CUSTOMER',
        name: '',
        displayName: '',
        email: '',
        mobile: '',
        phone: '',
        website: '',
        address: {
            street: '',
            city: '',
            state: '',
            country: 'India',
            postalCode: '',
            landmark: ''
        },
        billingAddress: {
            street: '',
            city: '',
            state: '',
            country: 'India',
            postalCode: '',
            landmark: ''
        },
        shippingAddress: {
            street: '',
            city: '',
            state: '',
            country: 'India',
            postalCode: '',
            landmark: ''
        },
        taxInfo: {
            gstNumber: '',
            panNumber: '',
            taxExempt: false,
            taxExemptionReason: ''
        },
        profile: {
            industry: '',
            companySize: '',
            preferredLanguage: 'English',
            timezone: 'Asia/Kolkata'
        },
        creditLimit: 0,
        paymentTerms: 30,
        currency: 'INR',
        notes: ''
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const fetchContact = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/contacts/${params.id}`);
            if (!response.ok) {
                throw new Error('Failed to fetch contact');
            }

            const data = await response.json();
            const contactData = data.contact;
            setContact(contactData);

            // Populate form with existing data
            setFormData({
                id: contactData.id,
                type: contactData.type,
                name: contactData.name,
                displayName: contactData.displayName || '',
                email: contactData.email || '',
                mobile: contactData.mobile || '',
                phone: contactData.phone || '',
                website: contactData.website || '',
                address: contactData.address || {
                    street: '',
                    city: '',
                    state: '',
                    country: 'India',
                    postalCode: '',
                    landmark: ''
                },
                billingAddress: contactData.billingAddress || {
                    street: '',
                    city: '',
                    state: '',
                    country: 'India',
                    postalCode: '',
                    landmark: ''
                },
                shippingAddress: contactData.shippingAddress || {
                    street: '',
                    city: '',
                    state: '',
                    country: 'India',
                    postalCode: '',
                    landmark: ''
                },
                taxInfo: contactData.taxInfo || {
                    gstNumber: '',
                    panNumber: '',
                    taxExempt: false,
                    taxExemptionReason: ''
                },
                profile: contactData.profile || {
                    industry: '',
                    companySize: '',
                    preferredLanguage: 'English',
                    timezone: 'Asia/Kolkata'
                },
                creditLimit: contactData.creditLimit || 0,
                paymentTerms: contactData.paymentTerms || 30,
                currency: contactData.currency || 'INR',
                notes: contactData.notes || ''
            });
        } catch (error) {
            console.error('Error fetching contact:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (params.id) {
            fetchContact();
        }
    }, [params.id]);

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        }

        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (formData.mobile && !/^[0-9]{10}$/.test(formData.mobile)) {
            newErrors.mobile = 'Please enter a valid 10-digit mobile number';
        }

        if (formData.creditLimit && formData.creditLimit < 0) {
            newErrors.creditLimit = 'Credit limit cannot be negative';
        }

        if (formData.paymentTerms && formData.paymentTerms < 0) {
            newErrors.paymentTerms = 'Payment terms cannot be negative';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            setSaving(true);
            const response = await fetch(`/api/contacts/${formData.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update contact');
            }

            router.push(`/dashboard/contacts/${formData.id}`);
        } catch (error) {
            console.error('Error updating contact:', error);
            setErrors({ submit: error instanceof Error ? error.message : 'Failed to update contact' });
        } finally {
            setSaving(false);
        }
    };

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    const handleAddressChange = (addressType: 'address' | 'billingAddress' | 'shippingAddress', field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [addressType]: {
                ...prev[addressType],
                [field]: value
            }
        }));
    };

    const handleTaxInfoChange = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            taxInfo: {
                ...prev.taxInfo,
                [field]: value
            }
        }));
    };

    const handleProfileChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            profile: {
                ...prev.profile,
                [field]: value
            }
        }));
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" disabled>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                    <div>
                        <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                    </div>
                </div>
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <Card key={i} className="animate-pulse">
                            <CardContent className="p-6">
                                <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                                <div className="space-y-2">
                                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    if (!contact) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/contacts">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold">Contact Not Found</h1>
                        <p className="text-muted-foreground">
                            The contact you're trying to edit doesn't exist or has been deleted.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href={`/dashboard/contacts/${contact.id}`}>
                    <Button variant="outline" size="sm">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold">Edit Contact</h1>
                    <p className="text-muted-foreground">
                        Update contact information for {contact.displayName || contact.name}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="basic">Basic Info</TabsTrigger>
                        <TabsTrigger value="address">Address</TabsTrigger>
                        <TabsTrigger value="business">Business</TabsTrigger>
                        <TabsTrigger value="additional">Additional</TabsTrigger>
                    </TabsList>

                    {/* Basic Information */}
                    <TabsContent value="basic" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Basic Information</CardTitle>
                                <CardDescription>
                                    Update the basic contact details
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="type">Contact Type *</Label>
                                        <Select
                                            value={formData.type}
                                            onValueChange={(value) => handleInputChange('type', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="CUSTOMER">Customer</SelectItem>
                                                <SelectItem value="VENDOR">Vendor</SelectItem>
                                                <SelectItem value="BOTH">Both</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="name">Name *</Label>
                                        <Input
                                            id="name"
                                            value={formData.name}
                                            onChange={(e) => handleInputChange('name', e.target.value)}
                                            placeholder="Enter contact name"
                                        />
                                        {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                                    </div>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="displayName">Display Name</Label>
                                        <Input
                                            id="displayName"
                                            value={formData.displayName}
                                            onChange={(e) => handleInputChange('displayName', e.target.value)}
                                            placeholder="Enter display name"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => handleInputChange('email', e.target.value)}
                                            placeholder="Enter email address"
                                        />
                                        {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                                    </div>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="mobile">Mobile</Label>
                                        <Input
                                            id="mobile"
                                            value={formData.mobile}
                                            onChange={(e) => handleInputChange('mobile', e.target.value)}
                                            placeholder="Enter mobile number"
                                        />
                                        {errors.mobile && <p className="text-sm text-destructive">{errors.mobile}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone</Label>
                                        <Input
                                            id="phone"
                                            value={formData.phone}
                                            onChange={(e) => handleInputChange('phone', e.target.value)}
                                            placeholder="Enter phone number"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="website">Website</Label>
                                    <Input
                                        id="website"
                                        value={formData.website}
                                        onChange={(e) => handleInputChange('website', e.target.value)}
                                        placeholder="Enter website URL"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Address Information */}
                    <TabsContent value="address" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Address Information</CardTitle>
                                <CardDescription>
                                    Update address details for billing and shipping
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Primary Address */}
                                <div className="space-y-4">
                                    <h4 className="text-lg font-medium">Primary Address</h4>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="street">Street Address</Label>
                                            <Input
                                                id="street"
                                                value={formData.address?.street || ''}
                                                onChange={(e) => handleAddressChange('address', 'street', e.target.value)}
                                                placeholder="Enter street address"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="city">City</Label>
                                            <Input
                                                id="city"
                                                value={formData.address?.city || ''}
                                                onChange={(e) => handleAddressChange('address', 'city', e.target.value)}
                                                placeholder="Enter city"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid gap-4 md:grid-cols-3">
                                        <div className="space-y-2">
                                            <Label htmlFor="state">State</Label>
                                            <Input
                                                id="state"
                                                value={formData.address?.state || ''}
                                                onChange={(e) => handleAddressChange('address', 'state', e.target.value)}
                                                placeholder="Enter state"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="country">Country</Label>
                                            <Input
                                                id="country"
                                                value={formData.address?.country || ''}
                                                onChange={(e) => handleAddressChange('address', 'country', e.target.value)}
                                                placeholder="Enter country"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="postalCode">Postal Code</Label>
                                            <Input
                                                id="postalCode"
                                                value={formData.address?.postalCode || ''}
                                                onChange={(e) => handleAddressChange('address', 'postalCode', e.target.value)}
                                                placeholder="Enter postal code"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="landmark">Landmark</Label>
                                        <Input
                                            id="landmark"
                                            value={formData.address?.landmark || ''}
                                            onChange={(e) => handleAddressChange('address', 'landmark', e.target.value)}
                                            placeholder="Enter landmark"
                                        />
                                    </div>
                                </div>

                                {/* Billing Address */}
                                <div className="space-y-4">
                                    <h4 className="text-lg font-medium">Billing Address</h4>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="billingStreet">Street Address</Label>
                                            <Input
                                                id="billingStreet"
                                                value={formData.billingAddress?.street || ''}
                                                onChange={(e) => handleAddressChange('billingAddress', 'street', e.target.value)}
                                                placeholder="Enter billing street address"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="billingCity">City</Label>
                                            <Input
                                                id="billingCity"
                                                value={formData.billingAddress?.city || ''}
                                                onChange={(e) => handleAddressChange('billingAddress', 'city', e.target.value)}
                                                placeholder="Enter billing city"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid gap-4 md:grid-cols-3">
                                        <div className="space-y-2">
                                            <Label htmlFor="billingState">State</Label>
                                            <Input
                                                id="billingState"
                                                value={formData.billingAddress?.state || ''}
                                                onChange={(e) => handleAddressChange('billingAddress', 'state', e.target.value)}
                                                placeholder="Enter billing state"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="billingCountry">Country</Label>
                                            <Input
                                                id="billingCountry"
                                                value={formData.billingAddress?.country || ''}
                                                onChange={(e) => handleAddressChange('billingAddress', 'country', e.target.value)}
                                                placeholder="Enter billing country"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="billingPostalCode">Postal Code</Label>
                                            <Input
                                                id="billingPostalCode"
                                                value={formData.billingAddress?.postalCode || ''}
                                                onChange={(e) => handleAddressChange('billingAddress', 'postalCode', e.target.value)}
                                                placeholder="Enter billing postal code"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Business Information */}
                    <TabsContent value="business" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Business Information</CardTitle>
                                <CardDescription>
                                    Update business and financial details
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="creditLimit">Credit Limit</Label>
                                        <Input
                                            id="creditLimit"
                                            type="number"
                                            value={formData.creditLimit}
                                            onChange={(e) => handleInputChange('creditLimit', parseFloat(e.target.value) || 0)}
                                            placeholder="Enter credit limit"
                                        />
                                        {errors.creditLimit && <p className="text-sm text-destructive">{errors.creditLimit}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="paymentTerms">Payment Terms (Days)</Label>
                                        <Input
                                            id="paymentTerms"
                                            type="number"
                                            value={formData.paymentTerms}
                                            onChange={(e) => handleInputChange('paymentTerms', parseInt(e.target.value) || 0)}
                                            placeholder="Enter payment terms"
                                        />
                                        {errors.paymentTerms && <p className="text-sm text-destructive">{errors.paymentTerms}</p>}
                                    </div>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="currency">Currency</Label>
                                        <Select
                                            value={formData.currency}
                                            onValueChange={(value) => handleInputChange('currency', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select currency" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                                                <SelectItem value="USD">USD - US Dollar</SelectItem>
                                                <SelectItem value="EUR">EUR - Euro</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="industry">Industry</Label>
                                        <Input
                                            id="industry"
                                            value={formData.profile?.industry || ''}
                                            onChange={(e) => handleProfileChange('industry', e.target.value)}
                                            placeholder="Enter industry"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="companySize">Company Size</Label>
                                    <Select
                                        value={formData.profile?.companySize || ''}
                                        onValueChange={(value) => handleProfileChange('companySize', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select company size" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1-10">1-10 employees</SelectItem>
                                            <SelectItem value="11-50">11-50 employees</SelectItem>
                                            <SelectItem value="51-200">51-200 employees</SelectItem>
                                            <SelectItem value="201-500">201-500 employees</SelectItem>
                                            <SelectItem value="500+">500+ employees</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Tax Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Tax Information</CardTitle>
                                <CardDescription>
                                    Update tax-related details for compliance
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="gstNumber">GST Number</Label>
                                        <Input
                                            id="gstNumber"
                                            value={formData.taxInfo?.gstNumber || ''}
                                            onChange={(e) => handleTaxInfoChange('gstNumber', e.target.value)}
                                            placeholder="Enter GST number"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="panNumber">PAN Number</Label>
                                        <Input
                                            id="panNumber"
                                            value={formData.taxInfo?.panNumber || ''}
                                            onChange={(e) => handleTaxInfoChange('panNumber', e.target.value)}
                                            placeholder="Enter PAN number"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Additional Information */}
                    <TabsContent value="additional" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Additional Information</CardTitle>
                                <CardDescription>
                                    Update additional details and notes
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="notes">Notes</Label>
                                    <Textarea
                                        id="notes"
                                        value={formData.notes}
                                        onChange={(e) => handleInputChange('notes', e.target.value)}
                                        placeholder="Enter any additional notes about this contact"
                                        rows={4}
                                    />
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="preferredLanguage">Preferred Language</Label>
                                        <Select
                                            value={formData.profile?.preferredLanguage || 'English'}
                                            onValueChange={(value) => handleProfileChange('preferredLanguage', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select language" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="English">English</SelectItem>
                                                <SelectItem value="Hindi">Hindi</SelectItem>
                                                <SelectItem value="Gujarati">Gujarati</SelectItem>
                                                <SelectItem value="Marathi">Marathi</SelectItem>
                                                <SelectItem value="Tamil">Tamil</SelectItem>
                                                <SelectItem value="Telugu">Telugu</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="timezone">Timezone</Label>
                                        <Select
                                            value={formData.profile?.timezone || 'Asia/Kolkata'}
                                            onValueChange={(value) => handleProfileChange('timezone', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select timezone" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                                                <SelectItem value="Asia/Dubai">Asia/Dubai (GST)</SelectItem>
                                                <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                                                <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Submit Buttons */}
                <div className="flex items-center gap-4">
                    <Button type="submit" disabled={saving}>
                        {saving ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Updating...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                Update Contact
                            </>
                        )}
                    </Button>
                    <Link href={`/dashboard/contacts/${contact.id}`}>
                        <Button type="button" variant="outline">
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                        </Button>
                    </Link>
                </div>

                {errors.submit && (
                    <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                        {errors.submit}
                    </div>
                )}
            </form>
        </div>
    );
}
