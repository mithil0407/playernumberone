/**
 * Shown while the report loads. It is drawn as the report's own cover (ink
 * page, slate panel, the same running head and centred rule) so the real cover
 * replaces it in place. The previous ivory "Preparing your Blueprint" card was a
 * different design, and swapping from it to the dark report read as a glitch.
 */
const INK = '#2C2622';
const IVORY = '#F4EFE5';

export default function Loading() {
  return (
    <main className="min-h-screen min-h-dvh md:p-5" style={{ background: INK }} aria-busy="true" aria-label="Opening your Blueprint">
      <section
        className="relative mx-auto flex max-w-[1060px] items-center justify-center overflow-hidden md:rounded-[20px]"
        style={{
          minHeight: 'max(780px, calc(100svh - 40px))',
          background: 'radial-gradient(ellipse 120% 80% at 25% 10%, #A0B2B9 0%, #94A6AD 45%, #7E9098 100%)',
          color: IVORY,
          fontFamily: 'var(--font-manrope), Manrope, ui-sans-serif, system-ui, sans-serif',
        }}
      >
        <div className="absolute left-5 top-5 md:left-14 md:top-10 text-[13px] tracking-[0.42em]" style={{ opacity: 0.85 }}>I C O N I K</div>
        <div className="w-full max-w-[720px] px-6 text-center" style={{ transform: 'translateY(-14px)' }}>
          <div className="flex items-center gap-4">
            <span className="h-px flex-1" style={{ background: 'rgba(244,239,229,0.35)' }} />
            <span className="text-[10px] uppercase tracking-[0.3em]" style={{ opacity: 0.75 }}>A personal blueprint</span>
            <span className="h-px flex-1" style={{ background: 'rgba(244,239,229,0.35)' }} />
          </div>
          <div className="mx-auto mt-8 h-12 w-[min(78%,420px)] rounded-full motion-safe:animate-pulse" style={{ background: 'rgba(244,239,229,0.16)' }} />
          <div className="mx-auto mt-6 h-3 w-40 rounded-full motion-safe:animate-pulse" style={{ background: 'rgba(244,239,229,0.12)' }} />
        </div>
      </section>
    </main>
  );
}
