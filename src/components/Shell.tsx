import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { MobileNav, Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export function Shell() {
  const mainRef = useRef<HTMLElement>(null);
  const { pathname } = useLocation();

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="min-h-[100dvh] w-full p-3 sm:p-4 lg:p-6">
      <div className="app-frame relative mx-auto flex min-h-[calc(100dvh-1.5rem)] w-full max-w-[1640px] overflow-hidden rounded-[26px] sm:min-h-[calc(100dvh-2rem)] lg:h-[calc(100dvh-3rem)] lg:min-h-0">
        <Sidebar />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <TopBar />
          <MobileNav />
          <main ref={mainRef} className="min-h-0 flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
