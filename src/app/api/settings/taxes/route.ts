import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { taxSettings } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await db.select().from(taxSettings).orderBy(taxSettings.name);
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching tax settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    
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

    const newTaxSetting = {
      name: data.name,
      description: data.description || '',
      rate: parseFloat(data.rate),
      type: data.type || 'exclusive',
      isDefault: data.isDefault || false,
      isActive: data.isActive !== undefined ? data.isActive : true,
      category: data.category || 'both',
      hsnCodes: data.hsnCodes || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const result = await db.insert(taxSettings).values(newTaxSetting).returning();
    
    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Error creating tax setting:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}