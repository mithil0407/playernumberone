import { google } from 'googleapis';

// Initialize Google Sheets API
const getPrivateKey = () => {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;
  if (!privateKey) return undefined;
  
  // Handle different private key formats
  const formattedKey = privateKey
    .replace(/\\n/g, '\n')  // Replace escaped newlines
    .replace(/"/g, '')       // Remove quotes
    .trim();                // Remove whitespace
  
  console.log('Private key processing:');
  console.log('- Original length:', privateKey.length);
  console.log('- Formatted length:', formattedKey.length);
  console.log('- Starts with:', formattedKey.substring(0, 30));
  console.log('- Ends with:', formattedKey.substring(formattedKey.length - 30));
  
  return formattedKey;
};

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: getPrivateKey(),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

export interface CustomerData {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  order_amount: number;
  order_id: string;
  customer_id: string;
  payment_status: string;
  add_ons?: string;
  service_type: string;
}

export async function addCustomerToSheet(data: CustomerData) {
  try {
    if (!process.env.GOOGLE_SHEET_ID) {
      console.log('Google Sheet ID not configured, skipping sheet update');
      return { success: false, error: 'Google Sheet not configured' };
    }

    // Check if private key is properly formatted
    const privateKey = getPrivateKey();
    if (!privateKey) {
      console.error('Invalid private key format - please check your GOOGLE_PRIVATE_KEY environment variable');
      return { success: false, error: 'Invalid private key format' };
    }

    // Debug environment variables
    console.log('Google Sheets Environment Check:');
    console.log('- Sheet ID configured:', !!process.env.GOOGLE_SHEET_ID);
    console.log('- Service Account configured:', !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
    console.log('- Private Key configured:', !!process.env.GOOGLE_PRIVATE_KEY);
    console.log('- Private Key length:', process.env.GOOGLE_PRIVATE_KEY?.length || 0);
    console.log('- Formatted Private Key length:', privateKey.length);
    console.log('- Private Key starts with:', process.env.GOOGLE_PRIVATE_KEY?.substring(0, 20) || 'N/A');

    const values = [
      [
        data.customer_name,
        data.customer_email,
        data.customer_phone,
        data.order_amount,
        data.order_id,
        data.customer_id,
        data.payment_status,
        data.add_ons || '',
        data.service_type,
      ],
    ];

    console.log('Sending data to Google Sheets:', values[0]);

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Sheet1!A:I', // Updated range for 9 columns (removed timestamp, scheduled_date, scheduled_time, session_status)
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

export async function updateAddOnsInSheet(customerId: string, addOns: string) {
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
      console.log('Customer not found in sheet for add-ons update');
      return { success: false, error: 'Customer not found in sheet' };
    }

    // Update the add-ons column (L)
    const updateResponse = await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `Sheet1!L${rowIndex}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[addOns]],
      },
    });

    console.log('Add-ons updated in Google Sheet:', updateResponse.data);
    return { success: true, data: updateResponse.data };
  } catch (error) {
    console.error('Error updating add-ons in Google Sheet:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
