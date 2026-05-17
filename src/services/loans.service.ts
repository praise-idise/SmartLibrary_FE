import { apiClient } from "@/api/client";
import type { BorrowRequest, Loan, Reservation } from "@/api/types";

export async function borrowBook(bookId: string) {
  return apiClient.post<BorrowRequest>(`/loans/borrow/${bookId}`, {});
}

export async function reserveBook(bookId: string) {
  return apiClient.post<Reservation>(`/loans/reserve/${bookId}`, {});
}

export async function returnBook(borrowRecordId: string) {
  return apiClient.post<Loan>(`/loans/return/${borrowRecordId}`, {});
}

export async function fetchMyLoans(pageNumber = 1, pageSize = 10) {
  return apiClient.getPaginated<Loan>("/loans/my-loans", {
    pageNumber,
    pageSize,
  });
}

export async function fetchMyLoanHistory(pageNumber = 1, pageSize = 10) {
  return apiClient.getPaginated<Loan>("/loans/my-history", {
    pageNumber,
    pageSize,
  });
}

export async function fetchMyBorrowRequests(pageNumber = 1, pageSize = 20) {
  return apiClient.getPaginated<BorrowRequest>("/loans/my-borrow-requests", {
    pageNumber,
    pageSize,
  });
}

export async function fetchMyReservations(pageNumber = 1, pageSize = 20) {
  return apiClient.getPaginated<Reservation>("/loans/my-reservations", {
    pageNumber,
    pageSize,
  });
}

export async function fetchPendingBorrowRequests(
  pageNumber = 1,
  pageSize = 50,
) {
  return apiClient.getPaginated<BorrowRequest>(
    "/loans/admin/pending-borrow-requests",
    { pageNumber, pageSize },
  );
}

export async function approveBorrowRequest(
  borrowRequestId: string,
  reason?: string,
) {
  return apiClient.post<BorrowRequest>(
    `/loans/admin/borrow-requests/${borrowRequestId}/approve`,
    { reason },
  );
}

export async function rejectBorrowRequest(
  borrowRequestId: string,
  reason?: string,
) {
  return apiClient.post<BorrowRequest>(
    `/loans/admin/borrow-requests/${borrowRequestId}/reject`,
    { reason },
  );
}

export async function fetchReservationQueue(
  pageNumber = 1,
  pageSize = 50,
  bookId?: string,
) {
  return apiClient.getPaginated<Reservation>("/loans/admin/reservations", {
    pageNumber,
    pageSize,
    ...(bookId ? { bookId } : {}),
  });
}

export async function fulfillReservation(
  reservationId: string,
  reason?: string,
) {
  return apiClient.post<Reservation>(
    `/loans/admin/reservations/${reservationId}/fulfill`,
    { reason },
  );
}

export async function rejectReservation(
  reservationId: string,
  reason?: string,
) {
  return apiClient.post<Reservation>(
    `/loans/admin/reservations/${reservationId}/reject`,
    { reason },
  );
}
