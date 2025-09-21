import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { taxConfiguration } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the tax configuration (should be only one record)
    const config = await db.select().from(taxConfiguration).limit(1);
    
    if (config.length === 0) {
      // Return default configuration if none exists
      const defaultConfig = {
        enableTax: true,
        defaultTaxRate: 18,
        taxDisplayFormat: 'percentage' as const,
        roundingMethod: 'round' as const,
        compoundTax: false,
        taxOnShipping: false,
        pricesIncludeTax: false
      };
      return NextResponse.json(defaultConfig);
    }
    
    return NextResponse.json(config[0]);
  } catch (error) {
    console.error('Error fetching tax configuration:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    
    // Validate the data
    if (typeof data.enableTax !== 'boolean') {
      return NextResponse.json(
        { error: 'enableTax must be a boolean' },
        { status: 400 }
      );
    }

    if (typeof data.defaultTaxRate !== 'number' || data.defaultTaxRate < 0) {
      return NextResponse.json(
        { error: 'defaultTaxRate must be a positive number' },
        { status: 400 }
      );
    }

    const configData = {
      enableTax: data.enableTax,
      defaultTaxRate: parseFloat(data.defaultTaxRate),
      taxDisplayFormat: data.taxDisplayFormat || 'percentage',
      roundingMethod: data.roundingMethod || 'round',
      compoundTax: data.compoundTax || false,
      taxOnShipping: data.taxOnShipping || false,
      pricesIncludeTax: data.pricesIncludeTax || false,
      updatedAt: new Date().toISOString()
    };

    // Check if configuration exists
    const existing = await db.select().from(taxConfiguration).limit(1);
    
    let result;
    if (existing.length === 0) {
      // Create new configuration
      result = await db.insert(taxConfiguration).values({
        ...configData,
        id: '1', // Use a fixed ID since there should only be one config
        createdAt: new Date().toISOString()
      }).returning();
    } else {
      // Update existing configuration
      result = await db.update(taxConfiguration)
        .set(configData)
        .where(eq(taxConfiguration.id, existing[0].id))
        .returning();
    }
    
    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error updating tax configuration:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}