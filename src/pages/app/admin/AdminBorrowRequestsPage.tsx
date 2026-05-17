import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getApiErrorMessage } from "@/api/types";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Label, Textarea, toast } from "@/components/ui";
import { approveBorrowRequest, fetchPendingBorrowRequests, rejectBorrowRequest } from "@/services/loans.service";
import { getStatusBadgeClassName } from "@/lib/status-badge";
import { AdminSubNav } from "@/pages/app/admin/AdminSubNav";

export function AdminBorrowRequestsPage() {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");

  const query = useQuery({
    queryKey: ["admin-pending-borrow-requests"],
    queryFn: () => fetchPendingBorrowRequests(1, 50),
  });

  const approveMutation = useMutation({
    mutationFn: (borrowRequestId: string) => approveBorrowRequest(borrowRequestId, reason || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pending-borrow-requests"] });
      queryClient.invalidateQueries({ queryKey: ["my-loans"] });
      queryClient.invalidateQueries({ queryKey: ["books"] });
      setReason("");
      toast.success("Borrow request approved.");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Unable to approve request."));
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (borrowRequestId: string) => {
      if (!reason.trim()) {
        toast.error("A reason is required to reject a request.");
        throw new Error("Reason required");
      }
      return rejectBorrowRequest(borrowRequestId, reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pending-borrow-requests"] });
      queryClient.invalidateQueries({ queryKey: ["my-borrow-requests"] });
      setReason("");
      toast.success("Borrow request rejected.");
    },
    onError: (error) => {
      if (error instanceof Error && error.message === "Reason required") return;
      toast.error(getApiErrorMessage(error, "Unable to reject request."));
    },
  });

  const requests = query.data?.data ?? [];

  return (
    <main className="space-y-6">
      <AdminSubNav />

      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Borrow Requests</h1>
        <p className="mt-1 text-sm text-muted-foreground">Approve or reject pending borrow requests.</p>
      </header>

      <Card className="bg-surface/95">
        <CardHeader>
          <CardTitle>Pending Requests</CardTitle>
          <CardDescription>{requests.length} request(s) awaiting decision.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="borrow-reason">Decision Reason (required for rejection)</Label>
            <Textarea
              id="borrow-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for this decision"
            />
          </div>

          {query.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading requests...</p>
          ) : requests.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending borrow requests.</p>
          ) : (
            requests.map((req) => (
              <div key={req.borrowRequestId} className="rounded-md border border-border p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{req.book?.title ?? "Book"}</p>
                    <p className="text-xs text-muted-foreground">
                      Requested by {req.userId} on {new Date(req.requestedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={getStatusBadgeClassName(req.status)}>{req.status}</Badge>
                    <Button size="sm" onClick={() => approveMutation.mutate(req.borrowRequestId)} disabled={approveMutation.isPending}>Approve</Button>
                    <Button size="sm" variant="destructive" onClick={() => rejectMutation.mutate(req.borrowRequestId)} disabled={rejectMutation.isPending}>Reject</Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </main>
  );
}
