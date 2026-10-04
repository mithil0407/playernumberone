import type { Metadata } from 'next';
import Link from 'next/link';
import { SUPPORT_EMAIL } from '@/lib/siteFacts';

export const metadata: Metadata = {
  title: 'Colour emails | ICONIK',
  robots: { index: false, follow: false },
};

// A confirm button rather than unsubscribing on page load: mail security
// scanners open every link in an email, and would otherwise unsubscribe
// people who never clicked.
export default async function ColourScanUnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string; done?: string; error?: string }>;
}) {
  const { t = '', done, error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F5F3EE] px-4 py-16 text-[#111315]" style={{ fontFamily: 'var(--font-manrope), system-ui, sans-serif' }}>
      <div className="w-full max-w-md rounded-[28px] border border-white/70 bg-white/70 p-8 text-center shadow-[0_24px_80px_rgba(17,19,21,0.11)] backdrop-blur-xl sm:p-10">
        <p className="text-lg font-semibold tracking-[0.42em]">ICONIK</p>
        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.3em] text-[#6A1F2B]">Your colour analysis</p>

        {done ? (
          <>
            <h1 className="mt-8 text-3xl font-bold tracking-[-0.04em]">You won&apos;t get these again.</h1>
            <p className="mt-4 text-[15px] leading-6 text-[#111315]/65">
              We&apos;ve stopped the colour emails for this address. Your free result is still yours to keep.
            </p>
            <Link href="/" className="mt-8 inline-block text-sm font-semibold underline underline-offset-4">
              Back to iconik.pro
            </Link>
          </>
        ) : (
          <>
            <h1 className="mt-8 text-3xl font-bold tracking-[-0.04em]">Stop the colour emails?</h1>
            <p className="mt-4 text-[15px] leading-6 text-[#111315]/65">
              We&apos;ll stop the short notes about wearing your colours. Your free result stays private and yours to keep.
            </p>
            {error && (
              <p className="mt-4 text-sm text-red-700">
                That link didn&apos;t work. Email {SUPPORT_EMAIL} and we&apos;ll stop them for you.
              </p>
            )}
            <form method="post" action="/api/colour-scan-nurture/unsubscribe" className="mt-8">
              <input type="hidden" name="t" value={t} />
              <button type="submit" className="w-full rounded-full bg-[#6A1F2B] px-6 py-4 text-base font-bold text-[#F5F3EE] shadow-[0_14px_38px_rgba(106,31,43,0.22)] transition hover:-translate-y-0.5">
                Stop the emails
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
