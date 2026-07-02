import { redirect } from 'next/navigation';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function GlobeIntakeRedirect({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(resolvedSearchParams)) {
    if (Array.isArray(value)) {
      value.forEach(item => {
        if (item != null) params.append(key, item);
      });
    } else if (value != null) {
      params.set(key, value);
    }
  }

  const query = params.toString();
  redirect(`/stylist/intake${query ? `?${query}` : ''}`);
}
