import { NextRequest, NextResponse } from "next/server";

// Test endpoint to verify HSN API functionality
export async function GET(request: NextRequest) {
    try {
        // Test HSN search with a known HSN code
        const testHSNCode = "1001"; // Wheat and meslin
        const testDescription = "steel"; // Common product description

        const results = [];

        // Test 1: Search by HSN code
        try {
            const codeSearchUrl = new URL('http://localhost:3008/api/hsn/search');
            codeSearchUrl.searchParams.append('inputText', testHSNCode);
            codeSearchUrl.searchParams.append('selectedType', 'byCode');
            codeSearchUrl.searchParams.append('category', 'null');

            const codeResponse = await fetch(codeSearchUrl.toString());
            const codeData = await codeResponse.json();
            
            results.push({
                test: "Search by HSN Code",
                input: testHSNCode,
                success: codeResponse.ok,
                data: codeData
            });
        } catch (error) {
            results.push({
                test: "Search by HSN Code",
                input: testHSNCode,
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }

        // Test 2: Search by description for products
        try {
            const descSearchUrl = new URL('http://localhost:3008/api/hsn/search');
            descSearchUrl.searchParams.append('inputText', testDescription);
            descSearchUrl.searchParams.append('selectedType', 'byDesc');
            descSearchUrl.searchParams.append('category', 'P');

            const descResponse = await fetch(descSearchUrl.toString());
            const descData = await descResponse.json();
            
            results.push({
                test: "Search by Description (Products)",
                input: testDescription,
                success: descResponse.ok,
                data: descData
            });
        } catch (error) {
            results.push({
                test: "Search by Description (Products)",
                input: testDescription,
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }

        // Test 3: Search by description for services
        try {
            const serviceSearchUrl = new URL('http://localhost:3008/api/hsn/search');
            serviceSearchUrl.searchParams.append('inputText', 'consultation');
            serviceSearchUrl.searchParams.append('selectedType', 'byDesc');
            serviceSearchUrl.searchParams.append('category', 'S');

            const serviceResponse = await fetch(serviceSearchUrl.toString());
            const serviceData = await serviceResponse.json();
            
            results.push({
                test: "Search by Description (Services)",
                input: 'consultation',
                success: serviceResponse.ok,
                data: serviceData
            });
        } catch (error) {
            results.push({
                test: "Search by Description (Services)",
                input: 'consultation',
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }

        return NextResponse.json({
            message: "HSN API Integration Test Results",
            timestamp: new Date().toISOString(),
            results: results,
            summary: {
                totalTests: results.length,
                passed: results.filter(r => r.success).length,
                failed: results.filter(r => !r.success).length
            }
        });

    } catch (error) {
        console.error("HSN test error:", error);
        return NextResponse.json(
            { error: "Test execution failed", details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}