export default function WorkspaceLoading() {
  return <div role="status" aria-label="Loading workspace" className="max-w-[1400px] mx-auto space-y-4">
    <p className="luxury-body text-sm text-[#655E57]">Opening your workspace…</p>
    <div className="h-12 rounded-2xl bg-[#EDE5D2] motion-safe:animate-pulse" aria-hidden="true" />
    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3" aria-hidden="true">
      {Array.from({ length: 6 }, (_, index) => <div key={index} className="h-44 rounded-2xl bg-[#EDE5D2] motion-safe:animate-pulse" />)}
    </div>
  </div>;
}
