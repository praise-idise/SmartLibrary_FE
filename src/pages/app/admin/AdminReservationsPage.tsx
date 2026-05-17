import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isApiError } from "@/api/types";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Label, Textarea, toast } from "@/components/ui";
import { fetchReservationQueue, fulfillReservation, rejectReservation } from "@/services/loans.service";
import { getStatusBadgeClassName } from "@/lib/status-badge";
import { AdminSubNav } from "@/pages/app/admin/AdminSubNav";

export function AdminReservationsPage() {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");

  const query = useQuery({
    queryKey: ["admin-reservation-queue"],
    queryFn: () => fetchReservationQueue(1, 50),
  });

  const fulfillMutation = useMutation({
    mutationFn: (reservationId: string) => fulfillReservation(reservationId, reason || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reservation-queue"] });
      queryClient.invalidateQueries({ queryKey: ["my-reservations"] });
      queryClient.invalidateQueries({ queryKey: ["my-loans"] });
      queryClient.invalidateQueries({ queryKey: ["books"] });
      setReason("");
      toast.success("Reservation fulfilled.");
    },
    onError: (error) => {
      toast.error(isApiError(error) ? error.message : "Unable to fulfill reservation.");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (reservationId: string) => rejectReservation(reservationId, reason || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reservation-queue"] });
      queryClient.invalidateQueries({ queryKey: ["my-reservations"] });
      setReason("");
      toast.success("Reservation rejected.");
    },
    onError: (error) => {
      toast.error(isApiError(error) ? error.message : "Unable to reject reservation.");
    },
  });

  const reservations = query.data?.data ?? [];

  return (
    <main className="space-y-6">
      <AdminSubNav />

      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Reservation Queue</h1>
        <p className="mt-1 text-sm text-muted-foreground">Fulfill or reject queued reservations based on availability.</p>
      </header>

      <Card className="bg-surface/95">
        <CardHeader>
          <CardTitle>Active Reservations</CardTitle>
          <CardDescription>{reservations.length} reservation(s) in the queue.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="reservation-reason">Decision Reason (optional)</Label>
            <Textarea
              id="reservation-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Optional reason for this decision"
            />
          </div>

          {query.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading reservations...</p>
          ) : reservations.length === 0 ? (
            <p className="text-sm text-muted-foreground">No reservations in the queue.</p>
          ) : (
            reservations.map((res) => (
              <div key={res.bookReservationId} className="rounded-md border border-border p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{res.book?.title ?? "Book"}</p>
                    <p className="text-xs text-muted-foreground">
                      Requested by {res.userId} &middot; Queue #{res.queuePosition}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={getStatusBadgeClassName(res.status)}>{res.status}</Badge>
                    <Button size="sm" onClick={() => fulfillMutation.mutate(res.bookReservationId)} disabled={fulfillMutation.isPending}>Fulfill</Button>
                    <Button size="sm" variant="destructive" onClick={() => rejectMutation.mutate(res.bookReservationId)} disabled={rejectMutation.isPending}>Reject</Button>
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
