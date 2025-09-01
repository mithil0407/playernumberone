import { NextRequest, NextResponse } from 'next/server';
import { addCustomerToSheet } from '@/lib/googleSheets';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { test_mode = true } = body;

    if (test_mode) {
      // Test data
      const testData = {
        timestamp: new Date().toISOString(),
        customer_name: 'Test Customer',
        customer_email: 'test@example.com',
        customer_phone: '1234567890',
        order_amount: 784,
        order_id: 'test-order-123',
        customer_id: 'test-customer-456',
        payment_status: 'pending',
        add_ons: 'Shopping Guide',
        service_type: 'IconOne Style Consultation'
      };

      const result = await addCustomerToSheet(testData);

      return NextResponse.json({
        success: true,
        message: 'Test data sent to Google Sheets',
        result,
        test_data: testData,
        google_sheets_configured: !!process.env.GOOGLE_SHEET_ID,
        environment_variables: {
          sheet_id_configured: !!process.env.GOOGLE_SHEET_ID,
          service_account_configured: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
          private_key_configured: !!process.env.GOOGLE_PRIVATE_KEY
        }
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Test mode required'
    });

  } catch (error) {
    console.error('Test sheets API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Google Sheets test endpoint',
    instructions: 'Send POST request with { "test_mode": true } to test integration',
    environment_check: {
      sheet_id_configured: !!process.env.GOOGLE_SHEET_ID,
      service_account_configured: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key_configured: !!process.env.GOOGLE_PRIVATE_KEY
    }
  });
}
