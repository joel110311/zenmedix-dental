import React, { useRef, useEffect, useMemo, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import esLocale from '@fullcalendar/core/locales/es';
import { Filter, User } from 'lucide-react';

// Styles for custom events - card style
const eventStyles = `
  .fc-event {
    cursor: pointer;
    border: none !important;
    background-color: transparent !important;
    padding: 0 !important;
    font-size: 0.85rem;
    box-shadow: none;
    transition: transform 0.1s, box-shadow 0.1s;
  }
  .fc-event:hover {
    transform: scale(1.02);
    z-index: 50;
  }
  .fc-timegrid-event .fc-event-main {
    padding: 0 !important;
    overflow: visible;
  }
  .fc-timegrid-event-harness {
    overflow: visible !important;
  }
  .fc-timegrid-slot {
    height: 48px !important; 
  }
  .fc-list-event-dot {
    border-width: 5px !important;
  }
  /* Remove default title text since we render our own */
  .fc-event-title-container,
  .fc-event-title {
    display: none;
  }
  .fc-event-time {
    display: none;
  }
`;

const AdvancedCalendar = ({
    appointments,
    onDateSelect,
    onEventClick,
    onEventDrop,
    onEventResize,
    clinics = [],
    doctors = []
}) => {
    const calendarRef = useRef(null);
    const [selectedDoctor, setSelectedDoctor] = useState('all');
    const [selectedStatuses, setSelectedStatuses] = useState({
        confirmed: true,
        attended: true,
        pending: true,
        cancelled: false,
        noShow: true
    });

    // Extract unique doctors
    const availableDoctors = useMemo(() => {
        if (doctors && doctors.length > 0) return doctors;
        const unique = new Map();
        if (appointments) {
            appointments.forEach(a => {
                if (a.doctor) {
                    unique.set(a.doctor.id || a.doctor.name, a.doctor);
                } else if (a.doctorId) {
                    unique.set(a.doctorId, { id: a.doctorId, name: 'Doctor ' + a.doctorId.substr(0, 5) });
                }
            });
        }
        return Array.from(unique.values());
    }, [doctors, appointments]);

    // Color logic
    const getEventColor = (appt) => {
        switch (appt.status) {
            case 'confirmed': return '#10b981'; // green-500
            case 'attended': return '#3b82f6'; // blue-500
            case 'cancelled': return '#ef4444'; // red-500
            case 'noShow': return '#f59e0b'; // amber-500
            default: return '#6366f1'; // indigo-500
        }
    };

    // Filter and Transform Events
    const events = useMemo(() => {
        if (!appointments || !Array.isArray(appointments)) return [];

        return appointments
            .filter(appt => {
                // Filter by Doctor
                if (selectedDoctor !== 'all') {
                    const docId = appt.doctorId || (appt.doctor?.id);
                    if (docId !== selectedDoctor) return false;
                }
                // Filter by Status
                const status = appt.status || 'pending';
                const normalizedStatus = status === 'scheduled' ? 'pending' : status;
                if (!selectedStatuses[normalizedStatus]) return false;

                return true;
            })
            .map(appt => {
                try {
                    let duration = 30;
                    if (appt.notes && appt.notes.includes('[duration:')) {
                        const match = appt.notes.match(/\[duration:(\d+)\]/);
                        if (match) duration = parseInt(match[1]);
                    }

                    // Parse start date safely
                    let dateStr = appt.date;
                    if (dateStr && dateStr.includes('T')) dateStr = dateStr.split('T')[0];
                    else if (dateStr && dateStr.includes(' ')) dateStr = dateStr.split(' ')[0];

                    const startInfo = `${dateStr}T${appt.time}`;
                    const start = new Date(startInfo);

                    if (isNaN(start.getTime())) return null;

                    const end = new Date(start.getTime() + duration * 60000);
                    const color = getEventColor(appt);

                    return {
                        id: appt.id,
                        title: `${appt.patientName} ${appt.reason ? `- ${appt.reason}` : ''}`,
                        start: start,
                        end: end,
                        backgroundColor: color,
                        borderColor: color,
                        textColor: '#fff',
                        extendedProps: {
                            ...appt,
                            duration: duration
                        }
                    };
                } catch (e) {
                    return null;
                }
            })
            .filter(Boolean);
    }, [appointments, selectedDoctor, selectedStatuses]);

    // Custom Event Render for all views - Card Style like reference
    const renderEventContent = (eventInfo) => {
        const appt = eventInfo.event.extendedProps;
        const bgColor = eventInfo.event.backgroundColor;
        // Use doctorName from api.js (extracted from notes or expanded relation)
        const doctorName = appt.doctorName || appt.doctor?.name || 'Sin asignar';
        const timeStr = eventInfo.event.start ? eventInfo.event.start.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true }) : '';

        // For LIST views - table style with reason column
        if (eventInfo.view.type === 'listDay' || eventInfo.view.type.includes('list')) {
            return (
                <div className="flex items-center justify-between w-full p-2">
                    <div className="flex-1">
                        <span className="font-bold text-slate-800 dark:text-white mr-2">{appt.patientName || 'Paciente'}</span>
                        <div className="text-sm text-slate-500 dark:text-slate-400">Tel: {appt.phone || 'N/A'}</div>
                    </div>
                    {/* Reason/Motivo Column */}
                    <div className="flex-1 text-slate-600 dark:text-slate-300">
                        {appt.reason || 'Sin motivo'}
                    </div>
                    {/* Doctor Column */}
                    <div className="flex-1 text-slate-600 dark:text-slate-300">
                        {doctorName}
                    </div>
                    <div className="flex-1">
                        <span
                            className="px-2 py-1 rounded-full text-xs text-white uppercase"
                            style={{ backgroundColor: bgColor }}
                        >
                            {appt.status === 'scheduled' ? 'Pendiente' : appt.status}
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <button className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors">
                            Diagnóstico
                        </button>
                    </div>
                </div>
            );
        }

        // For GRID views (timeGrid, dayGrid) - Card Style with left border
        return (
            <div
                className="h-full w-full overflow-hidden"
                style={{
                    backgroundColor: '#eff6ff', // Light blue
                    borderLeft: `4px solid ${bgColor}`,
                    borderRadius: '6px',
                    padding: '4px 6px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px'
                }}
            >
                {/* Patient Name - Bold */}
                <div style={{ fontWeight: '700', fontSize: '0.85rem', color: '#1e293b', lineHeight: '1.2' }}>
                    {appt.patientName || 'Paciente'}
                </div>
                {/* Time */}
                <div style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: '500' }}>
                    {timeStr}
                </div>
                {/* Service/Reason */}
                {appt.reason && (
                    <div style={{ fontSize: '0.7rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {appt.reason}
                    </div>
                )}
                {/* Doctor with avatar placeholder */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: 'auto' }}>
                    <div
                        style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            backgroundColor: bgColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.55rem',
                            color: '#fff',
                            flexShrink: 0
                        }}
                    >
                        {doctorName.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontSize: '0.7rem', color: '#475569' }}>{doctorName}</span>
                </div>
            </div>
        );
    };

    const handleDateSelect = (selectInfo) => {
        const date = selectInfo.startStr.split('T')[0];
        const time = selectInfo.start.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
        onDateSelect({ date, time });
        selectInfo.view.calendar.unselect();
    };

    const handleEventDrop = (dropInfo) => {
        const { event } = dropInfo;
        const newDate = event.start.toISOString().split('T')[0];
        const newTime = event.start.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

        onEventDrop({
            id: event.id,
            date: newDate,
            time: newTime,
            oldEvent: event.extendedProps
        });
    };

    const handleEventResize = (resizeInfo) => {
        const { event } = resizeInfo;
        const diffMs = event.end - event.start;
        const newDuration = Math.round(diffMs / 60000);

        onEventResize({
            id: event.id,
            duration: newDuration,
            oldEvent: event.extendedProps
        });
    };

    const toggleStatus = (status) => {
        setSelectedStatuses(prev => ({
            ...prev,
            [status]: !prev[status]
        }));
    };

    return (
        <div className="flex flex-col md:flex-row gap-4 h-[800px]">
            {/* Sidebar Filters */}
            <div className="w-full md:w-64 flex-shrink-0 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 flex flex-col gap-6">

                {/* Doctor Filter */}
                <div>
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                        <User className="w-4 h-4" /> Dentistas
                    </h3>
                    <select
                        value={selectedDoctor}
                        onChange={(e) => setSelectedDoctor(e.target.value)}
                        className="w-full p-2 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                        <option value="all">Todos los dentistas</option>
                        {availableDoctors.map(doc => (
                            <option key={doc.id} value={doc.id}>
                                {doc.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Status Filter */}
                <div>
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                        <Filter className="w-4 h-4" /> Estado de cita
                    </h3>
                    <div className="space-y-2">
                        {/* Status Checkboxes */}
                        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={selectedStatuses.pending}
                                onChange={() => toggleStatus('pending')}
                                className="rounded text-indigo-500 focus:ring-indigo-500"
                            />
                            <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                                Pendiente
                            </span>
                        </label>
                        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={selectedStatuses.attended}
                                onChange={() => toggleStatus('attended')}
                                className="rounded text-blue-500 focus:ring-blue-500"
                            />
                            <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                Atendido
                            </span>
                        </label>
                        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={selectedStatuses.confirmed}
                                onChange={() => toggleStatus('confirmed')}
                                className="rounded text-green-500 focus:ring-green-500"
                            />
                            <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                Confirmado
                            </span>
                        </label>
                        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={selectedStatuses.noShow}
                                onChange={() => toggleStatus('noShow')}
                                className="rounded text-amber-500 focus:ring-amber-500"
                            />
                            <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                No asiste
                            </span>
                        </label>
                        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={selectedStatuses.cancelled}
                                onChange={() => toggleStatus('cancelled')}
                                className="rounded text-red-500 focus:ring-red-500"
                            />
                            <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                Cancelado
                            </span>
                        </label>
                    </div>
                </div>

                <div className="mt-auto">
                    <button
                        onClick={() => {
                            setSelectedDoctor('all');
                            setSelectedStatuses({
                                confirmed: true, attended: true, pending: true, cancelled: false, noShow: true
                            });
                        }}
                        className="text-xs text-primary hover:text-primary-focus underline"
                    >
                        Restablecer filtros
                    </button>
                </div>
            </div>

            {/* Calendar Container */}
            <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 h-full overflow-hidden">
                <style>{eventStyles}</style>
                <FullCalendar
                    ref={calendarRef}
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                    initialView="timeGridWeek"
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,timeGridWeek,timeGridDay,listDay'
                    }}
                    views={{
                        listDay: { buttonText: 'Diaria Global' },
                        timeGridDay: { buttonText: 'Diaria' },
                        timeGridWeek: { buttonText: 'Semanal' },
                        dayGridMonth: { buttonText: 'Mes' }
                    }}
                    locale={esLocale}
                    slotMinTime="07:00:00"
                    slotMaxTime="23:00:00"
                    allDaySlot={false}
                    selectable={true}
                    selectMirror={true}
                    dayMaxEvents={true}
                    weekends={true}
                    events={events} // Pass the transformed events
                    select={handleDateSelect}
                    eventClick={(info) => onEventClick(info.event.extendedProps)}
                    editable={true} // Allow drag & drop and resizing
                    eventDrop={handleEventDrop}
                    eventResize={handleEventResize}
                    height="100%"
                    slotDuration="00:15:00" // 15 min slots for precision
                    slotLabelInterval="01:00"
                    nowIndicator={true}
                    eventContent={renderEventContent}
                    businessHours={{
                        daysOfWeek: [1, 2, 3, 4, 5, 6], // Mon-Sat
                        startTime: '08:00',
                        endTime: '20:00',
                    }}
                />
            </div>
        </div>
    );
};

export default AdvancedCalendar;
