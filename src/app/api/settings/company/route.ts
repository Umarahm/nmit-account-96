import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { companySettings, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/settings/company - Get company settings
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get the latest company settings
        const [settings] = await db
            .select()
            .from(companySettings)
            .limit(1);

        if (!settings) {
            // Return default settings if none exist
            return NextResponse.json({
                settings: {
                    companyName: '',
                    email: '',
                    phone: '',
                    website: '',
                    address: {
                        line1: '',
                        line2: '',
                        city: '',
                        state: '',
                        pincode: '',
                        country: 'India',
                    },
                    taxInfo: {
                        gstin: '',
                        pan: '',
                        cin: '',
                    },
                    fiscalYearStart: '04-01',
                    baseCurrency: 'INR',
                    timezone: 'Asia/Kolkata',
                    dateFormat: 'DD/MM/YYYY',
                }
            });
        }

        return NextResponse.json({
            settings: {
                id: settings.id,
                companyName: settings.companyName,
                email: settings.email || '',
                phone: settings.phone || '',
                website: settings.website || '',
                address: settings.address || {
                    line1: '',
                    line2: '',
                    city: '',
                    state: '',
                    pincode: '',
                    country: 'India',
                },
                taxInfo: settings.taxInfo || {
                    gstin: '',
                    pan: '',
                    cin: '',
                },
                fiscalYearStart: settings.fiscalYearStart || '04-01',
                baseCurrency: settings.baseCurrency || 'INR',
                timezone: settings.timezone || 'Asia/Kolkata',
                dateFormat: settings.dateFormat || 'DD/MM/YYYY',
                logo: settings.logo,
            }
        });

    } catch (error) {
        console.error("Error fetching company settings:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// POST /api/settings/company - Create or update company settings
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const {
            companyName,
            email,
            phone,
            website,
            address,
            taxInfo,
            fiscalYearStart,
            baseCurrency,
            timezone,
            dateFormat,
            logo
        } = body;

        // Validate required fields
        if (!companyName) {
            return NextResponse.json(
                { error: "Company name is required" },
                { status: 400 }
            );
        }

        // Check if settings already exist
        const [existingSettings] = await db
            .select()
            .from(companySettings)
            .limit(1);

        const settingsData = {
            companyName,
            email,
            phone,
            website,
            address,
            taxInfo,
            fiscalYearStart: fiscalYearStart || '04-01',
            baseCurrency: baseCurrency || 'INR',
            timezone: timezone || 'Asia/Kolkata',
            dateFormat: dateFormat || 'DD/MM/YYYY',
            logo,
            updatedBy: parseInt(session.user.id),
        };

        let result;

        if (existingSettings) {
            // Update existing settings
            [result] = await db
                .update(companySettings)
                .set(settingsData)
                .where(eq(companySettings.id, existingSettings.id))
                .returning();
        } else {
            // Create new settings
            [result] = await db
                .insert(companySettings)
                .values(settingsData)
                .returning();
        }

        return NextResponse.json({
            message: "Company settings saved successfully",
            settings: result
        }, { status: 200 });

    } catch (error) {
        console.error("Error saving company settings:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}