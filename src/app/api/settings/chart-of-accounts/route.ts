import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { chartOfAccounts } from '@/lib/db/schema';
import { eq, asc, isNull, or } from 'drizzle-orm';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('Fetching chart of accounts...');

        // Fetch all accounts ordered by code
        const accounts = await db
            .select()
            .from(chartOfAccounts)
            .orderBy(asc(chartOfAccounts.code));

        console.log(`Found ${accounts.length} accounts`);

        // Transform the data to match the frontend interface
        const transformedAccounts = accounts.map(account => ({
            id: account.id,
            code: account.code,
            name: account.name,
            type: account.type,
            parentId: account.parentId,
            level: account.level || 0,
            isGroup: account.isGroup || false,
            description: account.description,
            isActive: account.isActive,
        }));

        return NextResponse.json({
            success: true,
            accounts: transformedAccounts,
        });

    } catch (error) {
        console.error('Error fetching chart of accounts:', error);
        return NextResponse.json(
            { error: 'Failed to fetch chart of accounts' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { code, name, type, parentId, isGroup, description } = body;

        console.log('Creating new account:', { code, name, type, parentId, isGroup });

        // Validate required fields
        if (!code || !name || !type) {
            return NextResponse.json(
                { error: 'Code, name, and type are required' },
                { status: 400 }
            );
        }

        // Check if account code already exists
        const existingAccount = await db
            .select()
            .from(chartOfAccounts)
            .where(eq(chartOfAccounts.code, code))
            .limit(1);

        if (existingAccount.length > 0) {
            return NextResponse.json(
                { error: 'Account code already exists' },
                { status: 400 }
            );
        }

        // If parentId is provided, validate it exists and is a group account
        let level = 0;
        if (parentId) {
            const parentAccount = await db
                .select()
                .from(chartOfAccounts)
                .where(eq(chartOfAccounts.id, parentId))
                .limit(1);

            if (parentAccount.length === 0) {
                return NextResponse.json(
                    { error: 'Parent account not found' },
                    { status: 400 }
                );
            }

            if (!parentAccount[0].isGroup) {
                return NextResponse.json(
                    { error: 'Parent account must be a group account' },
                    { status: 400 }
                );
            }

            level = (parentAccount[0].level || 0) + 1;
        }

        // Create the new account
        const [newAccount] = await db
            .insert(chartOfAccounts)
            .values({
                code,
                name,
                type,
                parentId: parentId || null,
                level,
                isGroup: isGroup || false,
                description: description || null,
                isActive: true,
            })
            .returning();

        console.log('Created account:', newAccount);

        return NextResponse.json({
            success: true,
            account: {
                id: newAccount.id,
                code: newAccount.code,
                name: newAccount.name,
                type: newAccount.type,
                parentId: newAccount.parentId,
                level: newAccount.level,
                isGroup: newAccount.isGroup,
                description: newAccount.description,
                isActive: newAccount.isActive,
            },
        });

    } catch (error) {
        console.error('Error creating account:', error);
        return NextResponse.json(
            { error: 'Failed to create account' },
            { status: 500 }
        );
    }
}