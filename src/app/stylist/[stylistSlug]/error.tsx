'use client';

export default function WorkspaceError({ reset }: { reset: () => void }) {
  return <div role="alert" className="ma-card px-6 py-12 text-center">
    <h2 className="ma-h2">We couldn’t open this workspace</h2>
    <p className="ma-muted mt-1 text-[14px]">Check your connection and try again.</p>
    <button type="button" onClick={reset} className="ma-btn ma-btn--dark mt-5">Try again</button>
  </div>;
}
