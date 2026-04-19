import { LogOut, Menu, ShieldCheck, Stethoscope } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { Button } from '../ui/Button';

export const Topbar = ({ onMenuClick }) => {
    const { logout, user } = useAuth();
    const { getActiveDoctor, getActiveClinic } = useSettings();

    const activeDoctor = getActiveDoctor();
    const activeClinic = getActiveClinic();
    const todayLabel = new Date().toLocaleDateString('es-MX', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    });

    return (
        <header className="topbar-premium fixed left-0 right-0 top-0 z-30 px-3 pt-3 md:left-[calc(var(--sidebar-width)+0.75rem)] md:px-5 lg:px-6">
            <div className="glass flex h-[4.75rem] items-center justify-between rounded-[1.9rem] border border-white/60 px-4 shadow-[0_20px_50px_-34px_rgba(16,37,35,0.42)] dark:border-white/10 md:px-6">
                <div className="flex min-w-0 items-center gap-3">
                    <button
                        className="rounded-2xl border border-black/5 p-2.5 text-[color:var(--text-secondary)] transition hover:bg-black/[0.04] hover:text-[color:var(--text-primary)] dark:border-white/10 dark:hover:bg-white/[0.06] md:hidden"
                        onClick={onMenuClick}
                    >
                        <Menu className="h-5 w-5" />
                    </button>

                    <div className="min-w-0">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
                            Clinical workspace
                        </p>
                        <div className="mt-1 flex min-w-0 items-center gap-3">
                            <h2 className="truncate text-lg font-semibold text-[color:var(--text-primary)] md:text-xl">
                                {activeClinic?.name || 'ZenMedix Dental'}
                            </h2>
                            <span className="hidden rounded-full border border-black/5 bg-white/70 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[color:var(--text-muted)] dark:border-white/10 dark:bg-white/[0.05] md:inline-flex">
                                {todayLabel}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden items-center gap-3 rounded-[1.25rem] border border-black/5 bg-white/60 px-3 py-2 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] lg:flex">
                        <div className="flex h-10 w-10 items-center justify-center rounded-[1rem] bg-[linear-gradient(135deg,var(--primary-700),var(--primary-500))] text-white shadow-[0_16px_32px_-20px_rgba(15,124,120,0.72)]">
                            <Stethoscope className="h-4 w-4" />
                        </div>
                        <div className="text-sm">
                            <p className="font-semibold text-[color:var(--text-primary)]">{activeDoctor?.name || user?.name || 'Equipo clinico'}</p>
                            <p className="text-xs text-[color:var(--text-muted)]">{activeDoctor?.specialty || 'Operacion premium'}</p>
                        </div>
                    </div>

                    <div className="hidden items-center gap-2 rounded-[1.25rem] border border-black/5 bg-white/60 px-3 py-2 text-sm text-[color:var(--text-secondary)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] sm:flex">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                        <span className="font-medium">Sistema activo</span>
                    </div>

                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={logout}
                        title="Cerrar sesion"
                        className="min-w-10 px-3"
                    >
                        <LogOut className="h-4 w-4" />
                        <span className="hidden md:inline">Salir</span>
                    </Button>
                </div>
            </div>
        </header>
    );
};
