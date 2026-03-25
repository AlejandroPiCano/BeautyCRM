"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Calendar, dateFnsLocalizer, type View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay, addMinutes } from "date-fns";
import { es } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { createAppointment, updateAppointment, deleteAppointment, updateAppointmentStatus } from "@/lib/actions";
import { AppointmentModal } from "./appointment-modal";
import type { Patient, TreatmentType } from "@/lib/db/schema";
import "react-big-calendar/lib/css/react-big-calendar.css";

const locales = { es };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1 }),
  getDay,
  locales,
});

const messages = {
  allDay: "Todo el día",
  previous: "←",
  next: "→",
  today: "Hoy",
  month: "Mes",
  week: "Semana",
  day: "Día",
  agenda: "Agenda",
  date: "Fecha",
  time: "Hora",
  event: "Cita",
  noEventsInRange: "No hay citas en este período",
  showMore: (total: number) => `+${total} más`,
};

interface CalendarAppointment {
  id: string;
  fecha: Date;
  duracionMin: number;
  tipo: string;
  status: string;
  notas: string | null;
  pacienteNombre: string;
  pacienteId: string;
  staffNombre: string | null;
  staffId: string | null;
  tipoTratamientoNombre: string | null;
  tipoTratamientoColor: string | null;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: CalendarAppointment;
}

interface StaffUser {
  id: string;
  name: string | null;
  email: string;
  rol: string;
  image: string | null;
  activo: boolean;
}

interface Props {
  staffList: StaffUser[];
  treatmentTypes: TreatmentType[];
  patients: Patient[];
  openNew: boolean;
}

const statusColors: Record<string, string> = {
  pendiente: "#f59e0b",
  confirmada: "#10b981",
  cancelada: "#ef4444",
  completada: "#3b82f6",
};

export function ScheduleCalendar({ staffList, treatmentTypes, patients, openNew }: Props) {
  const router = useRouter();
  const [view, setView] = useState<View>("month");
  const [date, setDate] = useState(new Date());
  const [modalOpen, setModalOpen] = useState(openNew);
  const [selectedAppointment, setSelectedAppointment] = useState<CalendarAppointment | null>(null);
  const [newEventSlot, setNewEventSlot] = useState<{ start: Date; end: Date } | null>(null);
  const [drilldownDate, setDrilldownDate] = useState<Date | null>(null);
  const calendarContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = calendarContainerRef.current;
    if (!container) return;

    if (view === "day" || view === "week") {
      const handleTouchEnd = (e: TouchEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest(".rbc-event")) return;

        const touch = e.changedTouches[0];
        if (!touch) return;

        const timeContent = container.querySelector(".rbc-time-content") as HTMLElement | null;
        if (!timeContent) return;

        const rect = timeContent.getBoundingClientRect();
        const y = touch.clientY - rect.top + timeContent.scrollTop;
        const ratio = Math.max(0, Math.min(1, y / timeContent.scrollHeight));
        const totalMinutes = ratio * 24 * 60;
        const hours = Math.floor(totalMinutes / 60);
        const minutes = Math.floor((totalMinutes % 60) / 30) * 30;

        let touchedDate = new Date(date);

        if (view === "week") {
          const daySlots = container.querySelectorAll(".rbc-day-slot");
          const timeContentRect = timeContent.getBoundingClientRect();
          const x = touch.clientX - timeContentRect.left;
          const dayIndex = Math.floor((x / timeContentRect.width) * daySlots.length);
          const startOfWeekDate = new Date(date);
          startOfWeekDate.setDate(date.getDate() - ((date.getDay() + 6) % 7) + dayIndex);
          touchedDate = startOfWeekDate;
        }

        touchedDate.setHours(hours, minutes, 0, 0);
        setNewEventSlot({ start: new Date(touchedDate), end: addMinutes(touchedDate, 60) });
        setSelectedAppointment(null);
        setModalOpen(true);
        setDrilldownDate(null);
      };

      const daySlots = container.querySelectorAll(".rbc-day-slot");
      daySlots.forEach((slot) => slot.addEventListener("touchend", handleTouchEnd as EventListener));
      return () => {
        daySlots.forEach((slot) => slot.removeEventListener("touchend", handleTouchEnd as EventListener));
      };
    }

    if (view === "month") {
      const handleMonthTouchEnd = (e: TouchEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest(".rbc-event") || target.closest(".rbc-show-more") || target.closest(".rbc-date-cell")) return;

        const touch = e.changedTouches[0];
        if (!touch) return;

        const monthView = container.querySelector(".rbc-month-view") as HTMLElement | null;
        if (!monthView) return;

        const rows = Array.from(monthView.querySelectorAll(".rbc-month-row"));
        if (!rows.length) return;

        const touchedRowIndex = rows.findIndex((row) => {
          const rect = row.getBoundingClientRect();
          return touch.clientY >= rect.top && touch.clientY <= rect.bottom;
        });
        if (touchedRowIndex === -1) return;

        const monthViewRect = monthView.getBoundingClientRect();
        const x = touch.clientX - monthViewRect.left;
        const colIndex = Math.min(6, Math.floor((x / monthViewRect.width) * 7));

        const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        const daysFromMonday = (firstDayOfMonth.getDay() + 6) % 7;
        const viewStart = new Date(firstDayOfMonth);
        viewStart.setDate(viewStart.getDate() - daysFromMonday);

        const clickedDate = new Date(viewStart);
        clickedDate.setDate(viewStart.getDate() + touchedRowIndex * 7 + colIndex);
        clickedDate.setHours(9, 0, 0, 0);

        setNewEventSlot({ start: new Date(clickedDate), end: addMinutes(clickedDate, 60) });
        setSelectedAppointment(null);
        setModalOpen(true);
        setDrilldownDate(null);
      };

      const monthView = container.querySelector(".rbc-month-view");
      if (monthView) {
        monthView.addEventListener("touchend", handleMonthTouchEnd as EventListener);
        return () => monthView.removeEventListener("touchend", handleMonthTouchEnd as EventListener);
      }
    }
  }, [view, date]);

  const { data: appointments = [], refetch } = useQuery({
    queryKey: ["appointments", date.getFullYear(), date.getMonth()],
    queryFn: async () => {
      const start = new Date(date.getFullYear(), date.getMonth() - 1, 1);
      const end = new Date(date.getFullYear(), date.getMonth() + 2, 0);
      const res = await fetch(
        `/api/appointments?start=${start.toISOString()}&end=${end.toISOString()}`
      );
      if (!res.ok) throw new Error("Error cargando citas");
      return res.json() as Promise<CalendarAppointment[]>;
    },
    staleTime: 30_000,
  });

  const events: CalendarEvent[] = appointments.map((c) => ({
    id: c.id,
    title: `${c.pacienteNombre}${c.staffNombre ? ` · ${c.staffNombre}` : ""}`,
    start: new Date(c.fecha),
    end: addMinutes(new Date(c.fecha), c.duracionMin),
    resource: c as CalendarAppointment,
  }));

  const handleSelectSlot = useCallback(({ start, end }: { start: Date; end: Date }) => {
    setNewEventSlot({ start, end });
    setSelectedAppointment(null);
    setModalOpen(true);
    setDrilldownDate(null);
  }, []);

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedAppointment(event.resource);
    setNewEventSlot(null);
    setModalOpen(true);
    setDrilldownDate(null);
  }, []);

  const handleDrillDown = useCallback((date: Date) => {
    setDrilldownDate(date);
  }, []);

  const handleViewChange = useCallback((newView: View) => {
    setView(newView);
    if (newView === "day" && drilldownDate) {
      const now = new Date();
      const defaultStart = new Date(drilldownDate);
      defaultStart.setHours(now.getHours(), now.getMinutes(), 0, 0);
      setNewEventSlot({ start: defaultStart, end: addMinutes(defaultStart, 60) });
      setSelectedAppointment(null);
      setModalOpen(true);
      setDrilldownDate(null);
    }
  }, [drilldownDate]);

  const handleCreateAppointment = async (data: unknown) => {
    const result = await createAppointment(data);
    if ("error" in result && result.error) {
      toast.error("Error al crear la cita");
      return false;
    }
    toast.success("Cita creada correctamente");
    setModalOpen(false);
    void refetch();
    return true;
  };

  const handleUpdateAppointment = async (data: unknown) => {
    if (!selectedAppointment) return false;
    const result = await updateAppointment(selectedAppointment.id, data);
    if ("error" in result && result.error) {
      toast.error("Error al actualizar la cita");
      return false;
    }
    toast.success("Cita actualizada correctamente");
    setModalOpen(false);
    setSelectedAppointment(null);
    void refetch();
    return true;
  };

  const handleDeleteAppointment = async (id: string) => {
    await deleteAppointment(id);
    toast.success("Cita eliminada");
    setModalOpen(false);
    setSelectedAppointment(null);
    void refetch();
  };

  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    const color = event.resource.tipoTratamientoColor ??
      statusColors[event.resource.status] ?? "#3b82f6";
    return {
      style: {
        backgroundColor: `${color}20`,
        borderLeft: `3px solid ${color}`,
        color: "inherit",
        fontSize: "12px",
        fontWeight: 500,
      },
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 overflow-x-auto">
          <div className="flex gap-1.5 flex-nowrap sm:flex-wrap">
            {Object.entries(statusColors).map(([status, color]) => (
              <span key={status} className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: color }} aria-hidden="true" />
                <span className="hidden sm:inline">{status.charAt(0).toUpperCase() + status.slice(1)}</span>
              </span>
            ))}
          </div>
        </div>
        <button
          onClick={() => { 
            setSelectedAppointment(null); 
            const now = new Date();
            const defaultStart = new Date(date);
            defaultStart.setHours(now.getHours(), now.getMinutes(), 0, 0);
            setNewEventSlot({ start: defaultStart, end: addMinutes(defaultStart, 60) }); 
            setModalOpen(true); 
          }}
          aria-label="Nueva cita"
          className="flex items-center justify-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3.5 py-2 text-sm font-medium hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 flex-shrink-0"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span className="sm:inline">Nueva cita</span>
        </button>
      </div>

      {/* Calendar */}
      <div ref={calendarContainerRef} className="bg-card border border-border rounded-xl overflow-hidden shadow-xs p-2 sm:p-4">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          view={view}
          onView={handleViewChange}
          date={date}
          onNavigate={setDate}
          onDrillDown={handleDrillDown}
          selectable
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventStyleGetter}
          messages={messages}
          culture="es"
          style={{ height: typeof window !== 'undefined' && window.innerWidth < 640 ? 500 : 640 }}
          step={30}
          timeslots={2}
          aria-label="Calendario de citas"
        />
      </div>

      <AppointmentModal
        open={modalOpen}
        appointment={selectedAppointment}
        initialSlot={newEventSlot}
        patients={patients}
        staffList={staffList}
        treatmentTypes={treatmentTypes}
        onClose={() => { setModalOpen(false); setSelectedAppointment(null); setNewEventSlot(null); }}
        onSubmit={selectedAppointment ? handleUpdateAppointment : handleCreateAppointment}
        onDelete={selectedAppointment ? () => handleDeleteAppointment(selectedAppointment.id) : undefined}
        onStatusChange={async (status) => {
          if (!selectedAppointment) return;
          await updateAppointmentStatus(selectedAppointment.id, status);
          toast.success("Estado actualizado");
          void refetch();
          setModalOpen(false);
        }}
      />
    </div>
  );
}
