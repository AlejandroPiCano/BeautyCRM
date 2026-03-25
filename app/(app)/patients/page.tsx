import type { Metadata } from "next";
import { Suspense } from "react";
import { getPatients } from "@/lib/queries";
import { Header } from "@/components/layout/header";
import { PatientsTable } from "@/components/patients/patients-table";
import { TableSkeleton } from "@/components/dashboard/skeletons";

export const metadata: Metadata = { title: "Pacientes" };

interface PageProps {
  searchParams: Promise<{ search?: string; page?: string; new?: string }>;
}

export default async function PatientsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const search = params.search ?? "";
  const page = Number(params.page ?? "1");

  return (
    <>
      <Header title="Pacientes" />
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 animate-fade-in">
        <Suspense key={`${search}-${page}`} fallback={<TableSkeleton />}>
          <PatientsLoader search={search} page={page} openNew={params.new === "1"} />
        </Suspense>
      </div>
    </>
  );
}

async function PatientsLoader({
  search,
  page,
  openNew,
}: {
  search: string;
  page: number;
  openNew: boolean;
}) {
  const { data, total, pages } = await getPatients(search, page);
  return (
    <PatientsTable
      patients={data}
      total={total}
      pages={pages}
      page={page}
      search={search}
      openNew={openNew}
    />
  );
}
