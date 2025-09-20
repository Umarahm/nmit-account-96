export interface Contact {
    id: number;
    type: 'CUSTOMER' | 'VENDOR' | 'BOTH';
    name: string;
    displayName?: string;
    email?: string;
    mobile?: string;
    phone?: string;
    website?: string;
    address?: Address;
    billingAddress?: Address;
    shippingAddress?: Address;
    taxInfo?: TaxInfo;
    profile?: ContactProfile;
    creditLimit?: number;
    paymentTerms?: number;
    currency: string;
    notes?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Address {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    landmark?: string;
}

export interface TaxInfo {
    gstNumber?: string;
    panNumber?: string;
    taxExempt?: boolean;
    taxExemptionReason?: string;
}

export interface ContactProfile {
    industry?: string;
    companySize?: string;
    preferredLanguage?: string;
    timezone?: string;
    customFields?: Record<string, any>;
}

export interface CreateContactRequest {
    type: 'CUSTOMER' | 'VENDOR' | 'BOTH';
    name: string;
    displayName?: string;
    email?: string;
    mobile?: string;
    phone?: string;
    website?: string;
    address?: Address;
    billingAddress?: Address;
    shippingAddress?: Address;
    taxInfo?: TaxInfo;
    profile?: ContactProfile;
    creditLimit?: number;
    paymentTerms?: number;
    currency?: string;
    notes?: string;
}

export interface UpdateContactRequest extends Partial<CreateContactRequest> {
    id: number;
}

export interface ContactFilters {
    type?: 'CUSTOMER' | 'VENDOR' | 'BOTH' | 'ALL';
    search?: string;
    page?: number;
    limit?: number;
}

export interface ContactsResponse {
    contacts: Contact[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}
