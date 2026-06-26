import { redirect } from 'next/navigation';

type SearchParams = Record<string, string | string[] | undefined>;

interface CheckoutIntakeRedirectPageProps {
  searchParams?: Promise<SearchParams>;
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CheckoutIntakeRedirectPage({
  searchParams,
}: CheckoutIntakeRedirectPageProps) {
  const params = searchParams ? await searchParams : {};
  const targetParams = new URLSearchParams();
  const paymentId = firstParam(params.payment_id);

  if (paymentId) targetParams.set('payment_id', paymentId);
  targetParams.set('redirected_from', 'intake');

  redirect(`/checkout/success?${targetParams.toString()}`);
}
