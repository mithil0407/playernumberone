import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

// Handles the redirect back from Supabase after magic link / OAuth
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code       = searchParams.get('code');
  const explicitTo = searchParams.get('next');

  if (code) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.exchangeCodeForSession(code);

    // If no explicit destination, check onboarding status to avoid showing
    // the onboarding flow to users who have already completed it
    if (!explicitTo) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('client_profiles')
          .select('onboarding_complete')
          .eq('id', user.id)
          .single();
        const destination = profile?.onboarding_complete
          ? '/iconik-club/client/outfits'
          : '/iconik-club/client/onboarding';
        return NextResponse.redirect(new URL(destination, origin));
      }
    }
  }

  const redirectTo = explicitTo ?? '/iconik-club/client/outfits';
  return NextResponse.redirect(new URL(redirectTo, origin));
}
