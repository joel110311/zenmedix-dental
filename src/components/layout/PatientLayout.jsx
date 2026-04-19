import { Suspense, useEffect, useEffectEvent, useState } from 'react';
import { Outlet, NavLink, useNavigate, useParams } from 'react-router-dom';
import {
    Activity,
    ArrowLeft,
    ClipboardList,
    Clock,
    DollarSign,
    FileText,
    FlaskConical,
    Printer,
    User,
} from 'lucide-react';
import { usePatient } from '../../context/PatientContext';
import { preloadRoute } from '../../lib/routeRegistry';
import { Spinner } from '../ui/Spinner';
import { Button } from '../ui/Button';
import { PageLoader } from '../ui/RouteLoader';

export const PatientLayout = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { activePatient, refreshPatient } = usePatient();
    const [loading, setLoading] = useState(!activePatient || activePatient.id !== id);

    const loadData = useEffectEvent(async () => {
        try {
            setLoading(true);
            await refreshPatient(id);
        } catch (error) {
            console.error('Error loading patient:', error);
            navigate('/pacientes');
        } finally {
            setLoading(false);
        }
    });

    useEffect(() => {
        if (!activePatient || activePatient.id !== id) {
            loadData();
        } else {
            setLoading(false);
        }
    }, [activePatient, id]);

    if (loading) {
        return <div className="flex h-full items-center justify-center"><Spinner size="lg" /></div>;
    }

    const birthDate = activePatient?.dob ? new Date(activePatient.dob) : null;
    const age = birthDate
        ? new Date().getFullYear() - birthDate.getFullYear()
        : '-';

    const menuItems = [
        { label: 'Datos Personales', note: 'Resumen y contexto', path: `/pacientes/${id}/resumen`, icon: User },
        { label: 'Antecedentes', note: 'Riesgo y seguimiento', path: `/pacientes/${id}/antecedentes`, icon: Activity },
        { label: 'Historial Consultas', note: 'Linea clinica', path: `/pacientes/${id}/historial`, icon: Clock },
        { label: 'Nueva Consulta', note: 'Registro de atencion', path: `/pacientes/${id}/consulta/nueva`, icon: FileText },
        { label: 'Odontograma', note: 'Mapa dental', path: `/pacientes/${id}/odontograma`, icon: ClipboardList },
        { label: 'Presupuestos', note: 'Tratamientos y valor', path: `/pacientes/${id}/presupuestos`, icon: DollarSign },
        { label: 'Analisis Clinicos', note: 'Adjuntos y resultados', path: `/pacientes/${id}/analisis`, icon: FlaskConical },
        { label: 'Historia Completa', note: 'Version imprimible', path: `/imprimir/historia/${id}`, icon: Printer },
    ];

    return (
        <div className="-m-3 md:-m-4 lg:-m-5">
            <div className="grid min-h-[calc(100vh-7rem)] gap-4 lg:grid-cols-[19rem_minmax(0,1fr)]">
                <aside className="glass rounded-[2rem] border border-white/60 p-3 shadow-[0_28px_60px_-36px_rgba(16,37,35,0.35)] dark:border-white/10">
                    <div className="rounded-[1.8rem] border border-black/5 bg-white/55 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="-ml-2 mb-4"
                            onClick={() => navigate('/pacientes')}
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Volver
                        </Button>

                        <div className="flex items-center gap-3">
                            <div className="flex h-14 w-14 items-center justify-center rounded-[1.4rem] bg-[linear-gradient(135deg,var(--primary-700),var(--primary-500))] text-lg font-bold text-white shadow-[0_22px_40px_-24px_rgba(15,124,120,0.72)]">
                                {activePatient.firstName?.[0]}{activePatient.lastName?.[0]}
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
                                    Paciente activo
                                </p>
                                <h2 className="mt-1 truncate text-xl font-semibold text-[color:var(--text-primary)]">
                                    {activePatient.firstName} {activePatient.lastName}
                                </h2>
                                <p className="mt-1 text-sm text-[color:var(--text-muted)]">
                                    {age} anos · ID {activePatient.dni || activePatient.id}
                                </p>
                            </div>
                        </div>
                    </div>

                    <nav className="mt-4 space-y-2">
                        {menuItems.map((item) => {
                            const Icon = item.icon;

                            return (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    onMouseEnter={() => preloadRoute(item.path)}
                                    onFocus={() => preloadRoute(item.path)}
                                    className={({ isActive }) => `
                                        flex items-center gap-3 rounded-[1.35rem] border px-3 py-3 transition-all duration-200
                                        ${isActive
                                            ? 'nav-active border-[color:var(--border-strong)]'
                                            : 'border-transparent text-[color:var(--text-secondary)] hover:border-black/5 hover:bg-white/55 hover:text-[color:var(--text-primary)] dark:hover:border-white/10 dark:hover:bg-white/[0.04]'
                                        }
                                    `}
                                >
                                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1rem] bg-black/[0.03] dark:bg-white/[0.04]">
                                        <Icon className="h-5 w-5" />
                                    </span>
                                    <span className="min-w-0">
                                        <span className="block text-sm font-semibold">{item.label}</span>
                                        <span className="block truncate text-xs text-[color:var(--text-muted)]">{item.note}</span>
                                    </span>
                                </NavLink>
                            );
                        })}
                    </nav>
                </aside>

                <section className="glass rounded-[2rem] border border-white/60 p-4 shadow-[0_28px_60px_-36px_rgba(16,37,35,0.28)] dark:border-white/10 md:p-5 lg:p-6">
                    <Suspense
                        fallback={
                            <PageLoader
                                title="Cargando expediente"
                                message="Abriendo la vista del paciente sin interrumpir el contexto clinico."
                            />
                        }
                    >
                        <Outlet />
                    </Suspense>
                </section>
            </div>
        </div>
    );
};
