import { Suspense, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { PageLoader } from '../ui/RouteLoader';

export const DashboardLayout = () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <div
            className="relative min-h-screen overflow-x-clip transition-theme"
            style={{ '--sidebar-width': sidebarCollapsed ? '5.5rem' : '18.5rem' }}
        >
            <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
                <div className="absolute left-[-8rem] top-[-6rem] h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(15,124,120,0.22),transparent_70%)] blur-3xl" />
                <div className="absolute right-[-7rem] top-28 h-80 w-80 rounded-full bg-[radial-gradient(circle,_rgba(183,138,87,0.18),transparent_70%)] blur-3xl" />
                <div className="absolute bottom-[-8rem] left-1/3 h-96 w-96 rounded-full bg-[radial-gradient(circle,_rgba(15,124,120,0.12),transparent_72%)] blur-3xl" />
            </div>

            <Sidebar
                collapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed((current) => !current)}
                mobileOpen={mobileMenuOpen}
                onMobileClose={() => setMobileMenuOpen(false)}
            />
            <Topbar
                sidebarCollapsed={sidebarCollapsed}
                onMenuClick={() => setMobileMenuOpen(true)}
            />

            <main className="min-h-screen px-3 pb-8 pt-24 transition-all duration-300 md:pl-[calc(var(--sidebar-width)+1rem)] md:pr-5 lg:pr-6">
                <div className="mx-auto w-full max-w-[1680px]">
                    <Suspense fallback={<PageLoader />}>
                        <Outlet context={{ sidebarCollapsed }} />
                    </Suspense>
                </div>
            </main>
        </div>
    );
};
