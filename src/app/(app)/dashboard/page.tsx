import { getDashboardStats } from "@/features/transactions/actions";
import { DashboardClient } from "@/features/dashboard/components/dashboard-client";

export default async function DashboardPage() {
  const stats = await getDashboardStats();
  return <DashboardClient initialStats={stats} />;
}
