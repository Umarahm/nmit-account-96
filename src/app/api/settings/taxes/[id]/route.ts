import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { taxSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { id } = params;

    // Validate required fields
    if (!data.name || !data.rate || data.rate < 0) {
      return NextResponse.json(
        { error: 'Name and valid rate are required' },
        { status: 400 }
      );
    }

    // If this is set as default, remove default from others
    if (data.isDefault) {
      await db.update(taxSettings)
        .set({ isDefault: false })
        .where(eq(taxSettings.isDefault, true));
    }

    const updatedTaxSetting = {
      name: data.name,
      description: data.description || '',
      rate: parseFloat(data.rate),
      type: data.type || 'exclusive',
      isDefault: data.isDefault || false,
      isActive: data.isActive !== undefined ? data.isActive : true,
      category: data.category || 'both',
      hsnCodes: data.hsnCodes || [],
      updatedAt: new Date().toISOString()
    };

    const result = await db.update(taxSettings)
      .set(updatedTaxSetting)
      .where(eq(taxSettings.id, id))
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Tax setting not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error updating tax setting:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const result = await db.delete(taxSettings)
      .where(eq(taxSettings.id, id))
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Tax setting not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Tax setting deleted successfully' });
  } catch (error) {
    console.error('Error deleting tax setting:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}