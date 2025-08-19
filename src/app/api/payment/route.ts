import { NextRequest, NextResponse } from 'next/server';
import { saveCustomer, saveOrder } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, addOn, amount } = body;

    // Validate required fields
    if (!name || !email || !phone || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Save customer to database (mock for now)
    let customerId = 'mock-customer-id';
    let orderId = 'mock-order-id';
    
    try {
      const customer = await saveCustomer({
        name,
        email,
        phone
      });
      customerId = customer.id!;

      // Save order to database
      const order = await saveOrder({
        customer_id: customer.id!,
        amount,
        add_on: addOn,
        status: 'pending'
      });
      orderId = order.id!;
    } catch (error) {
      console.log('Supabase not configured, using mock IDs');
    }

    // Here you would integrate with Cashfree
    // For now, we'll return a mock payment response
    
    // In production, you would:
    // 1. Create a Cashfree order
    // 2. Return the payment URL
    // 3. Handle webhook for payment confirmation
    
    const mockPaymentData = {
      order_id: orderId,
      customer_id: customerId,
      payment_url: `/checkout/success?order_id=${orderId}`,
      status: 'pending'
    };

    return NextResponse.json(mockPaymentData);

  } catch (error) {
    console.error('Payment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
