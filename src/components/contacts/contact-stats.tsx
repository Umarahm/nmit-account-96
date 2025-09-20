"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Users, Building2, DollarSign, TrendingUp } from "lucide-react";
import { Contact } from "@/types/contacts";

interface ContactStatsProps {
    contacts: Contact[];
    type?: 'CUSTOMER' | 'VENDOR' | 'BOTH' | 'ALL';
}

export function ContactStats({ contacts, type = 'ALL' }: ContactStatsProps) {
    const totalContacts = contacts.length;
    const activeContacts = contacts.filter(c => c.isActive).length;

    const newThisMonth = contacts.filter(c => {
        const created = new Date(c.createdAt);
        const now = new Date();
        return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    }).length;

    const getStatsData = () => {
        switch (type) {
            case 'CUSTOMER':
                return [
                    {
                        title: "Total Customers",
                        value: totalContacts,
                        icon: Users,
                        color: "text-blue-600"
                    },
                    {
                        title: "Active Customers",
                        value: activeContacts,
                        icon: DollarSign,
                        color: "text-green-600"
                    },
                    {
                        title: "New This Month",
                        value: newThisMonth,
                        icon: TrendingUp,
                        color: "text-purple-600"
                    }
                ];
            case 'VENDOR':
                return [
                    {
                        title: "Total Vendors",
                        value: totalContacts,
                        icon: Building2,
                        color: "text-green-600"
                    },
                    {
                        title: "Active Vendors",
                        value: activeContacts,
                        icon: DollarSign,
                        color: "text-blue-600"
                    },
                    {
                        title: "New This Month",
                        value: newThisMonth,
                        icon: TrendingUp,
                        color: "text-purple-600"
                    }
                ];
            default:
                return [
                    {
                        title: "Total Contacts",
                        value: totalContacts,
                        icon: Users,
                        color: "text-blue-600"
                    },
                    {
                        title: "Active Contacts",
                        value: activeContacts,
                        icon: DollarSign,
                        color: "text-green-600"
                    },
                    {
                        title: "New This Month",
                        value: newThisMonth,
                        icon: TrendingUp,
                        color: "text-purple-600"
                    }
                ];
        }
    };

    const statsData = getStatsData();

    return (
        <div className="grid gap-4 md:grid-cols-3">
            {statsData.map((stat, index) => {
                const IconComponent = stat.icon;
                return (
                    <Card key={index}>
                        <CardContent className="p-6">
                            <div className="flex items-center">
                                <IconComponent className={`h-8 w-8 ${stat.color}`} />
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-muted-foreground">
                                        {stat.title}
                                    </p>
                                    <p className="text-2xl font-bold">{stat.value}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
