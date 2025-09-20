import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { users, contacts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user profile data
    const user = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        profileImage: users.profileImage,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (!user.length) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = user[0];

    // For customers (CONTACT role), try to get additional profile data from contacts table
    let contactProfile = null;
    if (userData.role === 'CONTACT') {
      const contact = await db
        .select({
          mobile: contacts.mobile,
          phone: contacts.phone,
          website: contacts.website,
          address: contacts.address,
          profile: contacts.profile,
        })
        .from(contacts)
        .where(eq(contacts.email, session.user.email))
        .limit(1);

      if (contact.length) {
        contactProfile = contact[0];
      }
    }

    // Build profile response
    const profile = {
      id: userData.id.toString(),
      name: userData.name || '',
      email: userData.email,
      role: userData.role,
      mobile: contactProfile?.mobile || '',
      phone: contactProfile?.phone || '',
      website: contactProfile?.website || '',
      address: contactProfile?.address || {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
      },
      company: (contactProfile?.profile as any)?.company || '',
    };

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, mobile, phone, website, address, company } = body;

    // Get current user
    const user = await db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (!user.length) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = user[0];

    // Update user name in users table
    if (name && name !== session.user.name) {
      await db
        .update(users)
        .set({ 
          name,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userData.id));
    }

    // For CONTACT users, update or create contact profile
    if (userData.role === 'CONTACT') {
      // Check if contact record exists
      const existingContact = await db
        .select({ id: contacts.id })
        .from(contacts)
        .where(eq(contacts.email, session.user.email))
        .limit(1);

      const contactData = {
        name: name || session.user.name || '',
        mobile: mobile || null,
        phone: phone || null,
        website: website || null,
        address: address || null,
        profile: { company: company || '' },
        updatedAt: new Date(),
      };

      if (existingContact.length) {
        // Update existing contact
        await db
          .update(contacts)
          .set(contactData)
          .where(eq(contacts.id, existingContact[0].id));
      } else {
        // Create new contact record
        await db.insert(contacts).values({
          type: 'CUSTOMER',
          email: session.user.email,
          displayName: name || session.user.name || '',
          ...contactData,
        });
      }
    }

    // Fetch updated profile
    const updatedUser = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        profileImage: users.profileImage,
      })
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    let updatedContactProfile = null;
    if (userData.role === 'CONTACT') {
      const contact = await db
        .select({
          mobile: contacts.mobile,
          phone: contacts.phone,
          website: contacts.website,
          address: contacts.address,
          profile: contacts.profile,
        })
        .from(contacts)
        .where(eq(contacts.email, session.user.email))
        .limit(1);

      if (contact.length) {
        updatedContactProfile = contact[0];
      }
    }

    const updatedProfile = {
      id: updatedUser[0].id.toString(),
      name: updatedUser[0].name || '',
      email: updatedUser[0].email,
      role: updatedUser[0].role,
      mobile: updatedContactProfile?.mobile || '',
      phone: updatedContactProfile?.phone || '',
      website: updatedContactProfile?.website || '',
      address: updatedContactProfile?.address || {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
      },
      company: (updatedContactProfile?.profile as any)?.company || '',
    };

    return NextResponse.json({ 
      message: 'Profile updated successfully',
      profile: updatedProfile,
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}