import { Link, useLocation } from 'react-router-dom';
import {
    Activity,
    Calendar,
    ChevronLeft,
    ChevronRight,
    LayoutDashboard,
    Settings,
    Users,
    X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { preloadRoute } from '../../lib/routeRegistry';

function ToothMark({ compact = false }) {
    return (
        <div className={`relative overflow-hidden rounded-[1.4rem] border border-white/60 bg-white/70 shadow-[0_18px_45px_-30px_rgba(16,37,35,0.42)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.05] ${compact ? 'h-12 w-12' : 'h-14 w-14'}`}>
            <svg className="h-full w-full p-2.5" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                    d="M50 8C35 8 25 15 20 25C15 35 15 50 18 65C21 80 28 92 32 92C36 92 40 82 44 75C47 70 50 68 50 68C50 68 53 70 56 75C60 82 64 92 68 92C72 92 79 80 82 65C85 50 85 35 80 25C75 15 65 8 50 8Z"
                    stroke="url(#toothGradSidebarPremium)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M55 30C65 35 68 50 60 60C52 70 40 65 38 55C36 45 45 40 52 45C58 50 55 58 50 58"
                    stroke="url(#toothGradSidebarPremium)"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <defs>
                    <linearGradient id="toothGradSidebarPremium" x1="8%" y1="0%" x2="92%" y2="100%">
                        <stop offset="0%" stopColor="#0f7c78" />
                        <stop offset="55%" stopColor="#39b2a5" />
                        <stop offset="100%" stopColor="#caa879" />
                    </linearGradient>
                </defs>
            </svg>
        </div>
    );
}

export const Sidebar = ({ collapsed, onToggle, mobileOpen, onMobileClose }) => {
    const location = useLocation();
    const { user } = useAuth();
    const { getActiveClinic } = useSettings();

    const activeClinic = getActiveClinic();

    const ROLES = {
        SUPER_ADMIN: 'superadmin',
        MEDICO: 'medico',
        RECEPCION: 'recepcion',
    };

    const allMenuItems = [
        { label: 'Dashboard', caption: 'Visibilidad ejecutiva', path: '/', icon: LayoutDashboard, allowedRoles: [ROLES.SUPER_ADMIN, ROLES.MEDICO] },
        { label: 'Pacientes', caption: 'Expediente y seguimiento', path: '/pacientes', icon: Users, allowedRoles: [ROLES.SUPER_ADMIN, ROLES.MEDICO] },
        { label: 'Citas', caption: 'Agenda y ocupacion', path: '/citas', icon: Calendar, allowedRoles: [ROLES.SUPER_ADMIN, ROLES.MEDICO, ROLES.RECEPCION] },
        { label: 'Auditoria', caption: 'Trazabilidad clinica', path: '/auditoria', icon: Activity, allowedRoles: [ROLES.SUPER_ADMIN, ROLES.MEDICO] },
        { label: 'Configuracion', caption: 'Operacion y marca', path: '/configuracion', icon: Settings, allowedRoles: [ROLES.SUPER_ADMIN, ROLES.MEDICO] },
    ];

    const menuItems = user?.role
        ? allMenuItems.filter((item) => item.allowedRoles.includes(user.role))
        : allMenuItems;

    const isActive = (path) => {
        if (path === '/' && location.pathname === '/') return true;
        return path !== '/' && location.pathname.startsWith(path);
    };

    const shellWidth = collapsed ? 'w-24' : 'w-[18.5rem]';

    return (
        <>
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/35 backdrop-blur-sm md:hidden"
                    onClick={onMobileClose}
                />
            )}

            <aside
                className={`
                    ${shellWidth}
                    sidebar-premium fixed inset-y-3 left-3 z-40 flex flex-col rounded-[2rem]
                    border border-white/60 px-3 py-3 transition-all duration-300
                    ${mobileOpen ? 'translate-x-0' : '-translate-x-[120%]'}
                    md:translate-x-0
                `}
            >
                <div className={`flex items-start ${collapsed ? 'justify-center' : 'justify-between'} gap-3 px-1 pb-4`}>
                    <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
                        <ToothMark compact={collapsed} />
                        {!collapsed && (
                            <div className="min-w-0">
                                <p className="section-kicker">Premium Care OS</p>
                                <h1 className="mt-3 font-display text-[2rem] leading-none text-[color:var(--text-primary)]">
                                    ZenMedix
                                </h1>
                                <p className="mt-1 text-sm text-[color:var(--text-muted)]">
                                    Dental command center
                                </p>
                            </div>
                        )}
                    </div>

                    {!collapsed && (
                        <button
                            className="rounded-2xl border border-black/5 p-2 text-[color:var(--text-muted)] transition hover:bg-black/[0.04] hover:text-[color:var(--text-primary)] dark:border-white/10 dark:hover:bg-white/[0.06] md:hidden"
                            onClick={onMobileClose}
                        >
                            <X className="h-5 w-5" />
                        </button>
                    )}
                </div>

                {!collapsed && (
                    <div className="mb-4 rounded-[1.6rem] border border-white/60 bg-white/55 px-4 py-4 shadow-[0_22px_45px_-34px_rgba(16,37,35,0.4)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.04]">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
                            Clinica activa
                        </p>
                        <p className="mt-2 text-base font-semibold text-[color:var(--text-primary)]">
                            {activeClinic?.name || 'ZenMedix Dental'}
                        </p>
                        <p className="mt-1 text-sm text-[color:var(--text-muted)]">
                            {activeClinic?.address || 'Operacion premium para recepcion y gabinete'}
                        </p>
                    </div>
                )}

                <nav className="flex-1 space-y-2 overflow-y-auto px-1">
                    {!collapsed && (
                        <p className="px-3 pb-1 text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
                            Workspace
                        </p>
                    )}
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.path);

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={onMobileClose}
                                onMouseEnter={() => preloadRoute(item.path)}
                                onFocus={() => preloadRoute(item.path)}
                                title={collapsed ? item.label : undefined}
                                className={`
                                    group flex items-center gap-3 rounded-[1.4rem] border px-3 py-3 transition-all duration-200
                                    ${active
                                        ? 'nav-active border-[color:var(--border-strong)]'
                                        : 'border-transparent text-[color:var(--text-secondary)] hover:border-black/5 hover:bg-white/55 hover:text-[color:var(--text-primary)] dark:hover:border-white/10 dark:hover:bg-white/[0.05]'
                                    }
                                    ${collapsed ? 'justify-center px-2.5' : ''}
                                `}
                            >
                                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[1rem] ${active ? 'bg-white/70 dark:bg-white/[0.08]' : 'bg-black/[0.03] dark:bg-white/[0.04]'}`}>
                                    <Icon className={`h-5 w-5 ${active ? 'text-primary' : ''}`} />
                                </span>
                                {!collapsed && (
                                    <span className="min-w-0">
                                        <span className="block text-sm font-semibold">{item.label}</span>
                                        <span className="block truncate text-xs text-[color:var(--text-muted)]">{item.caption}</span>
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className={`mt-4 space-y-3 ${collapsed ? 'items-center' : ''}`}>
                    {!collapsed ? (
                        <div className="rounded-[1.55rem] border border-white/60 bg-white/60 px-4 py-4 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04]">
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
                                Sesion
                            </p>
                            <p className="mt-2 text-sm font-semibold text-[color:var(--text-primary)]">
                                {user?.name || 'Equipo ZenMedix'}
                            </p>
                            <div className="mt-2 flex items-center justify-between gap-3">
                                <span className="rounded-full border border-black/5 bg-white/70 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[color:var(--text-muted)] dark:border-white/10 dark:bg-white/[0.05]">
                                    {user?.role || 'staff'}
                                </span>
                                <span className="text-xs text-[color:var(--text-muted)]">Operativo</span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex justify-center">
                            <ToothMark compact />
                        </div>
                    )}

                    <button
                        onClick={onToggle}
                        className="hidden w-full items-center justify-center gap-2 rounded-[1.3rem] border border-black/5 bg-white/55 px-4 py-3 text-sm font-semibold text-[color:var(--text-secondary)] transition hover:bg-white/80 hover:text-[color:var(--text-primary)] dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] md:flex"
                        title={collapsed ? 'Expandir' : 'Colapsar'}
                    >
                        {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
                        {!collapsed && <span>Compactar menu</span>}
                    </button>
                </div>
            </aside>
        </>
    );
};
