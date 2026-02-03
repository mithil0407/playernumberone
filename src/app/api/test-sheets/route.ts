import { NextRequest, NextResponse } from 'next/server';
import { addCustomerToSheet } from '@/lib/googleSheets';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { test_mode = true, manual_test = false } = body;

    // Debug environment variables
    const envCheck = {
      sheet_id_configured: !!process.env.GOOGLE_SHEET_ID,
      sheet_id_preview: process.env.GOOGLE_SHEET_ID?.substring(0, 10) + '...',
      service_account_configured: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      service_account_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || 'NOT SET',
      private_key_configured: !!process.env.GOOGLE_PRIVATE_KEY,
      private_key_length: process.env.GOOGLE_PRIVATE_KEY?.length || 0,
      private_key_has_begin: process.env.GOOGLE_PRIVATE_KEY?.includes('-----BEGIN PRIVATE KEY-----') || false,
      private_key_has_end: process.env.GOOGLE_PRIVATE_KEY?.includes('-----END PRIVATE KEY-----') || false,
      private_key_has_escaped_newlines: process.env.GOOGLE_PRIVATE_KEY?.includes('\\n') || false,
      private_key_has_actual_newlines: process.env.GOOGLE_PRIVATE_KEY?.includes('\n') || false,
    };

    console.log('Environment Check:', JSON.stringify(envCheck, null, 2));

    if (test_mode || manual_test) {
      // Use provided data for manual test, or default test data
      const testData = manual_test ? {
        customer_name: body.customer_name || 'Manual Test Customer',
        customer_email: body.customer_email || 'manual@example.com',
        customer_phone: body.customer_phone || '1234567890',
        order_amount: body.order_amount || 784,
        order_id: body.order_id || `manual-order-${Date.now()}`,
        customer_id: body.customer_id || `manual-customer-${Date.now()}`,
        payment_status: body.payment_status || 'completed',
        add_ons: body.add_ons || 'Manual Test Add-on',
        service_type: body.service_type || 'ICONIK Style Consultation'
      } : {
        customer_name: 'Test Customer',
        customer_email: 'test@example.com',
        customer_phone: '1234567890',
        order_amount: 784,
        order_id: `test-order-${Date.now()}`,
        customer_id: `test-customer-${Date.now()}`,
        payment_status: 'pending',
        add_ons: 'Shopping Guide, Virtual Outfit Preview',
        service_type: 'ICONIK Style Consultation'
      };

      console.log('Attempting to add test data to Google Sheets:', testData);

      const result = await addCustomerToSheet(testData);

      console.log('Google Sheets result:', result);

      return NextResponse.json({
        success: result.success,
        message: result.success ? 'Test data sent to Google Sheets successfully!' : 'Failed to send data to Google Sheets',
        result,
        test_data: testData,
        environment_check: envCheck
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
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Debug environment variables
  const envCheck = {
    sheet_id_configured: !!process.env.GOOGLE_SHEET_ID,
    sheet_id_preview: process.env.GOOGLE_SHEET_ID ? process.env.GOOGLE_SHEET_ID.substring(0, 10) + '...' : 'NOT SET',
    service_account_configured: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    service_account_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || 'NOT SET',
    private_key_configured: !!process.env.GOOGLE_PRIVATE_KEY,
    private_key_length: process.env.GOOGLE_PRIVATE_KEY?.length || 0,
    private_key_has_begin: process.env.GOOGLE_PRIVATE_KEY?.includes('-----BEGIN PRIVATE KEY-----') || false,
    private_key_has_end: process.env.GOOGLE_PRIVATE_KEY?.includes('-----END PRIVATE KEY-----') || false,
  };

  return NextResponse.json({
    success: true,
    message: 'Google Sheets test endpoint',
    instructions: [
      'Send POST request with { "test_mode": true } to test the integration',
      'Check the environment_check object below to verify your configuration'
    ],
    environment_check: envCheck,
    expected_config: {
      GOOGLE_SHEET_ID: 'Your Google Sheet ID from the URL',
      GOOGLE_SERVICE_ACCOUNT_EMAIL: 'Your service account email (ends with .iam.gserviceaccount.com)',
      GOOGLE_PRIVATE_KEY: 'Full private key including -----BEGIN/END PRIVATE KEY----- markers'
    }
  });
}

