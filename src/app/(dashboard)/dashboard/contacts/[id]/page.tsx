"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Edit, Trash2, Mail, Phone, MapPin, Globe, Building2, Users, DollarSign, Calendar, FileText } from "lucide-react";
import Link from "next/link";
import { Contact } from "@/types/contacts";

export default function ContactDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [contact, setContact] = useState<Contact | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchContact = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/contacts/${params.id}`);
            if (!response.ok) {
                throw new Error('Failed to fetch contact');
            }

            const data = await response.json();
            setContact(data.contact);
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

    const handleDelete = async () => {
        if (!contact) return;

        if (!confirm('Are you sure you want to delete this contact? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`/api/contacts/${contact.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete contact');
            }

            router.push('/dashboard/contacts');
        } catch (error) {
            console.error('Error deleting contact:', error);
        }
    };

    const getContactTypeIcon = (type: string) => {
        switch (type) {
            case 'CUSTOMER':
                return <Users className="h-5 w-5 text-blue-600" />;
            case 'VENDOR':
                return <Building2 className="h-5 w-5 text-green-600" />;
            case 'BOTH':
                return <div className="flex gap-1"><Users className="h-4 w-4 text-blue-600" /><Building2 className="h-4 w-4 text-green-600" /></div>;
            default:
                return <Users className="h-5 w-5" />;
        }
    };

    const getContactTypeBadge = (type: string) => {
        switch (type) {
            case 'CUSTOMER':
                return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Customer</Badge>;
            case 'VENDOR':
                return <Badge variant="secondary" className="bg-green-100 text-green-800">Vendor</Badge>;
            case 'BOTH':
                return <Badge variant="secondary" className="bg-purple-100 text-purple-800">Both</Badge>;
            default:
                return <Badge variant="secondary">Unknown</Badge>;
        }
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
                <div className="grid gap-6 md:grid-cols-2">
                    {[...Array(4)].map((_, i) => (
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
                            The contact you're looking for doesn't exist or has been deleted.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/contacts">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            {getContactTypeIcon(contact.type)}
                            <h1 className="text-3xl font-bold">
                                {contact.displayName || contact.name}
                            </h1>
                            {getContactTypeBadge(contact.type)}
                        </div>
                        <p className="text-muted-foreground">
                            Contact Details
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Link href={`/dashboard/contacts/${contact.id}/edit`}>
                        <Button variant="outline">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                        </Button>
                    </Link>
                    <Button variant="outline" onClick={handleDelete} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="address">Address</TabsTrigger>
                    <TabsTrigger value="business">Business</TabsTrigger>
                    <TabsTrigger value="additional">Additional</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Contact Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Contact Information</CardTitle>
                                <CardDescription>
                                    Basic contact details
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-3">
                                    {contact.email && (
                                        <div className="flex items-center gap-3">
                                            <Mail className="h-4 w-4 text-muted-foreground" />
                                            <div>
                                                <p className="text-sm font-medium">Email</p>
                                                <p className="text-sm text-muted-foreground">{contact.email}</p>
                                            </div>
                                        </div>
                                    )}

                                    {contact.mobile && (
                                        <div className="flex items-center gap-3">
                                            <Phone className="h-4 w-4 text-muted-foreground" />
                                            <div>
                                                <p className="text-sm font-medium">Mobile</p>
                                                <p className="text-sm text-muted-foreground">{contact.mobile}</p>
                                            </div>
                                        </div>
                                    )}

                                    {contact.phone && (
                                        <div className="flex items-center gap-3">
                                            <Phone className="h-4 w-4 text-muted-foreground" />
                                            <div>
                                                <p className="text-sm font-medium">Phone</p>
                                                <p className="text-sm text-muted-foreground">{contact.phone}</p>
                                            </div>
                                        </div>
                                    )}

                                    {contact.website && (
                                        <div className="flex items-center gap-3">
                                            <Globe className="h-4 w-4 text-muted-foreground" />
                                            <div>
                                                <p className="text-sm font-medium">Website</p>
                                                <a
                                                    href={contact.website.startsWith('http') ? contact.website : `https://${contact.website}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sm text-blue-600 hover:underline"
                                                >
                                                    {contact.website}
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Business Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Business Information</CardTitle>
                                <CardDescription>
                                    Financial and business details
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-3">
                                    {contact.creditLimit && (
                                        <div className="flex items-center gap-3">
                                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                                            <div>
                                                <p className="text-sm font-medium">Credit Limit</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {contact.currency} {contact.creditLimit.toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {contact.paymentTerms && (
                                        <div className="flex items-center gap-3">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <div>
                                                <p className="text-sm font-medium">Payment Terms</p>
                                                <p className="text-sm text-muted-foreground">{contact.paymentTerms} days</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-3">
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm font-medium">Currency</p>
                                            <p className="text-sm text-muted-foreground">{contact.currency}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Notes */}
                    {contact.notes && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Notes</CardTitle>
                                <CardDescription>
                                    Additional information about this contact
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm whitespace-pre-wrap">{contact.notes}</p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* Address Tab */}
                <TabsContent value="address" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Primary Address */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Primary Address</CardTitle>
                                <CardDescription>
                                    Main contact address
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {contact.address ? (
                                    <div className="space-y-2">
                                        {contact.address.street && <p className="text-sm">{contact.address.street}</p>}
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            {contact.address.city && <span>{contact.address.city}</span>}
                                            {contact.address.state && <span>, {contact.address.state}</span>}
                                            {contact.address.postalCode && <span> - {contact.address.postalCode}</span>}
                                        </div>
                                        {contact.address.country && <p className="text-sm text-muted-foreground">{contact.address.country}</p>}
                                        {contact.address.landmark && <p className="text-sm text-muted-foreground">Landmark: {contact.address.landmark}</p>}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No address provided</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Billing Address */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Billing Address</CardTitle>
                                <CardDescription>
                                    Address for billing purposes
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {contact.billingAddress ? (
                                    <div className="space-y-2">
                                        {contact.billingAddress.street && <p className="text-sm">{contact.billingAddress.street}</p>}
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            {contact.billingAddress.city && <span>{contact.billingAddress.city}</span>}
                                            {contact.billingAddress.state && <span>, {contact.billingAddress.state}</span>}
                                            {contact.billingAddress.postalCode && <span> - {contact.billingAddress.postalCode}</span>}
                                        </div>
                                        {contact.billingAddress.country && <p className="text-sm text-muted-foreground">{contact.billingAddress.country}</p>}
                                        {contact.billingAddress.landmark && <p className="text-sm text-muted-foreground">Landmark: {contact.billingAddress.landmark}</p>}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No billing address provided</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Business Tab */}
                <TabsContent value="business" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Tax Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Tax Information</CardTitle>
                                <CardDescription>
                                    Tax-related details for compliance
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {contact.taxInfo ? (
                                    <div className="space-y-3">
                                        {contact.taxInfo.gstNumber && (
                                            <div>
                                                <p className="text-sm font-medium">GST Number</p>
                                                <p className="text-sm text-muted-foreground">{contact.taxInfo.gstNumber}</p>
                                            </div>
                                        )}
                                        {contact.taxInfo.panNumber && (
                                            <div>
                                                <p className="text-sm font-medium">PAN Number</p>
                                                <p className="text-sm text-muted-foreground">{contact.taxInfo.panNumber}</p>
                                            </div>
                                        )}
                                        {contact.taxInfo.taxExempt && (
                                            <div>
                                                <p className="text-sm font-medium">Tax Exempt</p>
                                                <p className="text-sm text-muted-foreground">Yes</p>
                                                {contact.taxInfo.taxExemptionReason && (
                                                    <p className="text-sm text-muted-foreground">Reason: {contact.taxInfo.taxExemptionReason}</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No tax information provided</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Profile Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Profile Information</CardTitle>
                                <CardDescription>
                                    Additional profile details
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {contact.profile ? (
                                    <div className="space-y-3">
                                        {contact.profile.industry && (
                                            <div>
                                                <p className="text-sm font-medium">Industry</p>
                                                <p className="text-sm text-muted-foreground">{contact.profile.industry}</p>
                                            </div>
                                        )}
                                        {contact.profile.companySize && (
                                            <div>
                                                <p className="text-sm font-medium">Company Size</p>
                                                <p className="text-sm text-muted-foreground">{contact.profile.companySize} employees</p>
                                            </div>
                                        )}
                                        {contact.profile.preferredLanguage && (
                                            <div>
                                                <p className="text-sm font-medium">Preferred Language</p>
                                                <p className="text-sm text-muted-foreground">{contact.profile.preferredLanguage}</p>
                                            </div>
                                        )}
                                        {contact.profile.timezone && (
                                            <div>
                                                <p className="text-sm font-medium">Timezone</p>
                                                <p className="text-sm text-muted-foreground">{contact.profile.timezone}</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No profile information provided</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Additional Tab */}
                <TabsContent value="additional" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>System Information</CardTitle>
                            <CardDescription>
                                Contact creation and update details
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <p className="text-sm font-medium">Created At</p>
                                    <p className="text-sm text-muted-foreground">
                                        {new Date(contact.createdAt).toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Last Updated</p>
                                    <p className="text-sm text-muted-foreground">
                                        {new Date(contact.updatedAt).toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Status</p>
                                    <Badge variant={contact.isActive ? "default" : "secondary"}>
                                        {contact.isActive ? "Active" : "Inactive"}
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Contact ID</p>
                                    <p className="text-sm text-muted-foreground">#{contact.id}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
