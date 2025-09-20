import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// HSN API Endpoint Reference
// https://services.gst.gov.in/commonservices/hsnsearch?q

interface HSNSearchParams {
    inputText: string;
    selectedType: 'byCode' | 'byDesc';
    category: null | 'P' | 'S'; // null for code search, P for products, S for services
}

interface HSNResponse {
    data: Array<{
        c: string; // HSN Code
        n: string; // Description
    }>;
}

// GET /api/hsn/search - Search HSN codes using government API
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const inputText = searchParams.get('inputText');
        const selectedType = searchParams.get('selectedType') as 'byCode' | 'byDesc';
        const category = searchParams.get('category') as null | 'P' | 'S';

        // Validate required parameters
        if (!inputText || !selectedType) {
            return NextResponse.json(
                { error: "inputText and selectedType are required" },
                { status: 400 }
            );
        }

        // Validate selectedType
        if (!['byCode', 'byDesc'].includes(selectedType)) {
            return NextResponse.json(
                { error: "selectedType must be 'byCode' or 'byDesc'" },
                { status: 400 }
            );
        }

        // For description search, category is required
        if (selectedType === 'byDesc' && !category) {
            return NextResponse.json(
                { error: "category is required for description search" },
                { status: 400 }
            );
        }

        // Build HSN API URL
        const hsnApiUrl = new URL('https://services.gst.gov.in/commonservices/hsnsearch');
        hsnApiUrl.searchParams.append('inputText', inputText);
        hsnApiUrl.searchParams.append('selectedType', selectedType);
        hsnApiUrl.searchParams.append('category', category || 'null');

        console.log('HSN API Request:', hsnApiUrl.toString());

        // Call the government HSN API
        const hsnResponse = await fetch(hsnApiUrl.toString(), {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'ShivAccountsCloud/1.0',
            },
            // Set timeout for the request
            signal: AbortSignal.timeout(10000), // 10 seconds timeout
        });

        if (!hsnResponse.ok) {
            console.error('HSN API Error:', hsnResponse.status, hsnResponse.statusText);
            return NextResponse.json(
                { error: "Failed to fetch HSN data from government API" },
                { status: 502 }
            );
        }

        const hsnData: HSNResponse = await hsnResponse.json();

        // Process and format the response
        const formattedData = {
            success: true,
            data: hsnData.data?.map(item => ({
                code: item.c,
                description: item.n,
                display: `${item.c} - ${item.n}`
            })) || [],
            totalResults: hsnData.data?.length || 0
        };

        return NextResponse.json(formattedData);

    } catch (error) {
        console.error("HSN search error:", error);
        
        // Handle timeout errors
        if (error instanceof Error && error.name === 'TimeoutError') {
            return NextResponse.json(
                { error: "HSN API request timed out. Please try again." },
                { status: 504 }
            );
        }

        // Handle network errors
        if (error instanceof TypeError && error.message.includes('fetch')) {
            return NextResponse.json(
                { error: "Failed to connect to HSN API. Please check your internet connection." },
                { status: 503 }
            );
        }

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// POST /api/hsn/search - Alternative endpoint for complex searches
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { inputText, selectedType, category } = body as HSNSearchParams;

        // Validate required parameters
        if (!inputText || !selectedType) {
            return NextResponse.json(
                { error: "inputText and selectedType are required" },
                { status: 400 }
            );
        }

        // Create new URL for the search
        const searchUrl = new URL(request.url);
        searchUrl.searchParams.set('inputText', inputText);
        searchUrl.searchParams.set('selectedType', selectedType);
        if (category) {
            searchUrl.searchParams.set('category', category);
        }

        // Create a new request object for the GET handler
        const getRequest = new NextRequest(searchUrl.toString());
        
        // Call the GET handler
        return await GET(getRequest);

    } catch (error) {
        console.error("HSN POST search error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}