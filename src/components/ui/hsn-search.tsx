"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Search, X, Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface HSNItem {
    code: string;
    description: string;
    display: string;
}

interface HSNResponse {
    success: boolean;
    data: HSNItem[];
    totalResults: number;
    error?: string;
}

interface HSNSearchProps {
    value?: string;
    onSelect: (hsnCode: string) => void;
    onClear?: () => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    required?: boolean;
    label?: string;
    productType?: 'GOODS' | 'SERVICE'; // Auto-set category based on product type
}

export function HSNSearch({
    value = "",
    onSelect,
    onClear,
    placeholder = "Search HSN code or description...",
    className,
    disabled = false,
    required = false,
    label = "HSN Code",
    productType = 'GOODS'
}: HSNSearchProps) {
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [hsnItems, setHsnItems] = useState<HSNItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedHSN, setSelectedHSN] = useState<HSNItem | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Debounced search function
    const debounce = useCallback((func: Function, delay: number) => {
        let timeoutId: NodeJS.Timeout;
        return (...args: any[]) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(null, args), delay);
        };
    }, []);

    // Search HSN codes
    const searchHSN = useCallback(async (term: string) => {
        if (!term || term.length < 2) {
            setHsnItems([]);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Determine search type and category based on input
            const isNumeric = /^\d+$/.test(term);
            const selectedType = isNumeric ? 'byCode' : 'byDesc';
            const category = selectedType === 'byCode' ? null : (productType === 'SERVICE' ? 'S' : 'P');

            const params = new URLSearchParams({
                inputText: term,
                selectedType,
                ...(category && { category })
            });

            const response = await fetch(`/api/hsn/search?${params}`);
            
            // Handle non-ok responses first, before parsing JSON
            if (!response.ok) {
                let errorMessage = 'Failed to search HSN codes';
                
                // Try to parse error response
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch (jsonError) {
                    // If JSON parsing fails, use status-based messages
                    console.error('Failed to parse error response:', jsonError);
                }
                
                // Handle specific HTTP status codes
                if (response.status === 401) {
                    throw new Error('Authentication required. Please sign in to search HSN codes.');
                } else if (response.status === 403) {
                    throw new Error('Access denied. You do not have permission to search HSN codes.');
                } else if (response.status >= 500) {
                    throw new Error('HSN service is temporarily unavailable. Please try again later.');
                } else {
                    throw new Error(errorMessage);
                }
            }

            // Parse successful response
            let data: HSNResponse;
            try {
                data = await response.json();
            } catch (jsonError) {
                console.error('Failed to parse HSN API response:', jsonError);
                throw new Error('Invalid response from HSN service');
            }

            if (data.success) {
                setHsnItems(data.data || []);
            } else {
                throw new Error(data.error || 'Search failed');
            }

        } catch (err) {
            console.error('HSN search error:', err);
            
            let errorMessage = 'Failed to search HSN codes';
            
            if (err instanceof TypeError && err.message.includes('fetch')) {
                errorMessage = 'Network error. Please check your internet connection.';
            } else if (err instanceof Error) {
                errorMessage = err.message;
            }
            
            setError(errorMessage);
            setHsnItems([]);
        } finally {
            setLoading(false);
        }
    }, [productType]);

    // Debounced search
    const debouncedSearch = useCallback(
        debounce(searchHSN, 500),
        [searchHSN]
    );

    // Handle search input change
    const handleSearchChange = (term: string) => {
        setSearchTerm(term);
        debouncedSearch(term);
    };

    // Handle HSN selection
    const handleHSNSelect = (hsn: HSNItem) => {
        setSelectedHSN(hsn);
        onSelect(hsn.code);
        setOpen(false);
        setSearchTerm("");
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Handle clear selection
    const handleClear = () => {
        setSelectedHSN(null);
        setSearchTerm("");
        setHsnItems([]);
        onClear?.();
        onSelect("");
    };

    // Initialize selected HSN if value is provided
    useEffect(() => {
        if (value && !selectedHSN) {
            // If we have a value but no selected HSN, try to find it
            const existingHSN = hsnItems.find(item => item.code === value);
            if (existingHSN) {
                setSelectedHSN(existingHSN);
            } else if (value) {
                // Create a placeholder HSN item for existing values
                setSelectedHSN({
                    code: value,
                    description: "Previously selected HSN code",
                    display: `${value} - Previously selected HSN code`
                });
            }
        }
    }, [value, selectedHSN, hsnItems]);

    return (
        <div className={cn("space-y-2", className)}>
            {label && (
                <Label className="text-sm font-medium">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </Label>
            )}
            
            <div className="relative" ref={dropdownRef}>
                {selectedHSN ? (
                    // Display selected HSN
                    <div className="flex items-center gap-2 p-3 bg-gray-50 border rounded-md">
                        <div className="flex-1">
                            <Badge variant="secondary" className="mb-1">
                                {selectedHSN.code}
                            </Badge>
                            <p className="text-sm text-gray-600 truncate">
                                {selectedHSN.description}
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleClear}
                            disabled={disabled}
                            className="h-8 w-8 p-0"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                ) : (
                    // Search interface
                    <div className="relative">
                        <div className="relative">
                            <Input
                                ref={inputRef}
                                value={searchTerm}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                onFocus={() => setOpen(true)}
                                placeholder={placeholder}
                                disabled={disabled}
                                className="pr-10"
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                {loading ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                                ) : (
                                    <Search className="h-4 w-4 text-gray-400" />
                                )}
                            </div>
                        </div>
                        
                        {/* Dropdown */}
                        {open && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                                {loading && (
                                    <div className="flex items-center justify-center p-4">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span className="ml-2 text-sm">Searching...</span>
                                    </div>
                                )}
                                
                                {error && (
                                    <div className="p-4 text-sm text-red-600">
                                        {error}
                                    </div>
                                )}
                                
                                {!loading && !error && hsnItems.length === 0 && searchTerm.length >= 2 && (
                                    <div className="p-4 text-sm text-gray-500 text-center">
                                        No HSN codes found for "{searchTerm}"
                                    </div>
                                )}
                                
                                {!loading && hsnItems.length > 0 && (
                                    <div className="py-1">
                                        {hsnItems.map((hsn) => (
                                            <button
                                                key={hsn.code}
                                                type="button"
                                                onClick={() => handleHSNSelect(hsn)}
                                                className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                                            >
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="text-xs">
                                                            {hsn.code}
                                                        </Badge>
                                                    </div>
                                                    <span className="text-sm text-gray-600 mt-1">
                                                        {hsn.description}
                                                    </span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                                
                                {searchTerm.length < 2 && (
                                    <div className="p-4 text-sm text-gray-500 text-center">
                                        Enter at least 2 characters to search
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            {/* Help text */}
            <p className="text-xs text-gray-500">
                Search by HSN code (numbers) or product description (text)
            </p>
        </div>
    );
}