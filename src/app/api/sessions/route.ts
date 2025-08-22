import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
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

    // Create session in database
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
        { error: 'Failed to create session' },
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

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in sessions API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
