import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { ScheduleCalendar } from "@/components/schedule/schedule-calendar";
import { getStaffList, getTreatmentTypes, getPatients } from "@/lib/queries";

export const metadata: Metadata = { title: "Agenda" };

interface PageProps {
  searchParams: Promise<{ new?: string }>;
}

export default async function SchedulePage({ searchParams }: PageProps) {
  const params = await searchParams;

  const [staffList, treatmentTypes, patientsResult] = await Promise.all([
    getStaffList(),
    getTreatmentTypes(),
    getPatients(undefined, 1, 200),
  ]);

  return (
    <>
      <Header title="Agenda" />
      <div className="p-4 sm:p-6 animate-fade-in">
        <ScheduleCalendar
          staffList={staffList}
          treatmentTypes={treatmentTypes}
          patients={patientsResult.data}
          openNew={params.new === "1"}
        />
      </div>
    </>
  );
}
