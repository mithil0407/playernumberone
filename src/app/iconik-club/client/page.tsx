import { redirect } from 'next/navigation';

// /iconik-club/client → send to outfits (outfits page redirects to onboarding if not yet complete)
export default function ClientRootPage() {
  redirect('/iconik-club/client/outfits');
}
