import { apiClient } from "@/api/client";
import type { Loan, UserSummary } from "@/api/types";

export async function fetchUsers(pageNumber = 1, pageSize = 20) {
  return apiClient.getPaginated<UserSummary>("/users", {
    pageNumber,
    pageSize,
  });
}

export async function deactivateUser(userId: string) {
  return apiClient.post<null>(`/users/${userId}/deactivate`, {});
}

export async function activateUser(userId: string) {
  return apiClient.post<null>(`/users/${userId}/activate`, {});
}

export async function deleteUser(userId: string) {
  return apiClient.delete<null>(`/users/${userId}`);
}

export async function fetchUserBorrowHistory(
  userId: string,
  pageNumber = 1,
  pageSize = 20,
  status?: string,
) {
  return apiClient.getPaginated<Loan>(`/users/${userId}/borrow-history`, {
    pageNumber,
    pageSize,
    ...(status ? { status } : {}),
  });
}
