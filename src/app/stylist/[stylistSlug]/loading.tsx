export default function WorkspaceLoading() {
  return <div role="status" aria-label="Loading workspace" className="max-w-[1550px] mx-auto space-y-4">
    <div className="rounded-3xl bg-[#EDE5D2] p-7"><p className="luxury-body text-sm text-[#746D65]">Opening your workspace…</p></div>
    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4" aria-hidden="true">
      {Array.from({ length: 6 }, (_, index) => <div key={index} className="h-64 rounded-2xl bg-[#EDE5D2] motion-safe:animate-pulse" />)}
    </div>
  </div>;
}
