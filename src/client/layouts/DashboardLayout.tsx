import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { TopNavbar } from '../components/TopNavbar';
import { getNavItemByPath } from '../config/navigation';

export function DashboardLayout() {
  const { pathname } = useLocation();
  const current = getNavItemByPath(pathname);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="theme-shell flex min-h-screen">
      {sidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={closeSidebar}
          aria-label="Close sidebar overlay"
        />
      ) : null}

      <div
        className={[
          'fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-200 ease-out lg:static lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <Sidebar onNavigate={closeSidebar} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <TopNavbar
          current={current}
          sidebarOpen={sidebarOpen}
          onMenuToggle={() => setSidebarOpen((open) => !open)}
        />
        <main className="flex-1 overflow-auto">
          <div className="theme-main-glow bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-950/20 via-transparent to-transparent px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
