import { redirect } from 'next/navigation';

// Iconik Closet is retired — redirect to Iconik Club's success page
export default function ClosetSuccessPage() {
  redirect('/iconik-club/join/success');
}
