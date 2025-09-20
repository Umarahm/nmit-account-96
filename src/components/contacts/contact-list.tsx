"use client";

import { ContactCard } from "./contact-card";
import { Contact } from "@/types/contacts";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Building2, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ContactListProps {
    contacts: Contact[];
    type?: 'CUSTOMER' | 'VENDOR' | 'BOTH' | 'ALL';
    onEdit?: (contact: Contact) => void;
    onDelete?: (contact: Contact) => void;
    showActions?: boolean;
    emptyMessage?: string;
    emptyAction?: {
        label: string;
        href: string;
    };
}

export function ContactList({
    contacts,
    type = 'ALL',
    onEdit,
    onDelete,
    showActions = true,
    emptyMessage,
    emptyAction
}: ContactListProps) {
    const getEmptyIcon = () => {
        switch (type) {
            case 'CUSTOMER':
                return <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />;
            case 'VENDOR':
                return <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />;
            default:
                return <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />;
        }
    };

    const getDefaultEmptyMessage = () => {
        switch (type) {
            case 'CUSTOMER':
                return "No customers found";
            case 'VENDOR':
                return "No vendors found";
            default:
                return "No contacts found";
        }
    };

    const getDefaultEmptyAction = () => {
        switch (type) {
            case 'CUSTOMER':
                return {
                    label: "Add Customer",
                    href: "/dashboard/contacts/new?type=CUSTOMER"
                };
            case 'VENDOR':
                return {
                    label: "Add Vendor",
                    href: "/dashboard/contacts/new?type=VENDOR"
                };
            default:
                return {
                    label: "Add Contact",
                    href: "/dashboard/contacts/new"
                };
        }
    };

    if (contacts.length === 0) {
        const message = emptyMessage || getDefaultEmptyMessage();
        const action = emptyAction || getDefaultEmptyAction();

        return (
            <Card>
                <CardContent className="p-12 text-center">
                    {getEmptyIcon()}
                    <h3 className="text-lg font-semibold mb-2">{message}</h3>
                    <p className="text-muted-foreground mb-4">
                        Get started by adding your first contact
                    </p>
                    <Link href={action.href}>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            {action.label}
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="grid gap-4">
            {contacts.map((contact) => (
                <ContactCard
                    key={contact.id}
                    contact={contact}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    showActions={showActions}
                />
            ))}
        </div>
    );
}
