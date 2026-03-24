import type { Metadata } from "next";
import { Suspense } from "react";
import { Header } from "@/components/layout/header";
import { getStaffList, getTreatmentTypes } from "@/lib/queries";
import { SettingsClient } from "@/components/settings/settings-client";
import { TableSkeleton } from "@/components/dashboard/skeletons";

export const metadata: Metadata = { title: "Configuración" };

export default async function SettingsPage() {
  const [staffList, treatmentTypes] = await Promise.all([
    getStaffList(),
    getTreatmentTypes(),
  ]);

  return (
    <>
      <Header title="Configuración" />
      <div className="p-6 space-y-8 animate-fade-in">
        <Suspense fallback={<TableSkeleton rows={4} />}>
          <SettingsClient staffList={staffList} treatmentTypes={treatmentTypes} />
        </Suspense>
      </div>
    </>
  );
}
