# PlayerNumberOne Alpha1 - Transformation Funnel

A high-conversion landing page funnel with payment integration and scheduling flow for men's transformation coaching.

## Features

- 🎯 **High-Conversion Landing Page**: Emotion-driven copy and design optimized for conversions
- 💳 **Payment Integration**: Razorpay payment gateway integration
- 📅 **Scheduling System**: Post-payment calendar booking with available slots
- 📱 **Mobile-First Design**: Responsive design optimized for mobile users
- 🎨 **Modern UI/UX**: Beautiful animations and smooth interactions
- 🗄️ **Database Backend**: Supabase integration for customer data and orders

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Backend**: Supabase (PostgreSQL)
- **Payment**: Razorpay
- **Hosting**: Vercel (recommended)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Razorpay Configuration (for production)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret

# Google Analytics
NEXT_PUBLIC_GA_ID=your_google_analytics_id

# Meta Pixel
NEXT_PUBLIC_META_PIXEL_ID=your_meta_pixel_id
```

### 3. Supabase Setup

1. Create a new Supabase project
2. Create the following tables:

```sql
-- Customers table
CREATE TABLE customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  customer_email TEXT,
  amount INTEGER NOT NULL,
  add_on BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending',
  payment_id TEXT,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  payment_method TEXT,
  error_code TEXT,
  error_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sessions table
CREATE TABLE sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  order_id UUID REFERENCES orders(id),
  scheduled_date TEXT NOT NULL,
  scheduled_time TEXT NOT NULL,
  status TEXT DEFAULT 'scheduled',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

3. Get your project URL and anon key from Supabase settings

### 3. Razorpay Setup

1. **Create Razorpay Account**: Sign up at [razorpay.com](https://razorpay.com)
2. **Get API Keys**: 
   - Go to Settings → API Keys
   - Generate Key ID and Key Secret
   - Add them to your `.env.local` file
3. **Configure Webhooks**:
   - Go to Settings → Webhooks
   - Create webhook with URL: `https://yourdomain.com/api/payment/webhook`
   - Select events: `payment.captured`, `payment.failed`, `order.paid`
   - Generate webhook secret and add to `.env.local`
4. **Test Integration**:
   - Use test mode for development
   - Switch to live mode for production

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Landing page
│   ├── checkout/
│   │   └── page.tsx          # Payment checkout
│   ├── schedule/
│   │   └── page.tsx          # Session scheduling
│   ├── layout.tsx             # Root layout
│   └── globals.css            # Global styles
├── lib/
│   └── supabase.ts            # Database operations
└── components/                 # Reusable components (future)
```

## User Flow

1. **Landing Page** → High-conversion funnel with emotional copy
2. **Checkout** → Customer information + payment (Razorpay)
3. **Scheduling** → Post-payment calendar booking
4. **Confirmation** → Success page with session details

## Customization

### Landing Page Content
- Update copy in `src/app/page.tsx`
- Modify features, testimonials, and FAQ sections
- Adjust pricing and offers

### Styling
- Customize colors in `tailwind.config.js`
- Modify component styles in individual page files
- Update animations in Framer Motion components

### Payment Integration
- Razorpay integration with secure checkout
- Webhook handling for payment status updates
- Automatic order status management

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables
4. Deploy

### Other Platforms

- **Netlify**: Build command: `npm run build`, Publish directory: `out`
- **Railway**: Follow Next.js deployment guide
- **AWS/GCP**: Use Docker or build commands

## Analytics & Tracking

- **Google Analytics**: Add your GA ID to environment variables
- **Meta Pixel**: Add your Pixel ID for Facebook remarketing
- **Conversion Tracking**: Track payment completions and bookings

## Future Enhancements

- [ ] A/B testing on headlines and CTAs
- [ ] WhatsApp notifications (Twilio API)
- [ ] Referral program
- [ ] Video testimonials
- [ ] Admin dashboard for stylists
- [ ] Email automation (Resend/SendGrid)

## Support

For questions or issues:
1. Check the Supabase documentation
2. Review Next.js and Tailwind CSS docs
3. Open an issue in the repository

## License

This project is proprietary software. All rights reserved.
