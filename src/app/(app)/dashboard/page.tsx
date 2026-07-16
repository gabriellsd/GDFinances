import { getDashboardStats } from "@/features/transactions/actions";
import { DashboardView } from "@/features/dashboard/components/dashboard-view";

export default async function DashboardPage() {
  const stats = await getDashboardStats();
  return <DashboardView stats={stats} />;
}
