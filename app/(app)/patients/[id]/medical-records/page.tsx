import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getPatientById, getMedicalRecordsByPatient } from "@/lib/queries";
import { Header } from "@/components/layout/header";
import { MedicalRecordClient } from "@/components/medical-records/medical-record-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const patient = await getPatientById(id);
  return { title: patient ? `Historia · ${patient.nombre}` : "Historia clínica" };
}

export default async function MedicalRecordsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [patient, { historias, fotos }] = await Promise.all([
    getPatientById(id),
    getMedicalRecordsByPatient(id),
  ]);

  if (!patient) notFound();

  return (
    <>
      <Header />
      <div className="p-6 space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={`/patients/${id}`}
              aria-label="Volver al perfil del paciente"
              className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                Historia Clínica
              </h1>
              <p className="text-sm text-muted-foreground">{patient.nombre}</p>
            </div>
          </div>
        </div>

        <MedicalRecordClient
          patientId={id}
          patientName={patient.nombre}
          medicalRecords={historias}
          photos={fotos}
        />
      </div>
    </>
  );
}
