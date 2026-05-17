import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, toast } from "@/components/ui";
import { fetchMyBorrowRequests, fetchMyLoanHistory, fetchMyLoans, fetchMyReservations, returnBook } from "@/services/loans.service";
import { getApiErrorMessage } from "@/api/types";
import { RESERVATION_STATUS } from "@/lib/domain-values";
import { formatCnyCurrency } from "@/lib/currency";
import { getStatusBadgeClassName } from "@/lib/status-badge";

function Pagination({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between pt-2">
      <Button variant="outline" size="sm" onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page <= 1}>Previous</Button>
      <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
      <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>Next</Button>
    </div>
  );
}

export function LoansPage() {
  const queryClient = useQueryClient();
  const [activePage, setActivePage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);

  const activeQuery = useQuery({
    queryKey: ["my-loans", activePage],
    queryFn: () => fetchMyLoans(activePage, 10),
  });

  const historyQuery = useQuery({
    queryKey: ["my-loans-history", historyPage],
    queryFn: () => fetchMyLoanHistory(historyPage, 10),
  });

  const borrowRequestsQuery = useQuery({
    queryKey: ["my-borrow-requests"],
    queryFn: () => fetchMyBorrowRequests(1, 13),
  });

  const reservationsQuery = useQuery({
    queryKey: ["my-reservations"],
    queryFn: () => fetchMyReservations(1, 13),
  });

  const returnMutation = useMutation({
    mutationFn: (borrowRecordId: string) => returnBook(borrowRecordId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-loans"] });
      queryClient.invalidateQueries({ queryKey: ["my-loans-history"] });
      queryClient.invalidateQueries({ queryKey: ["books"] });
      toast.success("Book returned successfully.");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Unable to return book."));
    },
  });

  const activeLoans = activeQuery.data?.data ?? [];
  const activePagination = activeQuery.data?.pagination;
  const activeCurrentPage = activePagination?.pageNumber ?? activePagination?.currentPage ?? 1;
  const activeTotalPages = activePagination?.totalPages ?? 1;

  const historyLoans = historyQuery.data?.data ?? [];
  const historyPagination = historyQuery.data?.pagination;
  const historyCurrentPage = historyPagination?.pageNumber ?? historyPagination?.currentPage ?? 1;
  const historyTotalPages = historyPagination?.totalPages ?? 1;
  const myBorrowRequests = borrowRequestsQuery.data?.data ?? [];
  const myReservations = reservationsQuery.data?.data ?? [];

  return (
    <main className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">My Loans and History</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track active borrows, due dates, overdue fines, and returned books.
        </p>
      </header>

      <Card className="bg-surface/95">
        <CardHeader>
          <CardTitle>Active Loans</CardTitle>
          <CardDescription>Books currently borrowed by you.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {activeQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading active loans...</p>
          ) : activeLoans.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active loans found.</p>
          ) : (
            activeLoans.map((loan) => (
              <div key={loan.borrowRecordId} className="rounded-md border border-border p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{loan.book?.title ?? "Book"}</p>
                    <p className="text-xs text-muted-foreground">
                      Due: {new Date(loan.dueDate).toLocaleDateString()} • Fine: {formatCnyCurrency(loan.fineAmount)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={getStatusBadgeClassName(loan.status)}>{loan.status}</Badge>
                    <Button
                      size="sm"
                      onClick={() => returnMutation.mutate(loan.borrowRecordId)}
                      disabled={returnMutation.isPending}
                    >
                      Return
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
          <Pagination page={activeCurrentPage} totalPages={activeTotalPages} onPageChange={setActivePage} />
        </CardContent>
      </Card>

      <Card className="bg-surface/95">
        <CardHeader>
          <CardTitle>Borrow Requests</CardTitle>
          <CardDescription>Track librarian approval status for your requests.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {borrowRequestsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading borrow requests...</p>
          ) : myBorrowRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground">No borrow requests found.</p>
          ) : (
            myBorrowRequests.map((request) => (
              <div key={request.borrowRequestId} className="rounded-md border border-border p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{request.book?.title ?? "Book"}</p>
                    <p className="text-xs text-muted-foreground">
                      Requested: {new Date(request.requestedAt).toLocaleDateString()} {request.librarianReason ? `• Note: ${request.librarianReason}` : ""}
                    </p>
                  </div>
                  <Badge variant="outline" className={getStatusBadgeClassName(request.status)}>{request.status}</Badge>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="bg-surface/95">
        <CardHeader>
          <CardTitle>Reservation Queue</CardTitle>
          <CardDescription>See your queued reservations for unavailable books.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {reservationsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading reservations...</p>
          ) : myReservations.length === 0 ? (
            <p className="text-sm text-muted-foreground">No reservations found.</p>
          ) : (
            myReservations.map((reservation) => (
              <div key={reservation.bookReservationId} className="rounded-md border border-border p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{reservation.book?.title ?? "Book"}</p>
                    <p className="text-xs text-muted-foreground">
                      Requested: {new Date(reservation.requestedAt).toLocaleDateString()} {reservation.status === RESERVATION_STATUS.PENDING ? `· Queue position: ${reservation.queuePosition}` : ""}
                    </p>
                  </div>
                  <Badge variant="outline" className={getStatusBadgeClassName(reservation.status)}>{reservation.status}</Badge>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="bg-surface/95">
        <CardHeader>
          <CardTitle>Borrow History</CardTitle>
          <CardDescription>Returned books and completed loan records.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {historyQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading history...</p>
          ) : historyLoans.length === 0 ? (
            <p className="text-sm text-muted-foreground">No history records yet.</p>
          ) : (
            historyLoans.map((loan) => (
              <div key={loan.borrowRecordId} className="rounded-md border border-border p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{loan.book?.title ?? "Book"}</p>
                    <p className="text-xs text-muted-foreground">
                      Borrowed: {new Date(loan.borrowedAt).toLocaleDateString()} • Returned:{" "}
                      {loan.returnedAt ? new Date(loan.returnedAt).toLocaleDateString() : "-"}
                    </p>
                  </div>
                  <Badge variant="outline" className={getStatusBadgeClassName(loan.status)}>{loan.status}</Badge>
                </div>
              </div>
            ))
          )}
          <Pagination page={historyCurrentPage} totalPages={historyTotalPages} onPageChange={setHistoryPage} />
        </CardContent>
      </Card>
    </main>
  );
}
