
import React, { useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
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
    const events = appointments.map(appt => {
        // Calculate end time based on duration stored in notes or default 30 min
        let duration = 30; // default
        if (appt.notes && appt.notes.includes('[duration:')) {
            const match = appt.notes.match(/\[duration:(\d+)\]/);
            if (match) duration = parseInt(match[1]);
        }

        // Parse start date
        const start = new Date(`${appt.date.split('T')[0]}T${appt.time}`);
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
    });

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
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="timeGridWeek"
                headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay'
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
