import '@/components/manAdmin/man-admin.css';
import './agent-admin.css';

export default function AgentAdminLoading() {
  return (
    <div className="ma-root aa-root" role="status" aria-label="Loading agent dashboard">
      <header className="ma-glass aa-header"><div className="aa-header__inner"><span className="aa-brand">ICONIK<span>AGENT</span></span><div className="ma-skeleton h-8 w-72 rounded-full" /></div></header>
      <main className="aa-main">
        <div className="mb-8 space-y-3"><div className="ma-skeleton h-3 w-40" /><div className="ma-skeleton h-9 w-full max-w-96" /><div className="ma-skeleton h-3 w-full max-w-80" /></div>
        <div className="aa-section">
          <div className="aa-metrics">{Array.from({ length: 4 }).map((_, index) => <div className="ma-card aa-metric" key={index}><div className="ma-skeleton h-3 w-24" /><div className="ma-skeleton mt-7 h-8 w-20" /><div className="ma-skeleton mt-4 h-3 w-full" /></div>)}</div>
          <div className="aa-overview-grid"><div className="ma-card aa-panel"><div className="ma-skeleton h-4 w-40" /><div className="ma-skeleton mt-8 h-64 w-full" /></div><div className="ma-card aa-panel space-y-7">{Array.from({ length: 5 }).map((_, index) => <div className="ma-skeleton h-5 w-full" key={index} />)}</div></div>
        </div>
        <span className="sr-only">Loading your agent’s activity.</span>
      </main>
    </div>
  );
}
