import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Check if Supabase is properly configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Supabase not configured - missing environment variables');
      return NextResponse.json(
        { error: 'Database not configured. Please check environment variables.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    console.log('Sessions API received:', body);
    
    const { customer_id, order_id, scheduled_date, scheduled_time, status } = body;

    // Validate required fields
    if (!customer_id || !order_id || !scheduled_date || !scheduled_time) {
      console.log('Missing fields:', { customer_id, order_id, scheduled_date, scheduled_time });
      return NextResponse.json(
        { error: `Missing required fields: customer_id=${!!customer_id}, order_id=${!!order_id}, scheduled_date=${!!scheduled_date}, scheduled_time=${!!scheduled_time}` },
        { status: 400 }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(customer_id)) {
      console.log('Invalid customer_id format:', customer_id);
      return NextResponse.json(
        { error: `Invalid customer_id format: ${customer_id}` },
        { status: 400 }
      );
    }
    
    if (!uuidRegex.test(order_id)) {
      console.log('Invalid order_id format:', order_id);
      return NextResponse.json(
        { error: `Invalid order_id format: ${order_id}` },
        { status: 400 }
      );
    }

    // Check if customer exists
    const { data: customerExists, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('id', customer_id)
      .single();

    if (customerError || !customerExists) {
      console.log('Customer not found:', customer_id, customerError);
      return NextResponse.json(
        { error: `Customer not found: ${customer_id}` },
        { status: 400 }
      );
    }

    // Check if order exists
    const { data: orderExists, error: orderError } = await supabase
      .from('orders')
      .select('id')
      .eq('id', order_id)
      .single();

    if (orderError || !orderExists) {
      console.log('Order not found:', order_id, orderError);
      return NextResponse.json(
        { error: `Order not found: ${order_id}` },
        { status: 400 }
      );
    }

    // Check if the time slot is already booked
    const { data: existingSession, error: slotError } = await supabase
      .from('sessions')
      .select('id, customer_id, scheduled_date, scheduled_time')
      .eq('scheduled_date', scheduled_date)
      .eq('scheduled_time', scheduled_time)
      .eq('status', 'scheduled')
      .single();

    if (existingSession) {
      console.log('Time slot already booked:', { scheduled_date, scheduled_time, existingSession });
      return NextResponse.json(
        { error: `This time slot (${scheduled_date} at ${scheduled_time}) is already booked. Please choose a different time.` },
        { status: 409 }
      );
    }

    if (slotError && slotError.code !== 'PGRST116') { // PGRST116 = no rows returned (slot available)
      console.log('Error checking slot availability:', slotError);
      return NextResponse.json(
        { error: `Error checking slot availability: ${slotError.message}` },
        { status: 500 }
      );
    }

    // Create session in database
    console.log('Attempting to create session with data:', {
      customer_id,
      order_id,
      scheduled_date,
      scheduled_time,
      status: status || 'scheduled'
    });

    const { data, error } = await supabase
      .from('sessions')
      .insert([{
        customer_id,
        order_id,
        scheduled_date,
        scheduled_time,
        status: status || 'scheduled'
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating session:', error);
      return NextResponse.json(
        { error: `Failed to create session: ${error.message || error.details || 'Unknown database error'}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      data,
      message: 'Session booked successfully' 
    });

  } catch (error) {
    console.error('Error in sessions API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Check if Supabase is properly configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Supabase not configured - missing environment variables');
      return NextResponse.json(
        { error: 'Database not configured. Please check environment variables.' },
        { status: 500 }
      );
    }

    // Test Supabase connection
    const { data: testData, error: testError } = await supabase
      .from('customers')
      .select('count')
      .limit(1);

    if (testError) {
      console.error('Supabase connection test failed:', testError);
      return NextResponse.json(
        { error: `Database connection failed: ${testError.message}` },
        { status: 500 }
      );
    }

    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching sessions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch sessions' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      data,
      supabase_configured: true,
      connection_test: 'success'
    });
  } catch (error) {
    console.error('Error in sessions API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
