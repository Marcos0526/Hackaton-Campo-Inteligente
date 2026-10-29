import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { metricsQueryKey } from "@/lib/api/contracts";
import { loadMetrics } from "@/lib/api/server";
import { getPreferences } from "@/lib/preferences";
import { requireSession } from "@/lib/session";

export const metadata = { title: "Panel" };

export default async function DashboardPage() {
  const session = await requireSession();
  const preferences = await getPreferences(session.user.id);
  const metrics = await loadMetrics({ range: preferences.dashboardRange });

  const queryClient = new QueryClient();
  queryClient.setQueryData(metricsQueryKey(preferences.dashboardRange), metrics);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardView
        userName={session.user.name}
        initialRange={preferences.dashboardRange}
        chartType={preferences.chartType}
      />
    </HydrationBoundary>
  );
}
