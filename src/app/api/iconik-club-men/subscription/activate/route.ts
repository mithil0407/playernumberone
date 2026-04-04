import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendMenClubWelcomeEmail } from '@/lib/emailMen';

function generateTempPassword(length = 10): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(request: NextRequest) {
  try {
    const { subscription_id, customer_email, customer_name, customer_phone } = await request.json();

    if (!subscription_id || !customer_email) {
      return NextResponse.json(
        { success: false, error: 'Missing subscription_id or customer_email' },
        { status: 400 }
      );
    }

    const resolvedName  = customer_name  || customer_email.split('@')[0];
    const resolvedPhone = customer_phone || '';

    // Idempotency — skip if men_client_profile already exists
    const { data: existingProfile } = await supabaseAdmin
      .from('men_client_profiles')
      .select('id')
      .eq('email', customer_email)
      .maybeSingle();

    if (existingProfile) {
      console.log(`Men client profile already exists for ${customer_email}, skipping`);
      return NextResponse.json({ success: true, already_exists: true });
    }

    // Fetch DB subscription row
    const { data: dbSub } = await supabaseAdmin
      .from('subscriptions')
      .select('id')
      .eq('razorpay_subscription_id', subscription_id)
      .maybeSingle();

    // Mark subscription active
    await supabaseAdmin
      .from('subscriptions')
      .update({ status: 'active', start_date: new Date().toISOString() })
      .eq('razorpay_subscription_id', subscription_id);

    // Create Supabase auth user (same auth project — shared with women's club)
    const tempPassword = generateTempPassword();
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email:         customer_email,
      password:      tempPassword,
      email_confirm: true,
    });

    if (authError || !authData?.user) {
      console.error('Error creating auth user:', authError);
      return NextResponse.json({ success: false, error: 'Failed to create account' }, { status: 500 });
    }

    const userId = authData.user.id;

    // Create men_client_profile row
    const { error: profileError } = await supabaseAdmin
      .from('men_client_profiles')
      .insert({
        user_id:             userId,
        name:                resolvedName,
        email:               customer_email,
        phone:               resolvedPhone,
        subscription_id:     dbSub?.id ?? null,
        onboarding_complete: false,
      });

    if (profileError) {
      console.error('Error creating men_client_profile:', profileError);
    }

    // Send welcome email with credentials
    await sendMenClubWelcomeEmail(resolvedName, customer_email, tempPassword);
    console.log(`Men Club welcome email sent to ${customer_email}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Men subscription activate error:', error);
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}
