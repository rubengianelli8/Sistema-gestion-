import { ReactNode } from "react";
import { DashboardShell } from "./dashboard-shell";
import { HeaderUserInfo } from "./header";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <DashboardShell headerContent={<HeaderUserInfo />}>
      {children}
    </DashboardShell>
  );
}
