"use client";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";
import { ContactFilters } from "@/types/contacts";

interface ContactFiltersProps {
    filters: ContactFilters;
    onFiltersChange: (filters: ContactFilters) => void;
    showTypeFilter?: boolean;
    placeholder?: string;
}

export function ContactFiltersComponent({
    filters,
    onFiltersChange,
    showTypeFilter = true,
    placeholder = "Search contacts..."
}: ContactFiltersProps) {
    const handleSearchChange = (value: string) => {
        onFiltersChange({
            ...filters,
            search: value,
            page: 1
        });
    };

    const handleTypeChange = (value: string) => {
        onFiltersChange({
            ...filters,
            type: value as ContactFilters['type'],
            page: 1
        });
    };

    return (
        <Card>
            <CardContent className="p-6">
                <div className="flex gap-4 items-center">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={placeholder}
                                value={filters.search || ''}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                    {showTypeFilter && (
                        <Select
                            value={filters.type || 'ALL'}
                            onValueChange={handleTypeChange}
                        >
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="Filter by type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Contacts</SelectItem>
                                <SelectItem value="CUSTOMER">Customers</SelectItem>
                                <SelectItem value="VENDOR">Vendors</SelectItem>
                                <SelectItem value="BOTH">Both</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
