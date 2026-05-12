'use client';

import { useRouter, usePathname } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import { LogOut, Sparkles, UserRound, Shirt } from 'lucide-react';

export default function IconikClubClientShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push('/iconik-club/client/login');
    router.refresh();
  };

  const isLoginPage =
    pathname === '/iconik-club/client/login' || pathname === '/iconik-club/client/auth/callback';

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'var(--font-inter)' }}>
      {!isLoginPage && (
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

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => router.push('/iconik-club/client/outfits')}
              className={`flex items-center gap-1.5 text-xs transition-colors px-3 py-1.5 rounded-lg hover:bg-[#fff0f5] ${
                pathname.startsWith('/iconik-club/client/outfits')
                  ? 'text-[#ff6b9d] bg-[#fff0f5]'
                  : 'text-[#4a2c3e]/50 hover:text-[#4a2c3e]'
              }`}
            >
              <Shirt size={13} />
              <span className="hidden sm:inline">Outfits</span>
            </button>
            <button
              onClick={() => router.push('/iconik-club/client/profile')}
              className={`flex items-center gap-1.5 text-xs transition-colors px-3 py-1.5 rounded-lg hover:bg-[#fff0f5] ${
                pathname.startsWith('/iconik-club/client/profile')
                  ? 'text-[#ff6b9d] bg-[#fff0f5]'
                  : 'text-[#4a2c3e]/50 hover:text-[#4a2c3e]'
              }`}
            >
              <UserRound size={13} />
              <span className="hidden sm:inline">Profile</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs text-[#4a2c3e]/50 hover:text-[#4a2c3e] transition-colors px-3 py-1.5 rounded-lg hover:bg-[#fff0f5]"
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </header>
      )}

      <main>{children}</main>
    </div>
  );
}
