export default function WorkspaceLoading() {
  return <div role="status" aria-label="Loading workspace" className="space-y-4">
    <p className="ma-faint text-[14px]">Opening your workspace…</p>
    <div className="ma-skeleton h-10 w-64" aria-hidden="true" />
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
      {Array.from({ length: 6 }, (_, index) => <div key={index} className="ma-skeleton h-48" style={{ borderRadius: 24 }} />)}
    </div>
  </div>;
}
