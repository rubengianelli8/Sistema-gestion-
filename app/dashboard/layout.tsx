import { ReactNode } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { HeaderUserInfo } from "@/components/layout/header";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <DashboardShell headerContent={<HeaderUserInfo />}>
      {children}
    </DashboardShell>
  );
}
