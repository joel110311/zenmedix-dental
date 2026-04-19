import { useEffect, useMemo, useState } from 'react';
import {
    Activity,
    AlertCircle,
    ArrowUpRight,
    Building2,
    Calendar,
    CalendarCheck,
    CheckCircle,
    Clock,
    ExternalLink,
    MessageCircle,
    Sparkles,
    User,
    XCircle,
} from 'lucide-react';
import { api } from '../services/api';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';

const HOURS = ['08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20'];

function getAppointmentDatePart(value) {
    return (value || '').replace(' ', 'T').split('T')[0];
}

function getDoctorName(appointment) {
    let doctorName = appointment.doctorName || 'Sin asignar';

    if (!appointment.doctorName && appointment.doctor && typeof appointment.doctor === 'object') {
        doctorName = appointment.doctor.name || 'Sin asignar';
    }

    if ((doctorName === 'Sin asignar' || !appointment.doctor) && appointment.notes) {
        const noteMatch = appointment.notes.match(/\[Dr:\s*([^\]]+)\]/);
        if (noteMatch) doctorName = noteMatch[1];
    }

    return doctorName;
}

function getClinicName(appointment) {
    if (appointment.clinic && typeof appointment.clinic === 'object') {
        return appointment.clinic.name || 'Sin clinica';
    }
    if (typeof appointment.clinic === 'string') {
        return appointment.clinic;
    }
    return appointment.clinicName || 'Sin clinica';
}

function isWhatsAppPending(appointment) {
    return appointment.source === 'whatsapp' && !appointment.consultationCompleted && !appointment.patient;
}

function getStatusMeta(status) {
    switch (status) {
        case 'completed':
        case 'attended':
            return {
                label: 'Confirmada',
                icon: <CheckCircle className="h-4 w-4 text-emerald-500" />,
                tone: 'badge-success',
            };
        case 'cancelled':
            return {
                label: 'Cancelada',
                icon: <XCircle className="h-4 w-4 text-rose-500" />,
                tone: 'badge-danger',
            };
        case 'noShow':
            return {
                label: 'No llego',
                icon: <AlertCircle className="h-4 w-4 text-amber-500" />,
                tone: 'badge-warning',
            };
        default:
            return {
                label: 'Pendiente',
                icon: <Clock className="h-4 w-4 text-primary" />,
                tone: 'badge-warning',
            };
    }
}

export default function Dashboard() {
    const [appointments, setAppointments] = useState([]);
    const [allAppointmentsList, setAllAppointmentsList] = useState([]);
    const [stats, setStats] = useState({
        today: 0,
        week: 0,
        month: 0,
        byStatus: { scheduled: 0, attended: 0, cancelled: 0, noShow: 0 },
        byHour: {},
        byClinic: {},
        byReason: {},
        byDoctor: {},
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAppointmentsData();
    }, []);

    const loadAppointmentsData = async () => {
        try {
            const allAppointments = await api.appointments.list();
            setAllAppointmentsList(allAppointments);

            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay());
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

            let todayCount = 0;
            let weekCount = 0;
            let monthCount = 0;
            const byStatus = { scheduled: 0, attended: 0, cancelled: 0, noShow: 0 };
            const byHour = {};
            const byClinic = {};
            const byReason = {};
            const byDoctor = {};
            const todayAppointments = [];

            allAppointments.forEach((appointment) => {
                const normalizedDate = (appointment.date || '').replace(' ', 'T');
                const appointmentDatePart = normalizedDate.split('T')[0];
                const todayLocalStr = new Date().toLocaleDateString('en-CA');
                const appointmentDate = new Date(normalizedDate);
                const appointmentDay = new Date(
                    appointmentDate.getFullYear(),
                    appointmentDate.getMonth(),
                    appointmentDate.getDate(),
                );
                const pendingWhatsapp = isWhatsAppPending(appointment);

                if (appointmentDatePart === todayLocalStr) {
                    todayAppointments.push(appointment);
                    if (!pendingWhatsapp) {
                        todayCount += 1;
                    }
                }

                if (!pendingWhatsapp) {
                    if (appointmentDay >= weekStart) weekCount += 1;
                    if (appointmentDay >= monthStart) monthCount += 1;
                }

                const appointmentDateTime = new Date(`${appointmentDatePart}T${appointment.time || '23:59'}`);
                const isPast = appointmentDateTime < now;
                const isCompleted = appointment.consultationCompleted === true || appointment.status === 'completed' || appointment.status === 'attended';
                const isCancelled = appointment.status === 'cancelled';

                if (!pendingWhatsapp) {
                    if (isCancelled) {
                        byStatus.cancelled += 1;
                    } else if (isCompleted) {
                        byStatus.attended += 1;
                    } else if (isPast) {
                        byStatus.noShow += 1;
                    } else {
                        byStatus.scheduled += 1;
                    }
                }

                if (appointmentDatePart === todayLocalStr) {
                    const hour = appointment.time?.split(':')[0] || '09';
                    byHour[hour] = (byHour[hour] || 0) + 1;
                }

                if (!pendingWhatsapp) {
                    const clinicName = getClinicName(appointment);
                    const reason = appointment.service || appointment.reason || 'Consulta general';
                    const doctorName = getDoctorName(appointment);

                    byClinic[clinicName] = (byClinic[clinicName] || 0) + 1;
                    byReason[reason] = (byReason[reason] || 0) + 1;
                    byDoctor[doctorName] = (byDoctor[doctorName] || 0) + 1;
                }
            });

            setAppointments(todayAppointments.sort((left, right) => (left.time || '').localeCompare(right.time || '')));
            setStats({
                today: todayCount,
                week: weekCount,
                month: monthCount,
                byStatus,
                byHour,
                byClinic,
                byReason,
                byDoctor,
            });
        } catch (error) {
            console.error('Error loading appointments:', error);
        } finally {
            setLoading(false);
        }
    };

    const todayLabel = new Date().toLocaleDateString('es-MX', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    });
    const todayIso = new Date().toLocaleDateString('en-CA');
    const maxHourValue = Math.max(...HOURS.map((hour) => stats.byHour[hour] || 0), 1);

    const openWhatsappWindows = appointments.filter((appointment) => {
        const reminderDate = appointment.reminderSentAt ? appointment.reminderSentAt.split('T')[0] : null;
        return appointment.reminderSent && reminderDate === todayIso;
    }).length;

    const topReasons = useMemo(
        () => Object.entries(stats.byReason).sort((left, right) => right[1] - left[1]).slice(0, 5),
        [stats.byReason],
    );

    const topClinics = useMemo(
        () => Object.entries(stats.byClinic).sort((left, right) => right[1] - left[1]).slice(0, 4),
        [stats.byClinic],
    );

    const topDoctors = useMemo(
        () => Object.entries(stats.byDoctor).sort((left, right) => right[1] - left[1]).slice(0, 4),
        [stats.byDoctor],
    );

    const nextOpenHour = useMemo(() => {
        const firstBusyHour = HOURS.find((hour) => (stats.byHour[hour] || 0) > 0);
        return firstBusyHour || '08';
    }, [stats.byHour]);

    if (loading) {
        return (
            <div className="glass rounded-[2rem] border border-white/60 px-6 py-20 dark:border-white/10">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-4 md:space-y-5">
            <section className="glass rounded-[2.3rem] border border-white/60 p-6 shadow-[0_32px_80px_-42px_rgba(16,37,35,0.4)] dark:border-white/10 md:p-7 lg:p-8">
                <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
                    <div>
                        <p className="section-kicker">
                            <Sparkles className="h-3.5 w-3.5" />
                            Command overview
                        </p>
                        <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight text-[color:var(--text-primary)] md:text-5xl">
                            Un dashboard que se siente como un producto premium para una clinica que quiere vender confianza.
                        </h1>
                        <p className="mt-4 max-w-2xl text-base leading-7 text-[color:var(--text-secondary)]">
                            Vista ejecutiva del dia con agenda viva, estado operativo y señales comerciales para recepcion, direccion y equipo clinico.
                        </p>

                        <div className="mt-8 flex flex-wrap gap-3">
                            <div className="rounded-full border border-black/5 bg-white/70 px-4 py-2 text-sm font-medium text-[color:var(--text-secondary)] dark:border-white/10 dark:bg-white/[0.04]">
                                Hoy: <span className="font-semibold text-[color:var(--text-primary)]">{todayLabel}</span>
                            </div>
                            <div className="rounded-full border border-black/5 bg-white/70 px-4 py-2 text-sm font-medium text-[color:var(--text-secondary)] dark:border-white/10 dark:bg-white/[0.04]">
                                Ventanas WhatsApp activas: <span className="font-semibold text-[color:var(--text-primary)]">{openWhatsappWindows}</span>
                            </div>
                            <div className="rounded-full border border-black/5 bg-white/70 px-4 py-2 text-sm font-medium text-[color:var(--text-secondary)] dark:border-white/10 dark:bg-white/[0.04]">
                                Primer bloque con actividad: <span className="font-semibold text-[color:var(--text-primary)]">{nextOpenHour}:00</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        {[
                            { label: 'Citas hoy', value: stats.today, note: 'agenda confirmada para la jornada', icon: <Calendar className="h-5 w-5" /> },
                            { label: 'Semana activa', value: stats.week, note: 'movimientos de la semana en curso', icon: <CalendarCheck className="h-5 w-5" /> },
                            { label: 'Mes acumulado', value: stats.month, note: 'volumen clinico del periodo', icon: <Activity className="h-5 w-5" /> },
                            { label: 'Pendientes', value: stats.byStatus.scheduled, note: 'requieren seguimiento oportuno', icon: <Clock className="h-5 w-5" /> },
                        ].map((item) => (
                            <div key={item.label} className="rounded-[1.8rem] border border-white/60 bg-white/68 p-5 shadow-[0_24px_56px_-36px_rgba(16,37,35,0.36)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.04]">
                                <div className="flex items-center justify-between">
                                    <span className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-[linear-gradient(135deg,var(--primary-700),var(--primary-500))] text-white shadow-[0_18px_34px_-20px_rgba(15,124,120,0.72)]">
                                        {item.icon}
                                    </span>
                                    <ArrowUpRight className="h-4 w-4 text-[color:var(--text-muted)]" />
                                </div>
                                <p className="mt-5 text-4xl font-semibold tracking-[-0.04em] text-[color:var(--text-primary)]">{item.value}</p>
                                <p className="mt-2 text-sm font-semibold text-[color:var(--text-secondary)]">{item.label}</p>
                                <p className="mt-1 text-xs leading-5 text-[color:var(--text-muted)]">{item.note}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <div className="grid gap-4 xl:grid-cols-[1.22fr_0.78fr]">
                <section className="glass rounded-[2rem] border border-white/60 p-5 shadow-[0_30px_70px_-40px_rgba(16,37,35,0.32)] dark:border-white/10 md:p-6">
                    <div className="flex flex-col gap-3 border-b border-black/5 pb-4 dark:border-white/10 md:flex-row md:items-end md:justify-between">
                        <div>
                            <p className="section-kicker">Live concierge</p>
                            <h2 className="mt-4 text-2xl font-semibold text-[color:var(--text-primary)]">Pacientes del dia</h2>
                            <p className="mt-2 text-sm leading-6 text-[color:var(--text-muted)]">
                                Agenda del dia con accesos rapidos al expediente y visibilidad de la ventana de WhatsApp.
                            </p>
                        </div>
                        <div className="rounded-full border border-black/5 bg-white/70 px-4 py-2 text-sm font-medium text-[color:var(--text-secondary)] dark:border-white/10 dark:bg-white/[0.04]">
                            {appointments.length} registros visibles
                        </div>
                    </div>

                    <div className="mt-5 space-y-3">
                        {appointments.length === 0 ? (
                            <div className="rounded-[1.6rem] border border-dashed border-black/10 bg-white/45 px-6 py-12 text-center text-sm text-[color:var(--text-muted)] dark:border-white/10 dark:bg-white/[0.02]">
                                No hay citas agendadas para hoy.
                            </div>
                        ) : (
                            appointments.map((appointment, index) => {
                                const statusMeta = getStatusMeta(appointment.status);
                                const reminderDate = appointment.reminderSentAt ? appointment.reminderSentAt.split('T')[0] : null;
                                const isWindowOpen = appointment.reminderSent && reminderDate === todayIso;

                                return (
                                    <article
                                        key={appointment.id || index}
                                        className="rounded-[1.6rem] border border-white/60 bg-white/64 px-4 py-4 shadow-[0_18px_40px_-34px_rgba(16,37,35,0.35)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04]"
                                    >
                                        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                                            <div className="flex items-start gap-4">
                                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1rem] bg-[linear-gradient(135deg,var(--primary-700),var(--primary-500))] text-base font-semibold text-white shadow-[0_18px_36px_-22px_rgba(15,124,120,0.72)]">
                                                    {index + 1}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <p className="text-lg font-semibold text-[color:var(--text-primary)]">
                                                            {appointment.patientName || 'Sin nombre'}
                                                        </p>
                                                        <span className={statusMeta.tone}>{statusMeta.label}</span>
                                                    </div>
                                                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[color:var(--text-muted)]">
                                                        <span className="inline-flex items-center gap-2">
                                                            <Clock className="h-4 w-4 text-primary" />
                                                            {appointment.time || '--:--'}
                                                        </span>
                                                        <span className="inline-flex items-center gap-2">
                                                            <User className="h-4 w-4 text-primary" />
                                                            {getDoctorName(appointment)}
                                                        </span>
                                                        <span className="inline-flex items-center gap-2">
                                                            <Building2 className="h-4 w-4 text-primary" />
                                                            {getClinicName(appointment)}
                                                        </span>
                                                    </div>
                                                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[color:var(--text-muted)]">
                                                        <span className="rounded-full border border-black/5 bg-white/70 px-2.5 py-1 dark:border-white/10 dark:bg-white/[0.04]">
                                                            {appointment.phone || 'Sin telefono'}
                                                        </span>
                                                        <span className="rounded-full border border-black/5 bg-white/70 px-2.5 py-1 dark:border-white/10 dark:bg-white/[0.04]">
                                                            {isWindowOpen ? 'Ventana WhatsApp abierta' : 'Ventana WhatsApp cerrada'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {appointment.patientId && (
                                                    <a
                                                        href={`/pacientes/${appointment.patientId}/historial`}
                                                        className="inline-flex h-11 w-11 items-center justify-center rounded-[1rem] border border-black/5 bg-white/72 text-[color:var(--text-secondary)] transition hover:bg-white hover:text-[color:var(--text-primary)] dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.08]"
                                                        title="Ver expediente"
                                                    >
                                                        <ExternalLink className="h-4 w-4" />
                                                    </a>
                                                )}
                                                <button
                                                    type="button"
                                                    disabled={!isWindowOpen}
                                                    className={`inline-flex h-11 items-center gap-2 rounded-[1rem] border px-4 text-sm font-semibold transition ${
                                                        isWindowOpen
                                                            ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                                                            : 'border-black/5 bg-white/60 text-[color:var(--text-muted)] dark:border-white/10 dark:bg-white/[0.04]'
                                                    }`}
                                                    title={isWindowOpen ? 'Enviar mensaje WhatsApp' : 'WhatsApp no disponible'}
                                                >
                                                    <MessageCircle className="h-4 w-4" />
                                                    <span className="hidden sm:inline">WhatsApp</span>
                                                </button>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })
                        )}
                    </div>
                </section>

                <div className="grid gap-4">
                    <section className="glass rounded-[2rem] border border-white/60 p-5 shadow-[0_28px_64px_-38px_rgba(16,37,35,0.32)] dark:border-white/10 md:p-6">
                        <p className="section-kicker">Cadencia diaria</p>
                        <div className="mt-4 flex items-end justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-semibold text-[color:var(--text-primary)]">Pulso horario</h2>
                                <p className="mt-2 text-sm leading-6 text-[color:var(--text-muted)]">
                                    Distribucion de atencion durante el dia operativo.
                                </p>
                            </div>
                            <span className="rounded-full border border-black/5 bg-white/70 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[color:var(--text-muted)] dark:border-white/10 dark:bg-white/[0.04]">
                                Hoy
                            </span>
                        </div>

                        <div className="mt-6 grid grid-cols-[repeat(13,minmax(0,1fr))] items-end gap-2">
                            {HOURS.map((hour) => {
                                const value = stats.byHour[hour] || 0;
                                const height = `${Math.max(14, (value / maxHourValue) * 140)}px`;
                                return (
                                    <div key={hour} className="flex flex-col items-center gap-2">
                                        <div className="flex h-40 w-full items-end">
                                            <div
                                                className="w-full rounded-t-[1rem] bg-[linear-gradient(180deg,var(--primary-400),var(--primary-700))] shadow-[0_18px_30px_-24px_rgba(15,124,120,0.72)]"
                                                style={{ height }}
                                                title={`${hour}:00 - ${value} citas`}
                                            />
                                        </div>
                                        <span className="text-[11px] font-semibold text-[color:var(--text-muted)]">{hour}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    <section className="glass rounded-[2rem] border border-white/60 p-5 shadow-[0_28px_64px_-38px_rgba(16,37,35,0.32)] dark:border-white/10 md:p-6">
                        <p className="section-kicker">Estado operativo</p>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            {[
                                { label: 'Agendadas', value: stats.byStatus.scheduled, icon: <Clock className="h-4 w-4" />, tone: 'text-primary' },
                                { label: 'Asistieron', value: stats.byStatus.attended, icon: <CheckCircle className="h-4 w-4 text-emerald-500" />, tone: 'text-emerald-500' },
                                { label: 'Canceladas', value: stats.byStatus.cancelled, icon: <XCircle className="h-4 w-4 text-rose-500" />, tone: 'text-rose-500' },
                                { label: 'No llegaron', value: stats.byStatus.noShow, icon: <AlertCircle className="h-4 w-4 text-amber-500" />, tone: 'text-amber-500' },
                            ].map((item) => (
                                <div key={item.label} className="rounded-[1.45rem] border border-white/60 bg-white/70 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-[color:var(--text-secondary)]">{item.label}</span>
                                        {item.icon}
                                    </div>
                                    <p className={`mt-3 text-3xl font-semibold tracking-[-0.04em] ${item.tone}`}>{item.value}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <section className="glass rounded-[2rem] border border-white/60 p-5 shadow-[0_28px_64px_-38px_rgba(16,37,35,0.32)] dark:border-white/10 md:p-6">
                    <div className="flex items-end justify-between gap-4">
                        <div>
                            <p className="section-kicker">Performance mix</p>
                            <h2 className="mt-4 text-2xl font-semibold text-[color:var(--text-primary)]">Clinicas y medicos</h2>
                            <p className="mt-2 text-sm leading-6 text-[color:var(--text-muted)]">
                                Quien sostiene el flujo de atencion en este ciclo de trabajo.
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 grid gap-6 md:grid-cols-2">
                        <div className="space-y-4">
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Clinicas</p>
                            {topClinics.length === 0 ? (
                                <p className="text-sm text-[color:var(--text-muted)]">Sin datos disponibles.</p>
                            ) : topClinics.map(([name, count]) => {
                                const maxClinicValue = Math.max(...topClinics.map((entry) => entry[1]), 1);
                                return (
                                    <div key={name} className="space-y-2">
                                        <div className="flex items-center justify-between gap-3 text-sm">
                                            <span className="font-semibold text-[color:var(--text-primary)]">{name}</span>
                                            <span className="text-[color:var(--text-muted)]">{count}</span>
                                        </div>
                                        <div className="h-2 rounded-full bg-black/[0.06] dark:bg-white/[0.06]">
                                            <div
                                                className="h-2 rounded-full bg-[linear-gradient(90deg,var(--primary-400),var(--primary-700))]"
                                                style={{ width: `${(count / maxClinicValue) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="space-y-4">
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Medicos</p>
                            {topDoctors.length === 0 ? (
                                <p className="text-sm text-[color:var(--text-muted)]">Sin datos disponibles.</p>
                            ) : topDoctors.map(([name, count]) => {
                                const maxDoctorValue = Math.max(...topDoctors.map((entry) => entry[1]), 1);
                                return (
                                    <div key={name} className="space-y-2">
                                        <div className="flex items-center justify-between gap-3 text-sm">
                                            <span className="font-semibold text-[color:var(--text-primary)]">{name}</span>
                                            <span className="text-[color:var(--text-muted)]">{count}</span>
                                        </div>
                                        <div className="h-2 rounded-full bg-black/[0.06] dark:bg-white/[0.06]">
                                            <div
                                                className="h-2 rounded-full bg-[linear-gradient(90deg,#caa879,var(--primary-700))]"
                                                style={{ width: `${(count / maxDoctorValue) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                <section className="glass rounded-[2rem] border border-white/60 p-5 shadow-[0_28px_64px_-38px_rgba(16,37,35,0.32)] dark:border-white/10 md:p-6">
                    <div className="flex items-end justify-between gap-4">
                        <div>
                            <p className="section-kicker">Demand signal</p>
                            <h2 className="mt-4 text-2xl font-semibold text-[color:var(--text-primary)]">Motivos de consulta</h2>
                            <p className="mt-2 text-sm leading-6 text-[color:var(--text-muted)]">
                                Lectura rapida del mix clinico y comercial que llega a la recepcion.
                            </p>
                        </div>
                        <Button variant="ghost" size="sm">
                            <Activity className="h-4 w-4" />
                            Ver detalle
                        </Button>
                    </div>

                    <div className="mt-6 space-y-4">
                        {topReasons.length === 0 ? (
                            <p className="text-sm text-[color:var(--text-muted)]">Sin datos disponibles.</p>
                        ) : topReasons.map(([reason, count], index) => {
                            const maxReasonValue = Math.max(...topReasons.map((entry) => entry[1]), 1);
                            return (
                                <div key={reason} className="rounded-[1.35rem] border border-white/60 bg-white/66 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-[0.95rem] bg-[linear-gradient(135deg,var(--primary-700),var(--primary-500))] text-sm font-semibold text-white shadow-[0_18px_30px_-20px_rgba(15,124,120,0.72)]">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-[color:var(--text-primary)]">{reason}</p>
                                                <p className="text-xs text-[color:var(--text-muted)]">Intencion clinica dominante</p>
                                            </div>
                                        </div>
                                        <span className="text-xl font-semibold tracking-[-0.04em] text-[color:var(--text-primary)]">{count}</span>
                                    </div>
                                    <div className="mt-3 h-2 rounded-full bg-black/[0.06] dark:bg-white/[0.06]">
                                        <div
                                            className="h-2 rounded-full bg-[linear-gradient(90deg,var(--primary-400),#caa879)]"
                                            style={{ width: `${(count / maxReasonValue) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            </div>
        </div>
    );
}
