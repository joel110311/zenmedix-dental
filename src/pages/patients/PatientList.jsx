import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Calendar, ChevronRight, Edit, Phone, Plus, Search, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { usePatient } from '../../context/PatientContext';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { toast } from 'sonner';

const calculateAge = (dob) => {
    if (!dob) return '-';
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
        age -= 1;
    }
    return age;
};

const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function PatientList() {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const deferredSearchTerm = useDeferredValue(searchTerm);
    const navigate = useNavigate();
    const { setActivePatient } = usePatient();

    useEffect(() => {
        loadPatients();
    }, []);

    const loadPatients = async () => {
        try {
            setLoading(true);
            const data = await api.patients.list();
            setPatients(data);
        } catch (error) {
            toast.error('Error al cargar pacientes');
        } finally {
            setLoading(false);
        }
    };

    const filteredPatients = useMemo(() => {
        const normalizedSearch = deferredSearchTerm.trim().toLowerCase();
        if (!normalizedSearch) return patients;

        return patients.filter((patient) => {
            const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase();
            return fullName.includes(normalizedSearch) || (patient.phone && patient.phone.includes(normalizedSearch));
        });
    }, [deferredSearchTerm, patients]);

    const stats = useMemo(() => {
        const withPhone = patients.filter((patient) => Boolean(patient.phone)).length;
        const withRecentVisit = patients.filter((patient) => Boolean(patient.lastVisit)).length;
        const newThisMonth = patients.filter((patient) => {
            if (!patient.created) return false;
            const createdAt = new Date(patient.created);
            const now = new Date();
            return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear();
        }).length;

        return {
            total: patients.length,
            withPhone,
            withRecentVisit,
            newThisMonth,
        };
    }, [patients]);

    const handleViewHistory = (patient) => {
        setActivePatient(patient);
        navigate(`/pacientes/${patient.id}`);
    };

    const handleEdit = (patient) => {
        navigate(`/pacientes/editar/${patient.id}`);
    };

    if (loading) {
        return (
            <div className="glass rounded-[2rem] border border-white/60 px-6 py-20 dark:border-white/10">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-4 md:space-y-5">
            <section className="glass rounded-[2.2rem] border border-white/60 p-6 shadow-[0_32px_80px_-42px_rgba(16,37,35,0.38)] dark:border-white/10 md:p-7 lg:p-8">
                <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
                    <div>
                        <p className="section-kicker">Concierge directory</p>
                        <h1 className="mt-5 text-4xl font-semibold leading-tight text-[color:var(--text-primary)] md:text-5xl">
                            Directorio de pacientes con presencia de producto premium.
                        </h1>
                        <p className="mt-4 max-w-2xl text-base leading-7 text-[color:var(--text-secondary)]">
                            Un modulo limpio y vendible para navegar expediente, seguimiento y acceso rapido a cada paciente.
                        </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        {[
                            { label: 'Pacientes', value: stats.total, icon: <Users className="h-4 w-4" /> },
                            { label: 'Con telefono', value: stats.withPhone, icon: <Phone className="h-4 w-4" /> },
                            { label: 'Con visita', value: stats.withRecentVisit, icon: <Calendar className="h-4 w-4" /> },
                            { label: 'Nuevos mes', value: stats.newThisMonth, icon: <Plus className="h-4 w-4" /> },
                        ].map((item) => (
                            <div key={item.label} className="rounded-[1.6rem] border border-white/60 bg-white/68 p-4 shadow-[0_22px_42px_-30px_rgba(16,37,35,0.28)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.04]">
                                <div className="flex items-center justify-between">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-[1rem] bg-[linear-gradient(135deg,var(--primary-700),var(--primary-500))] text-white shadow-[0_18px_32px_-22px_rgba(15,124,120,0.72)]">
                                        {item.icon}
                                    </span>
                                    <ChevronRight className="h-4 w-4 text-[color:var(--text-muted)]" />
                                </div>
                                <p className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-[color:var(--text-primary)]">{item.value}</p>
                                <p className="mt-1 text-sm font-semibold text-[color:var(--text-secondary)]">{item.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="glass rounded-[2rem] border border-white/60 p-5 shadow-[0_30px_70px_-40px_rgba(16,37,35,0.32)] dark:border-white/10 md:p-6">
                <div className="flex flex-col gap-4 border-b border-black/5 pb-5 dark:border-white/10 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="section-kicker">Patient search</p>
                        <h2 className="mt-4 text-2xl font-semibold text-[color:var(--text-primary)]">Explora el directorio</h2>
                        <p className="mt-2 text-sm leading-6 text-[color:var(--text-muted)]">
                            Busqueda, acceso rapido al expediente y una tabla mas elegante para recepcion y equipo clinico.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <div className="relative min-w-[18rem]">
                            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--text-muted)]" />
                            <input
                                type="text"
                                placeholder="Buscar por nombre o telefono"
                                className="w-full pl-11 pr-4 py-3"
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                            />
                        </div>
                        <Button onClick={() => navigate('/pacientes/nuevo')} size="lg">
                            <Plus className="h-4 w-4" />
                            Nuevo paciente
                        </Button>
                    </div>
                </div>

                {filteredPatients.length === 0 ? (
                    <div className="rounded-[1.6rem] border border-dashed border-black/10 bg-white/45 px-6 py-14 text-center text-sm text-[color:var(--text-muted)] dark:border-white/10 dark:bg-white/[0.02]">
                        No se encontraron pacientes con ese criterio.
                    </div>
                ) : (
                    <>
                        <div className="mt-5 hidden overflow-hidden rounded-[1.6rem] border border-white/60 bg-white/66 dark:border-white/10 dark:bg-white/[0.04] md:block">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
                                        <th className="px-5 py-4">Paciente</th>
                                        <th className="px-4 py-4">Edad</th>
                                        <th className="px-4 py-4">Telefono</th>
                                        <th className="px-4 py-4">Ultima visita</th>
                                        <th className="px-5 py-4 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPatients.map((patient) => (
                                        <tr
                                            key={patient.id}
                                            className="cursor-pointer border-t border-black/5 transition hover:bg-white/80 dark:border-white/10 dark:hover:bg-white/[0.05]"
                                            onClick={() => handleViewHistory(patient)}
                                        >
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-[linear-gradient(135deg,var(--primary-700),var(--primary-500))] text-sm font-semibold text-white shadow-[0_18px_32px_-22px_rgba(15,124,120,0.72)]">
                                                        {patient.firstName?.[0]}{patient.lastName?.[0]}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-[color:var(--text-primary)]">
                                                            {patient.firstName} {patient.lastName}
                                                        </p>
                                                        <p className="text-xs text-[color:var(--text-muted)]">
                                                            {patient.dni ? `ID ${patient.dni}` : 'Expediente listo'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-sm font-medium text-[color:var(--text-secondary)]">
                                                {calculateAge(patient.dob)}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-[color:var(--text-secondary)]">
                                                {patient.phone || '-'}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-[color:var(--text-secondary)]">
                                                {formatDate(patient.lastVisit)}
                                            </td>
                                            <td className="px-5 py-4 text-right" onClick={(event) => event.stopPropagation()}>
                                                <Button variant="secondary" size="sm" onClick={() => handleEdit(patient)}>
                                                    <Edit className="h-4 w-4" />
                                                    Editar
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-5 space-y-3 md:hidden">
                            {filteredPatients.map((patient) => (
                                <article
                                    key={patient.id}
                                    className="rounded-[1.55rem] border border-white/60 bg-white/68 p-4 shadow-[0_22px_42px_-30px_rgba(16,37,35,0.28)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.04]"
                                    onClick={() => handleViewHistory(patient)}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex min-w-0 items-center gap-3">
                                            <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-[linear-gradient(135deg,var(--primary-700),var(--primary-500))] text-sm font-semibold text-white shadow-[0_18px_32px_-22px_rgba(15,124,120,0.72)]">
                                                {patient.firstName?.[0]}{patient.lastName?.[0]}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="truncate font-semibold text-[color:var(--text-primary)]">
                                                    {patient.firstName} {patient.lastName}
                                                </p>
                                                <p className="text-xs text-[color:var(--text-muted)]">
                                                    {patient.phone || 'Sin telefono registrado'}
                                                </p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={(event) => {
                                            event.stopPropagation();
                                            handleEdit(patient);
                                        }}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    <div className="mt-4 flex items-center justify-between text-sm">
                                        <span className="text-[color:var(--text-muted)]">Edad</span>
                                        <span className="font-semibold text-[color:var(--text-primary)]">{calculateAge(patient.dob)}</span>
                                    </div>
                                    <div className="mt-2 flex items-center justify-between text-sm">
                                        <span className="text-[color:var(--text-muted)]">Ultima visita</span>
                                        <span className="font-semibold text-[color:var(--text-primary)]">{formatDate(patient.lastVisit)}</span>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </>
                )}
            </section>
        </div>
    );
}
