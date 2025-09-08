# Google Sheets Integration Setup Guide

## Overview
This integration automatically stores customer data in Google Sheets when:
1. **Payment is made** - Customer details, order info, and payment status
2. **Session is booked** - Session date and time are added to the customer's row

## Step 1: Create Google Service Account

### 1.1 Go to Google Cloud Console
- Visit [Google Cloud Console](https://console.cloud.google.com/)
- Create a new project or select existing project

### 1.2 Enable Google Sheets API
- Go to "APIs & Services" > "Library"
- Search for "Google Sheets API"
- Click "Enable"

### 1.3 Create Service Account
- Go to "APIs & Services" > "Credentials"
- Click "Create Credentials" > "Service Account"
- Fill in:
  - **Service account name**: `iconone-sheets-integration`
  - **Description**: `Service account for IconOne customer data`
- Click "Create and Continue"
- Skip role assignment (click "Continue")
- Click "Done"

### 1.4 Generate Service Account Key
- Click on your service account
- Go to "Keys" tab
- Click "Add Key" > "Create new key"
- Choose "JSON" format
- Download the JSON file

## Step 2: Create Google Sheet

### 2.1 Create New Sheet
- Go to [Google Sheets](https://sheets.google.com/)
- Create a new spreadsheet
- Name it: `IconOne Customer Data`

### 2.2 Set Up Headers
Add these headers in row 1:
```
A: Timestamp | B: Customer Name | C: Customer Email | D: Customer Phone | E: Order Amount | F: Order ID | G: Customer ID | H: Payment Status | I: Scheduled Date | J: Scheduled Time | K: Session Status | L: Add-ons | M: Service Type
```

### 2.3 Share Sheet with Service Account
- Click "Share" button
- Add the service account email (from the JSON file) as an "Editor"
- The email looks like: `iconone-sheets-integration@project-id.iam.gserviceaccount.com`

## Step 3: Configure Environment Variables

Add these to your `.env.local` file:

```env
# Google Sheets Configuration
GOOGLE_SHEET_ID=your_sheet_id_here
GOOGLE_SERVICE_ACCOUNT_EMAIL=iconone-sheets-integration@your-project-id.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key from JSON file\n-----END PRIVATE KEY-----\n"
```

### 3.1 Get Sheet ID
- Open your Google Sheet
- Copy the ID from the URL: `https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID_HERE/edit`

### 3.2 Get Service Account Details
- Open the downloaded JSON file
- Copy the `client_email` value
- Copy the `private_key` value (keep the quotes and newlines)

## Step 4: Test the Integration

### 4.1 Test Payment Flow
1. Make a test payment
2. Check your Google Sheet - a new row should appear with customer data
3. Payment status should be "pending"

### 4.2 Test Session Booking
1. Book a session after payment
2. Check your Google Sheet - the session date/time should be added to the customer's row

### 4.3 Test Payment Completion
1. Complete a payment (use test mode)
2. Check your Google Sheet - payment status should update to "completed"

## Data Flow

### When Payment is Made:
```
Timestamp | Customer Name | Email | Phone | Amount | Order ID | Customer ID | Payment Status | Scheduled Date | Scheduled Time | Session Status | Add-ons | Service Type
2024-01-15T10:30:00Z | John Doe | john@email.com | 1234567890 | 2197 | order-123 | customer-456 | pending | | | | Shopping Guide, Wellness Plan | IconOne Style Consultation
```

### When Session is Booked:
```
Timestamp | Customer Name | Email | Phone | Amount | Order ID | Customer ID | Payment Status | Scheduled Date | Scheduled Time | Session Status | Add-ons | Service Type
2024-01-15T10:30:00Z | John Doe | john@email.com | 1234567890 | 2197 | order-123 | customer-456 | pending | Sep 1, 2025 | 10:30 AM | scheduled | Shopping Guide, Wellness Plan | IconOne Style Consultation
```

### When Payment is Completed:
```
Timestamp | Customer Name | Email | Phone | Amount | Order ID | Customer ID | Payment Status | Scheduled Date | Scheduled Time | Session Status | Add-ons | Service Type
2024-01-15T10:30:00Z | John Doe | john@email.com | 1234567890 | 2197 | order-123 | customer-456 | completed | Sep 1, 2025 | 10:30 AM | scheduled | Shopping Guide, Wellness Plan | IconOne Style Consultation
```

## Troubleshooting

### Common Issues:

1. **"Google Sheet not configured" error**
   - Check environment variables are set correctly
   - Verify sheet ID is correct
   - Ensure service account has access to the sheet

2. **"Customer not found in sheet" error**
   - Customer data wasn't added during payment
   - Check payment API logs
   - Verify Google Sheets API is enabled

3. **Permission denied errors**
   - Ensure service account email has "Editor" access to the sheet
   - Check the service account JSON file is correct

4. **Private key format issues**
   - Make sure private key includes `\n` characters
   - Keep the quotes around the private key in .env

### Debug Steps:
1. Check Vercel logs for Google Sheets API errors
2. Verify environment variables in Vercel dashboard
3. Test API endpoints manually
4. Check Google Cloud Console for API usage

## Security Notes

- Keep your service account JSON file secure
- Never commit it to version control
- Use environment variables for all sensitive data
- Regularly rotate service account keys
- Monitor API usage in Google Cloud Console

## Cost Considerations

- Google Sheets API has quotas but is generally free for this usage
- Monitor usage in Google Cloud Console
- Set up billing alerts if needed

