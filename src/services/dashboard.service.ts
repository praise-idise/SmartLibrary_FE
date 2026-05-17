import { apiClient } from "@/api/client";
import type { DashboardAnalytics } from "@/api/types";

export async function fetchDashboardAnalytics() {
  return apiClient.get<DashboardAnalytics>("/dashboard/analytics");
}

export async function exportDashboardReport(format: "csv" | "pdf") {
  return apiClient.download("/dashboard/export", { format });
}
