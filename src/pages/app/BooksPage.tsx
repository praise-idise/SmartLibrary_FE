import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { BOOK_AVAILABILITY_STATUS, BOOK_CATEGORY_OPTIONS, BORROW_REQUEST_STATUS, RESERVATION_STATUS, type BookAvailabilityStatus } from "@/lib/domain-values";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, toast } from "@/components/ui";
import { borrowBook, fetchMyBorrowRequests, fetchMyReservations, reserveBook } from "@/services/loans.service";
import { fetchBooks } from "@/services/books.service";
import { getApiErrorMessage } from "@/api/types";
import { getStatusBadgeClassName } from "@/lib/status-badge";
import { formatIsbn } from "@/lib/isbn";

const availabilityOptions = Object.values(BOOK_AVAILABILITY_STATUS);

export function BooksPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState("");
  const [year, setYear] = useState("");
  const [availability, setAvailability] = useState<"" | BookAvailabilityStatus>("");
  const [pageNumber, setPageNumber] = useState(1);

  const filters = useMemo(
    () => ({
      pageNumber,
      pageSize: 24,
      search: search || undefined,
      author: author || undefined,
      category: category || undefined,
      year: year ? Number(year) : undefined,
      availability: availability || undefined,
    }),
    [search, author, category, year, availability, pageNumber],
  );

  const booksQuery = useQuery({
    queryKey: ["books", filters],
    queryFn: () => fetchBooks(filters),
  });

  const borrowRequestsQuery = useQuery({
    queryKey: ["my-borrow-requests"],
    queryFn: () => fetchMyBorrowRequests(1, 50),
  });

  const reservationsQuery = useQuery({
    queryKey: ["my-reservations"],
    queryFn: () => fetchMyReservations(1, 50),
  });

  const pendingBookIds = useMemo(
    () => new Set((borrowRequestsQuery.data?.data ?? []).filter((r) => r.status === BORROW_REQUEST_STATUS.PENDING).map((r) => r.bookId)),
    [borrowRequestsQuery.data],
  );

  const reservedBookIds = useMemo(
    () => new Set((reservationsQuery.data?.data ?? []).filter((r) => r.status === RESERVATION_STATUS.PENDING).map((r) => r.bookId)),
    [reservationsQuery.data],
  );

  const borrowMutation = useMutation({
    mutationFn: (bookId: string) => borrowBook(bookId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      queryClient.invalidateQueries({ queryKey: ["my-borrow-requests"] });
      queryClient.invalidateQueries({ queryKey: ["my-loans"] });
      toast.success("Borrow request submitted for librarian approval.");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Unable to submit borrow request."));
    },
  });

  const reserveMutation = useMutation({
    mutationFn: (bookId: string) => reserveBook(bookId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      queryClient.invalidateQueries({ queryKey: ["my-reservations"] });
      toast.success("Reservation queued successfully.");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Unable to submit reservation."));
    },
  });

  const pagination = booksQuery.data?.pagination;
  const currentPage = pagination?.pageNumber ?? pagination?.currentPage ?? 1;
  const totalPages = pagination?.totalPages ?? 1;

  return (
    <main className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Browse Books</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Search by title, author, category, year, and availability.
        </p>
      </header>

      <Card className="bg-surface/95">
        <CardHeader>
          <CardTitle>Search Filters</CardTitle>
          <CardDescription>Use one or more fields to refine catalog results.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-5">
          <div className="space-y-1">
            <Label htmlFor="search">Search</Label>
            <Input id="search" placeholder="Title, ISBN, author" value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="author">Author</Label>
            <Input id="author" value={author} onChange={(event) => setAuthor(event.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">All</option>
              {BOOK_CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="year">Year</Label>
            <Input id="year" type="number" value={year} onChange={(event) => setYear(event.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="availability">Availability</Label>
            <select
              id="availability"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={availability}
              onChange={(event) => setAvailability(event.target.value as "" | BookAvailabilityStatus)}
            >
              <option value="">All</option>
              {availabilityOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {booksQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading books...</p>
      ) : booksQuery.isError ? (
        <p className="text-sm text-destructive">Failed to load books. Please refresh.</p>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(booksQuery.data?.data ?? []).map((book) => (
            <Card key={book.bookId} className="overflow-hidden bg-surface/95">
              <div className="aspect-4/3 w-full bg-muted">
                {book.coverImageUrl ? (
                  <img src={book.coverImageUrl} alt={book.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                    Cover image not available
                  </div>
                )}
              </div>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-lg">{book.title}</CardTitle>
                  <Badge variant="outline" className={getStatusBadgeClassName(book.availabilityStatus)}>
                    {book.availabilityStatus}
                  </Badge>
                </div>
                <CardDescription>
                  {book.author} &middot; {book.category.replace(/_/g, " ")} &middot; {book.publicationYear}
                  {book.isbn && <span className="block text-xs">ISBN: {formatIsbn(book.isbn)}</span>}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {book.availableCopies} of {book.totalCopies} copies available
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link
                    to="/app/books/$bookId"
                    params={{ bookId: book.bookId }}
                    className="inline-flex h-10 flex-1 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium whitespace-nowrap"
                  >
                    Details
                  </Link>
                  <Button
                    className="flex-1 whitespace-nowrap"
                    disabled={pendingBookIds.has(book.bookId) || book.availabilityStatus !== BOOK_AVAILABILITY_STATUS.AVAILABLE || borrowMutation.isPending}
                    onClick={() => borrowMutation.mutate(book.bookId)}
                  >
                    {pendingBookIds.has(book.bookId) ? "Request Pending" : "Request Borrow"}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 whitespace-nowrap"
                    disabled={reservedBookIds.has(book.bookId) || book.availabilityStatus === BOOK_AVAILABILITY_STATUS.AVAILABLE || reserveMutation.isPending}
                    onClick={() => reserveMutation.mutate(book.bookId)}
                  >
                    {reservedBookIds.has(book.bookId) ? "Reserved" : "Reserve"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={() => setPageNumber((p) => Math.max(1, p - 1))} disabled={currentPage <= 1}>
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">Page {currentPage} of {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setPageNumber((p) => p + 1)} disabled={currentPage >= totalPages}>
            Next
          </Button>
        </div>
      )}
    </main>
  );
}
