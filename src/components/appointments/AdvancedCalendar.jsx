
import React, { useRef, useEffect, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import esLocale from '@fullcalendar/core/locales/es';

// Styles for custom events
const eventStyles = `
  .fc-event {
    cursor: pointer;
    border: none;
    padding: 2px;
    font-size: 0.85rem;
    border-radius: 4px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
    transition: transform 0.1s, box-shadow 0.1s;
  }
  .fc-event:hover {
    transform: scale(1.01);
    box-shadow: 0 4px 6px rgba(0,0,0,0.15);
    z-index: 50;
  }
  .fc-timegrid-event .fc-event-main {
    padding: 2px 4px;
  }
  .fc-timegrid-slot {
    height: 40px !important; 
  }
`;

const AdvancedCalendar = ({
    appointments,
    onDateSelect,
    onEventClick,
    onEventDrop,
    onEventResize,
    clinics = []
}) => {
    const calendarRef = useRef(null);

    // Color logic
    const getEventColor = (appt) => {
        // Status based colors
        switch (appt.status) {
            case 'confirmed': return '#10b981'; // green-500
            case 'attended': return '#3b82f6'; // blue-500
            case 'cancelled': return '#ef4444'; // red-500
            case 'noShow': return '#f59e0b'; // amber-500
            default: return '#6366f1'; // indigo-500 (scheduled)
        }
    };

    // Transform appointments to FullCalendar events
    // Transform appointments to FullCalendar events
    const events = useMemo(() => {
        if (!appointments || !Array.isArray(appointments)) return [];

        return appointments
            .filter(appt => appt && appt.date && appt.time)
            .map(appt => {
                try {
                    // Calculate end time based on duration stored in notes or default 30 min
                    let duration = 30; // default
                    if (appt.notes && appt.notes.includes('[duration:')) {
                        const match = appt.notes.match(/\[duration:(\d+)\]/);
                        if (match) duration = parseInt(match[1]);
                    }

                    // Parse start date safely
                    let dateStr = appt.date;
                    if (dateStr.includes('T')) dateStr = dateStr.split('T')[0];
                    else if (dateStr.includes(' ')) dateStr = dateStr.split(' ')[0];

                    const startInfo = `${dateStr}T${appt.time}`;
                    const start = new Date(startInfo);

                    if (isNaN(start.getTime())) return null;

                    // Calculate end date
                    const end = new Date(start.getTime() + duration * 60000);

                    return {
                        id: appt.id,
                        title: `${appt.patientName} ${appt.reason ? `- ${appt.reason}` : ''}`,
                        start: start,
                        end: end,
                        backgroundColor: getEventColor(appt),
                        borderColor: getEventColor(appt),
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
    }, [appointments]);

    // Custom render for List View to match screenshot
    const renderEventContent = (eventInfo) => {
        if (eventInfo.view.type === 'listDay' || eventInfo.view.type.includes('list')) {
            const appt = eventInfo.event.extendedProps;
            const doctorName = appt.doctor?.name || appt.doctorId || 'Sin asignar';

            return (
                <div className="flex items-center justify-between w-full p-2">
                    <div className="flex-1">
                        <span className="font-bold text-slate-800 dark:text-white mr-2">{appt.patientName}</span>
                        <div className="text-sm text-slate-500">Tel: {appt.phone}</div>
                    </div>
                    <div className="flex-1 text-slate-600 dark:text-slate-300">
                        {doctorName}
                    </div>
                    <div className="flex-1">
                        <span className={`px-2 py-1 rounded-full text-xs text-white uppercase bg-[${eventInfo.event.backgroundColor}]`}>
                            {appt.status}
                        </span>
                    </div>
                    {/* Situación / Acciones placeholders */}
                    <div className="flex gap-2">
                        <button className="px-3 py-1 bg-green-600 text-white rounded text-xs">Diagnóstico</button>
                    </div>
                </div>
            );
        }
        return null; // Default render for grid views
    };

    const handleDateSelect = (selectInfo) => {
        // Convert to our format
        const date = selectInfo.startStr.split('T')[0];
        const time = selectInfo.start.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

        onDateSelect({ date, time });

        // Clear selection
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
        // Calculate new duration in minutes
        const diffMs = event.end - event.start;
        const newDuration = Math.round(diffMs / 60000);

        onEventResize({
            id: event.id,
            duration: newDuration,
            oldEvent: event.extendedProps
        });
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 h-[800px]">
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
    );
};

export default AdvancedCalendar;
