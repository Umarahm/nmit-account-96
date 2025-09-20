import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { chartOfAccounts, transactions } from '@/lib/db/schema';
import { eq, or } from 'drizzle-orm';

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const accountId = parseInt(params.id);
        if (isNaN(accountId)) {
            return NextResponse.json({ error: 'Invalid account ID' }, { status: 400 });
        }

        const body = await request.json();
        const { code, name, type, parentId, isGroup, description } = body;

        console.log('Updating account:', accountId, { code, name, type, parentId, isGroup });

        // Validate required fields
        if (!code || !name || !type) {
            return NextResponse.json(
                { error: 'Code, name, and type are required' },
                { status: 400 }
            );
        }

        // Check if the account exists
        const existingAccount = await db
            .select()
            .from(chartOfAccounts)
            .where(eq(chartOfAccounts.id, accountId))
            .limit(1);

        if (existingAccount.length === 0) {
            return NextResponse.json(
                { error: 'Account not found' },
                { status: 404 }
            );
        }

        // Check if account code already exists (excluding current account)
        const duplicateAccount = await db
            .select()
            .from(chartOfAccounts)
            .where(eq(chartOfAccounts.code, code))
            .limit(1);

        if (duplicateAccount.length > 0 && duplicateAccount[0].id !== accountId) {
            return NextResponse.json(
                { error: 'Account code already exists' },
                { status: 400 }
            );
        }

        // Validate parent account if provided
        let level = 0;
        if (parentId) {
            // Prevent circular reference (account cannot be its own parent or descendant)
            if (parentId === accountId) {
                return NextResponse.json(
                    { error: 'Account cannot be its own parent' },
                    { status: 400 }
                );
            }

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

        // If changing from group to non-group, check if it has children
        if (existingAccount[0].isGroup && !isGroup) {
            const children = await db
                .select()
                .from(chartOfAccounts)
                .where(eq(chartOfAccounts.parentId, accountId))
                .limit(1);

            if (children.length > 0) {
                return NextResponse.json(
                    { error: 'Cannot change group account with children to non-group' },
                    { status: 400 }
                );
            }
        }

        // Update the account
        const [updatedAccount] = await db
            .update(chartOfAccounts)
            .set({
                code,
                name,
                type,
                parentId: parentId || null,
                level,
                isGroup: isGroup || false,
                description: description || null,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(chartOfAccounts.id, accountId))
            .returning();

        console.log('Updated account:', updatedAccount);

        return NextResponse.json({
            success: true,
            account: {
                id: updatedAccount.id,
                code: updatedAccount.code,
                name: updatedAccount.name,
                type: updatedAccount.type,
                parentId: updatedAccount.parentId,
                level: updatedAccount.level,
                isGroup: updatedAccount.isGroup,
                description: updatedAccount.description,
                isActive: updatedAccount.isActive,
            },
        });

    } catch (error) {
        console.error('Error updating account:', error);
        return NextResponse.json(
            { error: 'Failed to update account' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const accountId = parseInt(params.id);
        if (isNaN(accountId)) {
            return NextResponse.json({ error: 'Invalid account ID' }, { status: 400 });
        }

        console.log('Deleting account:', accountId);

        // Check if the account exists
        const existingAccount = await db
            .select()
            .from(chartOfAccounts)
            .where(eq(chartOfAccounts.id, accountId))
            .limit(1);

        if (existingAccount.length === 0) {
            return NextResponse.json(
                { error: 'Account not found' },
                { status: 404 }
            );
        }

        // Check if account has children
        const children = await db
            .select()
            .from(chartOfAccounts)
            .where(eq(chartOfAccounts.parentId, accountId))
            .limit(1);

        if (children.length > 0) {
            return NextResponse.json(
                { error: 'Cannot delete account with sub-accounts. Please delete or move sub-accounts first.' },
                { status: 400 }
            );
        }

        // Check if account is used in transactions
        const transactionCheck = await db
            .select({ id: transactions.id })
            .from(transactions)
            .where(
                or(
                    eq(transactions.debitAccountId, accountId),
                    eq(transactions.creditAccountId, accountId)
                )
            )
            .limit(1);

        if (transactionCheck.length > 0) {
            return NextResponse.json(
                { error: 'Cannot delete account that has been used in transactions' },
                { status: 400 }
            );
        }

        // Delete the account
        await db
            .delete(chartOfAccounts)
            .where(eq(chartOfAccounts.id, accountId));

        console.log('Deleted account:', accountId);

        return NextResponse.json({
            success: true,
            message: 'Account deleted successfully',
        });

    } catch (error) {
        console.error('Error deleting account:', error);
        return NextResponse.json(
            { error: 'Failed to delete account' },
            { status: 500 }
        );
    }
}