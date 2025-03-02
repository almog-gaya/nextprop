import { NextRequest, NextResponse } from 'next/server';

interface ContactData {
  name: string;
  email: string;
  phone: string;
  address?: string;
  notes?: string;
  source?: string;
  type?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const data: ContactData = await request.json();
    
    // Validate required fields
    if (!data.name || !data.name.trim()) {
      return NextResponse.json({ success: false, error: 'Contact name is required' }, { status: 400 });
    }
    
    if (!data.email && !data.phone) {
      return NextResponse.json({ success: false, error: 'Either email or phone is required' }, { status: 400 });
    }
    
    // Generate a random ID for the contact
    const id = Math.random().toString(36).substring(2, 15);
    
    // Create a new contact object with the data
    const newContact = {
      id,
      name: data.name,
      email: data.email || '',
      phone: data.phone || '',
      address: data.address || '',
      notes: data.notes || '',
      source: data.source || 'Property Search',
      type: data.type || 'Property Inquiry',
      created_at: new Date().toISOString(),
      status: 'New',
      last_contacted: null,
      tags: ['real-estate', 'property-inquiry']
    };
    
    // In a real application, you would save this to a database
    // For this mock API, we'll just return the created contact
    
    console.log('Added new contact:', newContact.name);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Contact added successfully', 
      contact: newContact 
    });
    
  } catch (error) {
    console.error('Error adding contact:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to add contact' 
    }, { 
      status: 500 
    });
  }
} 