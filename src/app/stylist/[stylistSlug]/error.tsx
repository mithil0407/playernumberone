'use client';

export default function WorkspaceError({ reset }: { reset: () => void }) {
  return <div role="alert" className="rounded-3xl bg-[#EDE5D2] p-8 text-[#2C2622]">
    <h2 className="iconik-display text-2xl">We couldn’t open this workspace</h2>
    <p className="luxury-body text-sm mt-3">Check your connection and try again.</p>
    <button onClick={reset} className="mt-5 rounded-xl bg-[#2C2622] text-[#F4EFE5] px-5 py-3 luxury-body text-sm">Try again</button>
  </div>;
}
