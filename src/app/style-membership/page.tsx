import { redirect } from 'next/navigation';

// The quiz starts at its first screen; query strings (utm_content=reel_…) ride along.
export default async function StyleMembershipEntry({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    if (typeof value === 'string') params.set(key, value);
  }
  const query = params.toString();
  redirect(`/style-membership/quiz/welcome${query ? `?${query}` : ''}`);
}
