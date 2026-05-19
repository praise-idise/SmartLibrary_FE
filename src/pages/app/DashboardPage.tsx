import { useMutation, useQuery } from "@tanstack/react-query";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, toast } from "@/components/ui";
import { useAuth } from "@/hooks/use-auth";
import { exportDashboardReport, fetchDashboardAnalytics } from "@/services/dashboard.service";
import { getApiErrorMessage } from "@/api/types";
import { getStatusBadgeClassName } from "@/lib/status-badge";

function triggerBrowserDownload(blob: Blob, fileName: string) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

export function DashboardPage() {
  const { isAdmin } = useAuth();

  const analyticsQuery = useQuery({
    queryKey: ["dashboard-analytics"],
    queryFn: fetchDashboardAnalytics,
  });

  const exportMutation = useMutation({
    mutationFn: exportDashboardReport,
    onSuccess: ({ blob, fileName }) => {
      triggerBrowserDownload(blob, fileName ?? "dashboard-report");
      toast.success("Report downloaded.");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Unable to export report."));
    },
  });

  const analytics = analyticsQuery.data?.data;

  return (
    <main className="space-y-6">
      <div>
        <Badge variant="outline" className="mb-3 border-primary/30 bg-primary/10 text-primary">
          SmartLibrary Overview
        </Badge>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {isAdmin
            ? "Admin analytics for borrowing performance, fines, and user behavior."
            : "Your personal borrowing trends and borrow activity."}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => exportMutation.mutate("csv")} disabled={exportMutation.isPending}>
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => exportMutation.mutate("pdf")} disabled={exportMutation.isPending}>
            Export PDF
          </Button>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="bg-surface/95">
          <CardHeader>
            <CardTitle className="text-base">Active Borrows</CardTitle>
            <CardDescription>Open borrows currently in circulation.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{analytics?.activeLoans ?? 0}</p>
          </CardContent>
        </Card>

        <Card className="bg-surface/95">
          <CardHeader>
            <CardTitle className="text-base">Overdue Borrows</CardTitle>
            <CardDescription>Borrows past due date or marked overdue.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{analytics?.overdueLoans ?? 0}</p>
          </CardContent>
        </Card>

        <Card className="bg-surface/95">
          <CardHeader>
            <CardTitle className="text-base">Total Fine Amount</CardTitle>
            <CardDescription>Accumulated fines in current scope.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{(analytics?.totalFineAmount ?? 0).toFixed(2)}</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="bg-surface/95">
          <CardHeader>
            <CardTitle>Borrow Trends</CardTitle>
            <CardDescription>Borrow count over the last 7 days.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {(analytics?.borrowTrends ?? []).map((point) => (
              <div key={point.date} className="flex items-center justify-between rounded-md border border-border p-2">
                <span className="text-sm text-muted-foreground">{new Date(point.date).toLocaleDateString()}</span>
                <Badge variant="outline">{point.totalBorrows}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-surface/95">
          <CardHeader>
            <CardTitle>Most Borrowed Books</CardTitle>
            <CardDescription>Top books by borrow count.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {(analytics?.mostBorrowedBooks ?? []).map((book) => (
              <div key={book.bookId} className="flex items-center justify-between rounded-md border border-border p-2">
                <span className="text-sm">{book.title}</span>
                <Badge variant="warning">{book.borrowCount}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="bg-surface/95">
          <CardHeader>
            <CardTitle>Overdue and Fine Records</CardTitle>
            <CardDescription>Recent high-priority overdue and fine entries.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {(analytics?.overdueFineRecords ?? []).map((record) => (
              <div key={record.borrowRecordId} className="rounded-md border border-border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{record.bookTitle}</p>
                    <p className="text-xs text-muted-foreground">User {record.userId}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className={getStatusBadgeClassName(record.status)}>{record.status}</Badge>
                    <Badge variant="outline" className={record.fineAmount > 0 ? getStatusBadgeClassName("OVERDUE") : ""}>
                      Fine: {record.fineAmount.toFixed(2)}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
