const INK = '#2C2622';
const IVORY = '#F4EFE5';
const BONE = '#EDE5D2';
const PAPER = '#F8F3E9';
const SLATE = '#94A6AD';
const SLATE_DEEP = '#7E9098';
const GOLD = '#c9a96e';
const ROSE = '#D4537E';

export default function Loading() {
  return (
    <main className="min-h-screen flex items-center justify-center px-5 py-10" style={{ background: IVORY, color: INK }}>
      <section
        className="relative w-full max-w-[760px] overflow-hidden rounded-[24px] border shadow-2xl"
        style={{ background: PAPER, borderColor: BONE, boxShadow: '0 28px 80px rgba(44,38,34,0.18)' }}
      >
        <div className="px-8 py-7 text-center" style={{ background: INK, color: IVORY }}>
          <div className="text-[13px] uppercase tracking-[0.34em]">I C O N I K</div>
          <div className="mt-2 text-[10px] uppercase tracking-[0.24em]" style={{ color: GOLD }}>Style Blueprint</div>
        </div>

        <div className="grid gap-8 px-8 py-10 md:grid-cols-[0.92fr_1.08fr] md:px-12 md:py-12">
          <div
            className="min-h-[360px] rounded-[20px] p-8 text-center"
            style={{
              background: `radial-gradient(ellipse 120% 80% at 25% 10%, #A0B2B9 0%, ${SLATE} 45%, ${SLATE_DEEP} 100%)`,
              color: IVORY,
            }}
          >
            <div className="mx-auto mb-10 h-px w-32" style={{ background: 'rgba(244,239,229,0.55)' }} />
            <div className="text-[10px] uppercase tracking-[0.26em]" style={{ color: 'rgba(244,239,229,0.78)' }}>
              A Personal Blueprint
            </div>
            <div className="mt-10 space-y-3">
              <div className="mx-auto h-10 w-56 rounded-full animate-pulse" style={{ background: 'rgba(244,239,229,0.26)' }} />
              <div className="mx-auto h-10 w-40 rounded-full animate-pulse" style={{ background: 'rgba(244,239,229,0.2)' }} />
            </div>
            <div className="mx-auto mt-12 h-px w-24" style={{ background: 'rgba(244,239,229,0.45)' }} />
          </div>

          <div className="flex flex-col justify-center">
            <div className="text-[10px] uppercase tracking-[0.28em]" style={{ color: SLATE_DEEP }}>
              Private report
            </div>
            <h1 className="mt-4 text-[34px] leading-[1.05] md:text-[44px]" style={{ fontFamily: 'var(--font-fraunces), Georgia, serif', fontWeight: 300 }}>
              Preparing your <span style={{ color: ROSE, fontStyle: 'italic' }}>Blueprint.</span>
            </h1>
            <p className="mt-5 max-w-md text-sm leading-7" style={{ color: 'rgba(44,38,34,0.68)' }}>
              Loading your private style report and securing the visual pages.
            </p>

            <div className="mt-8 space-y-3">
              {[0, 1, 2].map(index => (
                <div key={index} className="grid grid-cols-[88px_1fr] gap-3 rounded-xl border p-3" style={{ borderColor: BONE }}>
                  <div className="h-16 rounded-lg animate-pulse" style={{ background: index === 0 ? SLATE : BONE }} />
                  <div className="space-y-2 pt-1">
                    <div className="h-3 w-24 rounded-full animate-pulse" style={{ background: BONE }} />
                    <div className="h-3 w-full rounded-full animate-pulse" style={{ background: BONE }} />
                    <div className="h-3 w-3/4 rounded-full animate-pulse" style={{ background: BONE }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
