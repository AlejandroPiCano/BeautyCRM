import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppLayoutClient } from "@/components/layout/app-layout-client";
import { SessionProvider } from "next-auth/react";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <SessionProvider session={session}>
      <AppLayoutClient>{children}</AppLayoutClient>
    </SessionProvider>
  );
}
