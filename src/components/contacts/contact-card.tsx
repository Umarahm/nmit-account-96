"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin, Users, Building2, Eye, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { Contact } from "@/types/contacts";

interface ContactCardProps {
    contact: Contact;
    onEdit?: (contact: Contact) => void;
    onDelete?: (contact: Contact) => void;
    showActions?: boolean;
}

export function ContactCard({
    contact,
    onEdit,
    onDelete,
    showActions = true
}: ContactCardProps) {
    const getContactTypeIcon = (type: string) => {
        switch (type) {
            case 'CUSTOMER':
                return <Users className="h-4 w-4 text-blue-600" />;
            case 'VENDOR':
                return <Building2 className="h-4 w-4 text-green-600" />;
            case 'BOTH':
                return <div className="flex gap-1"><Users className="h-3 w-3 text-blue-600" /><Building2 className="h-3 w-3 text-green-600" /></div>;
            default:
                return <Users className="h-4 w-4" />;
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

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-muted rounded-lg">
                            {getContactTypeIcon(contact.type)}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-lg font-semibold">
                                    {contact.displayName || contact.name}
                                </h3>
                                {getContactTypeBadge(contact.type)}
                            </div>

                            <div className="space-y-1 text-sm text-muted-foreground">
                                {contact.email && (
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-3 w-3" />
                                        {contact.email}
                                    </div>
                                )}
                                {contact.mobile && (
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-3 w-3" />
                                        {contact.mobile}
                                    </div>
                                )}
                                {contact.address && (
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-3 w-3" />
                                        {contact.address.city}, {contact.address.state}
                                    </div>
                                )}
                            </div>

                            {contact.notes && (
                                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                    {contact.notes}
                                </p>
                            )}
                        </div>
                    </div>

                    {showActions && (
                        <div className="flex items-center gap-2">
                            <Link href={`/dashboard/contacts/${contact.id}`}>
                                <Button variant="outline" size="sm">
                                    <Eye className="h-4 w-4" />
                                </Button>
                            </Link>
                            {onEdit && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onEdit(contact)}
                                >
                                    <Edit className="h-4 w-4" />
                                </Button>
                            )}
                            {onDelete && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => onDelete(contact)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
