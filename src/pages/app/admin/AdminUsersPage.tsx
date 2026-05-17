import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isApiError } from "@/api/types";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, toast } from "@/components/ui";
import { activateUser, deactivateUser, deleteUser, fetchUserBorrowHistory, fetchUsers } from "@/services/admin.service";
import { getStatusBadgeClassName } from "@/lib/status-badge";
import { AdminSubNav } from "@/pages/app/admin/AdminSubNav";

export function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [pageNumber, setPageNumber] = useState(1);

  const usersQuery = useQuery({
    queryKey: ["admin-users", pageNumber],
    queryFn: () => fetchUsers(pageNumber, 15),
  });

  const historyQuery = useQuery({
    queryKey: ["admin-user-borrow-history", selectedUserId],
    queryFn: () => fetchUserBorrowHistory(selectedUserId ?? "", 1, 20),
    enabled: !!selectedUserId,
  });

  const deactivateMutation = useMutation({
    mutationFn: deactivateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User deactivated.");
    },
    onError: (error) => {
      toast.error(isApiError(error) ? error.message : "Unable to deactivate user.");
    },
  });

  const activateMutation = useMutation({
    mutationFn: activateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User activated.");
    },
    onError: (error) => {
      toast.error(isApiError(error) ? error.message : "Unable to activate user.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      if (selectedUserId === userId) setSelectedUserId(null);
      toast.success("User deleted.");
    },
    onError: (error) => {
      toast.error(isApiError(error) ? error.message : "Unable to delete user.");
    },
  });

  const allUsers = usersQuery.data?.data ?? [];
  const pagination = usersQuery.data?.pagination;
  const currentPage = pagination?.pageNumber ?? pagination?.currentPage ?? 1;
  const totalPages = pagination?.totalPages ?? 1;

  const filteredUsers = search
    ? allUsers.filter(
        (u) =>
          u.email.toLowerCase().includes(search.toLowerCase()) ||
          u.fullName.toLowerCase().includes(search.toLowerCase()),
      )
    : allUsers;

  return (
    <main className="space-y-6">
      <AdminSubNav />

      <header>
        <h1 className="text-2xl font-semibold tracking-tight">User Management</h1>
        <p className="mt-1 text-sm text-muted-foreground">Activate, deactivate, delete users, and review borrowing history.</p>
      </header>

      <Card className="bg-surface/95">
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>{allUsers.length} registered user(s).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="user-search">Search</Label>
            <Input
              id="user-search"
              placeholder="Search by name or email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="md:max-w-sm"
            />
          </div>

          {usersQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading users...</p>
          ) : filteredUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">{search ? "No matching users." : "No users found."}</p>
          ) : (
            filteredUsers.map((user) => (
              <div key={user.userId} className="rounded-md border border-border p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{user.fullName || user.email}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge variant="outline" className={getStatusBadgeClassName(user.isActive ? "ACTIVE" : "DEACTIVATED")}>
                        {user.isActive ? "Active" : "Deactivated"}
                      </Badge>
                      <Badge variant="outline">Joined {new Date(user.createdAt).toLocaleDateString()}</Badge>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => setSelectedUserId(user.userId)}>View History</Button>
                    {user.isActive ? (
                      <Button size="sm" variant="destructive" onClick={() => deactivateMutation.mutate(user.userId)} disabled={deactivateMutation.isPending}>Deactivate</Button>
                    ) : (
                      <Button size="sm" onClick={() => activateMutation.mutate(user.userId)} disabled={activateMutation.isPending}>Activate</Button>
                    )}
                    <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(user.userId)} disabled={deleteMutation.isPending}>Delete</Button>
                  </div>
                </div>

                {selectedUserId === user.userId && (
                  <div className="mt-3 rounded-md border border-border p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="font-medium">Borrow History</p>
                      <Button variant="outline" size="sm" onClick={() => setSelectedUserId(null)}>Close</Button>
                    </div>
                    {historyQuery.isLoading ? (
                      <p className="text-sm text-muted-foreground">Loading history...</p>
                    ) : (historyQuery.data?.data ?? []).length === 0 ? (
                      <p className="text-sm text-muted-foreground">No borrow history.</p>
                    ) : (
                      <div className="space-y-2">
                        {(historyQuery.data?.data ?? []).map((record) => (
                          <div key={record.borrowRecordId} className="rounded-md border border-border p-3">
                            <p className="font-medium">{record.book?.title ?? "Book"}</p>
                            <p className="text-xs text-muted-foreground">
                              Borrowed {new Date(record.borrowedAt).toLocaleDateString()} &middot; Due {new Date(record.dueDate).toLocaleDateString()}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <Badge variant="outline" className={getStatusBadgeClassName(record.status)}>{record.status}</Badge>
                              <Badge variant="outline" className={record.fineAmount > 0 ? getStatusBadgeClassName("OVERDUE") : ""}>Fine: NGN {record.fineAmount.toFixed(2)}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-3">
              <Button variant="outline" size="sm" onClick={() => setPageNumber((p) => Math.max(1, p - 1))} disabled={currentPage <= 1}>
                Previous
              </Button>
              <span className="text-xs text-muted-foreground">Page {currentPage} of {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPageNumber((p) => p + 1)} disabled={currentPage >= totalPages}>
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
