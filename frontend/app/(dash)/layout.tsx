import DashboardProvider from "@/components/layout/DashboardProvider";
import DashboardShell from "@/components/layout/DashboardShell";

export default function DashLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardProvider>
      <DashboardShell>{children}</DashboardShell>
    </DashboardProvider>
  );
}
