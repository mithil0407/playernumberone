'use client';

import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import { LogOut, Sparkles } from 'lucide-react';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push('/iconik-club/client/login');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'var(--font-inter)' }}>
      <header className="sticky top-0 z-10 flex items-center justify-between px-5 sm:px-8 py-3.5 border-b border-[#ffb3d1]/60 bg-white/90 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-[#ff6b9d] to-[#e85a8a] rounded-xl flex items-center justify-center shadow-sm shadow-[#ff6b9d]/30">
            <Sparkles size={15} className="text-white" />
          </div>
          <div className="leading-none">
            <p className="text-[11px] font-bold text-[#4a2c3e] tracking-[0.15em] uppercase">Iconik</p>
            <p className="text-[9px] text-[#ff6b9d] tracking-[0.2em] uppercase font-semibold">Club</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-xs text-[#4a2c3e]/50 hover:text-[#4a2c3e] transition-colors px-3 py-1.5 rounded-lg hover:bg-[#fff0f5]"
        >
          <LogOut size={13} />
          Sign out
        </button>
      </header>

      <main>{children}</main>
    </div>
  );
}
