import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, toast } from "@/components/ui";
import { fetchBookById } from "@/services/books.service";
import { borrowBook, fetchMyBorrowRequests } from "@/services/loans.service";
import { BOOK_AVAILABILITY_STATUS, BORROW_REQUEST_STATUS } from "@/lib/domain-values";
import { getApiErrorMessage } from "@/api/types";
import { getStatusBadgeClassName } from "@/lib/status-badge";
import { formatIsbn } from "@/lib/isbn";

export function BookDetailPage() {
  const queryClient = useQueryClient();
  const { bookId } = useParams({ from: "/app/books/$bookId" });

  const query = useQuery({
    queryKey: ["book", bookId],
    queryFn: () => fetchBookById(bookId),
  });

  const borrowRequestsQuery = useQuery({
    queryKey: ["my-borrow-requests"],
    queryFn: () => fetchMyBorrowRequests(1, 50),
  });

  const hasPendingRequest = useMemo(
    () => (borrowRequestsQuery.data?.data ?? []).some((r) => r.bookId === bookId && r.status === BORROW_REQUEST_STATUS.PENDING),
    [borrowRequestsQuery.data, bookId],
  );

  const borrowMutation = useMutation({
    mutationFn: () => borrowBook(bookId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      queryClient.invalidateQueries({ queryKey: ["book", bookId] });
      queryClient.invalidateQueries({ queryKey: ["my-borrow-requests"] });
      queryClient.invalidateQueries({ queryKey: ["my-loans"] });
      toast.success("Borrow request submitted for librarian approval.");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Unable to submit borrow request."));
    },
  });

  const book = query.data?.data;

  return (
    <main className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Book Details</h1>
        <Link
          to="/app/books"
          className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium"
        >
          Back to books
        </Link>
      </div>

      {query.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading book details...</p>
      ) : query.isError || !book ? (
        <p className="text-sm text-destructive">Book not found.</p>
      ) : (
        <Card className="bg-surface/95">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>{book.title}</CardTitle>
                <CardDescription>
                  {book.author} &middot; {book.category.replace(/_/g, " ")} &middot; {book.publicationYear}
                </CardDescription>
              </div>
              <Badge variant="outline" className={getStatusBadgeClassName(book.availabilityStatus)}>
                {book.availabilityStatus}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-6 md:grid-cols-[240px_1fr]">
              <div className="overflow-hidden rounded-lg border border-border bg-muted">
                {book.coverImageUrl ? (
                  <img
                    src={book.coverImageUrl}
                    alt={book.title}
                    className="aspect-2/3 w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-2/3 items-center justify-center text-sm text-muted-foreground">
                    No cover available
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">{book.description}</p>

                <div className="grid gap-2 text-sm">
                  <div className="flex gap-2">
                    <span className="font-medium text-muted-foreground">ISBN:</span>
                    <span>{formatIsbn(book.isbn)}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-medium text-muted-foreground">Category:</span>
                    <span>{book.category.replace(/_/g, " ")}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-medium text-muted-foreground">Availability:</span>
                    <span>{book.availableCopies} of {book.totalCopies} copies</span>
                  </div>
                </div>

                <div className="pt-2">
                  {hasPendingRequest ? (
                    <Badge variant="outline" className="py-2.5">Borrow Request Pending</Badge>
                  ) : (
                    <Button
                      className="w-full sm:w-auto"
                      disabled={book.availabilityStatus !== BOOK_AVAILABILITY_STATUS.AVAILABLE || borrowMutation.isPending}
                      onClick={() => borrowMutation.mutate()}
                    >
                      Submit Borrow Request
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
