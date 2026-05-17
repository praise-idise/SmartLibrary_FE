import { useEffect, useRef, useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ImagePlus } from "lucide-react";
import { getApiErrorMessage, type Book } from "@/api/types";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, ConfirmDialog, Input, Label, Textarea, toast } from "@/components/ui";
import { createBook, deleteBook, fetchBooks, updateBook, type UpsertBookInput } from "@/services/books.service";
import { getStatusBadgeClassName } from "@/lib/status-badge";
import { AdminSubNav } from "@/pages/app/admin/AdminSubNav";
import { BOOK_CATEGORY_OPTIONS } from "@/lib/domain-values";
import { isValidIsbn, formatIsbn } from "@/lib/isbn";

const bookSchema = z.object({
  title: z.string().min(1, "Title is required."),
  author: z.string().min(1, "Author is required."),
  category: z.string().min(1, "Category is required."),
  isbn: z.string().min(1, "ISBN is required.").refine(isValidIsbn, "Enter a valid ISBN-13 (13 digits, starting with 978 or 979)."),
  publicationYear: z.coerce.number().int("Must be a whole number.").min(1800, "Enter a valid year."),
  description: z.string().min(1, "Description is required."),
  totalCopies: z.coerce.number().int("Must be a whole number.").min(1, "Must be at least 1."),
});

type BookFormValues = z.infer<typeof bookSchema>;
type BookFormInputValues = z.input<typeof bookSchema>;

const defaultValues: BookFormValues = {
  title: "",
  author: "",
  category: "",
  isbn: "",
  publicationYear: new Date().getFullYear(),
  description: "",
  totalCopies: 1,
};

export function AdminBooksPage() {
  const queryClient = useQueryClient();
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const formCardRef = useRef<HTMLDivElement | null>(null);

  const [pageNumber, setPageNumber] = useState(1);
  const [mode, setMode] = useState<"create" | "edit" | null>(null);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
  const [existingCoverUrl, setExistingCoverUrl] = useState<string | null>(null);
  const [isCoverDragActive, setIsCoverDragActive] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Book | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BookFormInputValues, undefined, BookFormValues>({
    resolver: zodResolver(bookSchema),
    defaultValues,
  });

  useEffect(() => {
    return () => {
      if (coverPreviewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(coverPreviewUrl);
      }
    };
  }, [coverPreviewUrl]);

  const booksQuery = useQuery({
    queryKey: ["admin-books", pageNumber],
    queryFn: () => fetchBooks({ pageNumber, pageSize: 10 }),
  });

  const createMutation = useMutation({
    mutationFn: createBook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-books"] });
      queryClient.invalidateQueries({ queryKey: ["books"] });
      closeForm();
      toast.success("Book created successfully.");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Unable to create book."));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ bookId, payload }: { bookId: string; payload: UpsertBookInput }) => updateBook(bookId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-books"] });
      queryClient.invalidateQueries({ queryKey: ["books"] });
      closeForm();
      toast.success("Book updated successfully.");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Unable to update book."));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-books"] });
      queryClient.invalidateQueries({ queryKey: ["books"] });
      toast.success("Book deleted.");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Unable to delete book."));
    },
  });

  const books = useMemo(() => booksQuery.data?.data ?? [], [booksQuery.data]);
  const pagination = booksQuery.data?.pagination;
  const currentPage = pagination?.pageNumber ?? pagination?.currentPage ?? 1;
  const totalPages = pagination?.totalPages ?? 1;
  const totalRecords = pagination?.totalRecords ?? books.length;

  function closeForm() {
    setMode(null);
    setEditingBook(null);
    reset(defaultValues);
    revokeCoverPreview();
    setCoverImage(null);
    setCoverPreviewUrl(null);
    setExistingCoverUrl(null);
    setIsCoverDragActive(false);
    if (coverInputRef.current) coverInputRef.current.value = "";
  }

  function openCreate() {
    closeForm();
    setMode("create");
    setTimeout(() => formCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  function openEdit(book: Book) {
    revokeCoverPreview();
    setCoverImage(null);
    setCoverPreviewUrl(null);
    setExistingCoverUrl(book.coverImageUrl ?? null);
    reset({
      title: book.title,
      author: book.author,
      category: book.category,
      isbn: book.isbn ?? "",
      publicationYear: book.publicationYear,
      description: book.description ?? "",
      totalCopies: book.totalCopies,
    });
    setMode("edit");
    setEditingBook(book);
    if (coverInputRef.current) coverInputRef.current.value = "";
    setTimeout(() => formCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  function revokeCoverPreview() {
    if (coverPreviewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(coverPreviewUrl);
    }
  }

  function handleCoverFile(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      return;
    }
    revokeCoverPreview();
    setCoverImage(file);
    setCoverPreviewUrl(URL.createObjectURL(file));
    setExistingCoverUrl(null);
    if (coverInputRef.current) coverInputRef.current.value = "";
  }

  function clearCover() {
    setCoverImage(null);
    setExistingCoverUrl(null);
    revokeCoverPreview();
    setCoverPreviewUrl(null);
    if (coverInputRef.current) coverInputRef.current.value = "";
  }

  function buildPayload(values: BookFormValues): UpsertBookInput {
    return {
      title: values.title.trim(),
      author: values.author.trim(),
      category: values.category.trim(),
      isbn: values.isbn.trim(),
      publicationYear: values.publicationYear,
      description: values.description.trim(),
      totalCopies: values.totalCopies,
      coverImage,
    };
  }

  const onSubmit: SubmitHandler<BookFormValues> = async (values) => {
    if (mode === "edit" && editingBook) {
      await updateMutation.mutateAsync({ bookId: editingBook.bookId, payload: buildPayload(values) });
    } else {
      await createMutation.mutateAsync(buildPayload(values));
    }
  };

  async function confirmDelete() {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.bookId);
    setDeleteTarget(null);
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <main className="space-y-6">
      <AdminSubNav />

      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Books Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">Maintain catalog records and inventory.</p>
        </div>
        {!mode && <Button onClick={openCreate}>Create Book</Button>}
      </header>

      {mode && (
        <div ref={formCardRef}>
          <Card className="bg-surface/95">
            <CardHeader>
              <CardTitle>{mode === "create" ? "Create Book" : "Edit Book"}</CardTitle>
              <CardDescription>
                {mode === "create" ? "Add a new book to SmartLibrary." : "Update details for the selected book."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="title" required>Title</Label>
                    <Input id="title" error={!!errors.title} {...register("title")} />
                    {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="author" required>Author</Label>
                    <Input id="author" error={!!errors.author} {...register("author")} />
                    {errors.author && <p className="text-xs text-destructive">{errors.author.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="category" required>Category</Label>
                    <select
                      id="category"
                      className={`h-10 w-full rounded-md border bg-background px-3 text-sm ${errors.category ? "border-destructive" : "border-input"}`}
                      {...register("category")}
                    >
                      <option value="">Select category</option>
                      {BOOK_CATEGORY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="isbn" required>ISBN</Label>
                    <Input id="isbn" error={!!errors.isbn} {...register("isbn")} />
                    {errors.isbn && <p className="text-xs text-destructive">{errors.isbn.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="publicationYear" required>Publication Year</Label>
                    <Input id="publicationYear" type="number" error={!!errors.publicationYear} {...register("publicationYear")} />
                    {errors.publicationYear && <p className="text-xs text-destructive">{errors.publicationYear.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="totalCopies" required>Total Copies</Label>
                    <Input id="totalCopies" type="number" min={1} error={!!errors.totalCopies} {...register("totalCopies")} />
                    {errors.totalCopies && <p className="text-xs text-destructive">{errors.totalCopies.message}</p>}
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <Label htmlFor="description" required>Description</Label>
                    <Textarea id="description" error={!!errors.description} {...register("description")} />
                    {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="cover">Cover Image</Label>
                    <input
                      ref={coverInputRef}
                      id="cover"
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => handleCoverFile(e.target.files?.[0] ?? null)}
                    />
                    <div
                      className={`rounded-lg border border-dashed p-4 transition-colors ${isCoverDragActive ? "border-primary bg-primary/5" : "border-border bg-muted/20"}`}
                      onDragOver={(e) => { e.preventDefault(); setIsCoverDragActive(true); }}
                      onDragLeave={(e) => { e.preventDefault(); setIsCoverDragActive(false); }}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsCoverDragActive(false);
                        handleCoverFile(Array.from(e.dataTransfer.files ?? [])[0] ?? null);
                      }}
                    >
                      <div className="flex flex-col items-center gap-2 text-center">
                        <ImagePlus className="size-6 text-muted-foreground" />
                        <p className="text-sm text-foreground">Drag and drop a cover image here</p>
                        <p className="text-xs text-muted-foreground">JPG, PNG, or WEBP</p>
                        <div className="flex gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={() => coverInputRef.current?.click()}>Browse File</Button>
                          {(coverPreviewUrl || existingCoverUrl || coverImage) && (
                            <Button type="button" variant="ghost" size="sm" onClick={clearCover}>Clear</Button>
                          )}
                        </div>
                      </div>
                    </div>
                    {(coverPreviewUrl || existingCoverUrl) && (
                      <div className="overflow-hidden rounded-lg border border-border bg-muted/20 sm:max-w-xs">
                        <img src={coverPreviewUrl ?? existingCoverUrl ?? undefined} alt="Cover preview" className="h-44 w-full object-cover" />
                      </div>
                    )}
                    {coverImage && <p className="text-xs text-muted-foreground">Selected file: {coverImage.name}</p>}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : mode === "create" ? "Create Book" : "Save Changes"}</Button>
                  <Button type="button" variant="outline" onClick={closeForm}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="bg-surface/95">
        <CardHeader>
          <CardTitle>Catalog</CardTitle>
          <CardDescription>{totalRecords} book(s) total</CardDescription>
        </CardHeader>
        <CardContent>
          {booksQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading catalog...</p>
          ) : booksQuery.isError ? (
            <p className="text-sm text-destructive">Unable to load books.</p>
          ) : books.length === 0 ? (
            <p className="text-sm text-muted-foreground">No books in the catalog yet.</p>
          ) : (
            <div className="space-y-3">
              <div className="space-y-4">
                {books.map((book) => (
                  <div key={book.bookId} className="flex flex-col gap-3 rounded-md border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{book.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {book.author} &middot; {book.category.replace(/_/g, " ")} &middot; {book.availableCopies}/{book.totalCopies} available
                        {book.isbn && <span className="block">ISBN: {formatIsbn(book.isbn)}</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getStatusBadgeClassName(book.availabilityStatus)}>
                        {book.availabilityStatus}
                      </Badge>
                      <Button variant="outline" size="sm" onClick={() => openEdit(book)}>Edit</Button>
                      <Button variant="destructive" size="sm" onClick={() => setDeleteTarget(book)} disabled={deleteMutation.isPending}>Delete</Button>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <Button variant="outline" size="sm" onClick={() => setPageNumber((p) => Math.max(1, p - 1))} disabled={currentPage <= 1}>
                    Previous
                  </Button>
                  <span className="text-xs text-muted-foreground">Page {currentPage} of {totalPages}</span>
                  <Button variant="outline" size="sm" onClick={() => setPageNumber((p) => p + 1)} disabled={currentPage >= totalPages}>
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Book"
        message={`Delete "${deleteTarget?.title}" from the catalog? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </main>
  );
}
