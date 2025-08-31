import { google } from 'googleapis';

// Initialize Google Sheets API
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

export interface CustomerData {
  timestamp: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  order_amount: number;
  order_id: string;
  customer_id: string;
  payment_status: string;
  scheduled_date?: string;
  scheduled_time?: string;
  session_status?: string;
  add_ons?: string;
  service_type: string;
}

export async function addCustomerToSheet(data: CustomerData) {
  try {
    if (!process.env.GOOGLE_SHEET_ID) {
      console.log('Google Sheet ID not configured, skipping sheet update');
      return { success: false, error: 'Google Sheet not configured' };
    }

    const values = [
      [
        data.timestamp,
        data.customer_name,
        data.customer_email,
        data.customer_phone,
        data.order_amount,
        data.order_id,
        data.customer_id,
        data.payment_status,
        data.scheduled_date || '',
        data.scheduled_time || '',
        data.session_status || '',
        data.add_ons || '',
        data.service_type,
      ],
    ];

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Sheet1!A:M', // Adjust range based on your sheet columns
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values,
      },
    });

    console.log('Customer data added to Google Sheet:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error adding customer to Google Sheet:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function updateSessionInSheet(customerId: string, scheduledDate: string, scheduledTime: string) {
  try {
    if (!process.env.GOOGLE_SHEET_ID) {
      console.log('Google Sheet ID not configured, skipping sheet update');
      return { success: false, error: 'Google Sheet not configured' };
    }

    // First, find the row with the customer ID
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Sheet1!A:M',
    });

    const rows = response.data.values || [];
    let rowIndex = -1;

    // Find the row with matching customer ID (column G)
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][6] === customerId) { // Column G (index 6) contains customer_id
        rowIndex = i + 1; // +1 because sheets are 1-indexed
        break;
      }
    }

    if (rowIndex === -1) {
      console.log('Customer not found in sheet for session update');
      return { success: false, error: 'Customer not found in sheet' };
    }

    // Update the session columns (I and J)
    const updateResponse = await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `Sheet1!I${rowIndex}:J${rowIndex}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[scheduledDate, scheduledTime]],
      },
    });

    console.log('Session data updated in Google Sheet:', updateResponse.data);
    return { success: true, data: updateResponse.data };
  } catch (error) {
    console.error('Error updating session in Google Sheet:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function updatePaymentStatusInSheet(customerId: string, paymentStatus: string) {
  try {
    if (!process.env.GOOGLE_SHEET_ID) {
      console.log('Google Sheet ID not configured, skipping sheet update');
      return { success: false, error: 'Google Sheet not configured' };
    }

    // First, find the row with the customer ID
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Sheet1!A:M',
    });

    const rows = response.data.values || [];
    let rowIndex = -1;

    // Find the row with matching customer ID (column G)
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][6] === customerId) { // Column G (index 6) contains customer_id
        rowIndex = i + 1; // +1 because sheets are 1-indexed
        break;
      }
    }

    if (rowIndex === -1) {
      console.log('Customer not found in sheet for payment status update');
      return { success: false, error: 'Customer not found in sheet' };
    }

    // Update the payment status column (H)
    const updateResponse = await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `Sheet1!H${rowIndex}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[paymentStatus]],
      },
    });

    console.log('Payment status updated in Google Sheet:', updateResponse.data);
    return { success: true, data: updateResponse.data };
  } catch (error) {
    console.error('Error updating payment status in Google Sheet:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
