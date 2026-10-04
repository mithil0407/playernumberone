'use client';

import Link from 'next/link';
import { RefreshCw, WifiOff } from 'lucide-react';
import { Button } from '@/components/manAdmin/ui';
import '@/components/manAdmin/man-admin.css';
import './agent-admin.css';

export default function AgentAdminError({ reset }: { reset: () => void }) {
  return (
    <div className="ma-root aa-root">
      <header className="ma-glass aa-header"><div className="aa-header__inner"><Link href="/agent/admin" className="aa-brand">ICONIK<span>AGENT</span></Link></div></header>
      <main className="aa-main"><div className="ma-card aa-panel mx-auto mt-12 max-w-lg text-center py-12">
        <span className="aa-empty__icon"><WifiOff size={23} strokeWidth={1.5} /></span>
        <h1 className="ma-h2 mt-5">The dashboard couldn’t load</h1>
        <p className="ma-muted mt-2 mb-6 text-[13px] leading-relaxed">We couldn’t fetch the latest agent activity. Try loading it again.</p>
        <Button variant="primary" icon={<RefreshCw size={15} />} onClick={reset}>Try again</Button>
      </div></main>
    </div>
  );
}
