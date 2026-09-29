import type { Metadata } from 'next';
import Link from 'next/link';
import { BLUEPRINT_OFFER, SUPPORT_EMAIL } from '@/lib/siteFacts';

export const metadata: Metadata = {
  title: 'Checkout reminders | ICONIK',
  robots: { index: false, follow: false },
};

// A confirm button rather than unsubscribing on page load: mail security
// scanners open every link in an email, and would otherwise unsubscribe
// people who never clicked.
export default async function CheckoutRecoveryUnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string; done?: string; error?: string }>;
}) {
  const { t = '', done, error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F4EFE5] px-4 py-16">
      <div className="w-full max-w-md rounded-3xl border border-[#E7DDCB] bg-white p-8 text-center shadow-sm sm:p-10">
        <p className="font-serif text-2xl tracking-[0.4em] text-[#2C2622]">ICONIK</p>
        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.3em] text-[#9A7D4A]">Personal Style Blueprint</p>

        {done ? (
          <>
            <h1 className="mt-8 font-serif text-3xl text-[#2C2622]">You won&apos;t get these again.</h1>
            <p className="mt-4 text-[15px] leading-6 text-[#5E534C]">
              We&apos;ve stopped the checkout reminders for this email address. If you ever buy from us, you&apos;ll still get your order emails.
            </p>
            <Link href={BLUEPRINT_OFFER.offerPath} className="mt-8 inline-block text-sm font-semibold text-[#2C2622] underline underline-offset-4">
              Back to iconik.pro
            </Link>
          </>
        ) : (
          <>
            <h1 className="mt-8 font-serif text-3xl text-[#2C2622]">Stop checkout reminders?</h1>
            <p className="mt-4 text-[15px] leading-6 text-[#5E534C]">
              We&apos;ll stop emailing you about the Blueprint checkout you started. Your saved details stay private.
            </p>
            {error && (
              <p className="mt-4 text-sm text-red-700">
                That link didn&apos;t work. Email {SUPPORT_EMAIL} and we&apos;ll stop the reminders for you.
              </p>
            )}
            <form method="post" action="/api/checkout-recovery/unsubscribe" className="mt-8">
              <input type="hidden" name="t" value={t} />
              <button
                type="submit"
                className="w-full rounded-full bg-[#2C2622] px-6 py-4 text-base font-bold text-[#F4EFE5] transition hover:bg-[#3d3430]"
              >
                Stop the reminders
              </button>
            </form>
            <Link href={BLUEPRINT_OFFER.checkoutPath} className="mt-5 inline-block text-sm font-semibold text-[#2C2622]/70 underline underline-offset-4">
              Actually, take me to checkout
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
