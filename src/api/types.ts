/** Standard envelope for all non-paginated API responses. */
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
}

/** Pagination metadata returned alongside list responses. */
export interface Pagination {
  currentPage?: number;
  pageNumber: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
}

/** Standard envelope for paginated list responses. */
export interface PaginatedApiResponse<T> extends ApiResponse<T[]> {
  pagination: Pagination;
}

/** Shape of error responses from the API. */
export interface ApiError {
  success: false;
  statusCode: number;
  message: string;
  /** Field-level validation errors keyed by property name. */
  errors?: Record<string, string[]>;
}

export interface LoginResponseDTO {
  token?: string | null;
  expiresAt: string;
  userId?: string | null;
  email?: string | null;
  roles?: string[] | null;
}

export interface RegisterDTO {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

export interface ForgotPasswordDTO {
  email: string;
}

export interface ResetPasswordDTO {
  email: string;
  token: string;
  newPassword: string;
}

export interface ChangePasswordDTO {
  currentPassword: string;
  newPassword: string;
}

export interface ResendVerificationDTO {
  email: string;
}

export interface ResendVerificationStatusDTO {
  cooldownSeconds: number;
  nextAllowedAt: string;
}

export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === "object" &&
    error !== null &&
    "success" in error &&
    (error as ApiError).success === false
  );
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (isApiError(error) && typeof error.message === "string" && error.message.trim().length > 0) {
    return error.message;
  }
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  if (typeof error === "object" && error !== null) {
    const obj = error as Record<string, unknown>;
    if (typeof obj.message === "string" && obj.message.trim().length > 0) {
      return obj.message;
    }
    // FluentValidation ProblemDetails format
    if (typeof obj.title === "string" && obj.title.trim().length > 0) {
      const errors = obj.errors as Record<string, string[]> | undefined;
      if (errors) {
        const firstError = Object.values(errors).flat()[0];
        if (firstError) return firstError;
      }
      return obj.title;
    }
  }
  return fallback;
}

import type { BookAvailabilityStatus, BorrowRequestStatus, LoanStatus, ReservationStatus } from "@/lib/domain-values";

export type { BookAvailabilityStatus, BorrowRequestStatus, LoanStatus, ReservationStatus };

export interface Book {
  bookId: string;
  title: string;
  author: string;
  category: string;
  publicationYear: number;
  availableCopies: number;
  totalCopies: number;
  availabilityStatus: BookAvailabilityStatus;
  coverImageUrl?: string | null;
  isbn?: string;
  description?: string;
}

export interface Loan {
  borrowRecordId: string;
  bookId: string;
  userId: string;
  borrowedAt: string;
  dueDate: string;
  returnedAt?: string | null;
  fineAmount: number;
  status: LoanStatus;
  book?: Book | null;
}

export interface BorrowRequest {
  borrowRequestId: string;
  bookId: string;
  userId: string;
  requestedAt: string;
  status: BorrowRequestStatus;
  processedAt?: string | null;
  processedByUserId?: string | null;
  librarianReason?: string | null;
  book?: Book | null;
}

export interface Reservation {
  bookReservationId: string;
  bookId: string;
  userId: string;
  requestedAt: string;
  status: ReservationStatus;
  processedAt?: string | null;
  processedByUserId?: string | null;
  librarianReason?: string | null;
  queuePosition: number;
  book?: Book | null;
}

export interface UserSummary {
  userId: string;
  email: string;
  fullName: string;
  isActive: boolean;
  createdAt: string;
}

export interface DashboardTrendPoint {
  date: string;
  totalBorrows: number;
}

export interface MostBorrowedBook {
  bookId: string;
  title: string;
  borrowCount: number;
}

export interface OverdueFineRecord {
  borrowRecordId: string;
  bookId: string;
  bookTitle: string;
  userId: string;
  borrowedAt: string;
  dueDate: string;
  fineAmount: number;
  status: LoanStatus;
}

export interface DashboardAnalytics {
  isAdminView: boolean;
  activeLoans: number;
  overdueLoans: number;
  returnedLoans: number;
  totalFineAmount: number;
  borrowTrends: DashboardTrendPoint[];
  mostBorrowedBooks: MostBorrowedBook[];
  overdueFineRecords: OverdueFineRecord[];
}
