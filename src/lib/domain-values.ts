export type ValueOf<T extends Record<string, string>> = T[keyof T];

export const BOOK_AVAILABILITY_STATUS = {
  AVAILABLE: "AVAILABLE",
  BORROWED: "BORROWED",
  RESERVED: "RESERVED",
} as const;
export type BookAvailabilityStatus = ValueOf<typeof BOOK_AVAILABILITY_STATUS>;

export const LOAN_STATUS = {
  ACTIVE: "ACTIVE",
  RETURNED: "RETURNED",
  OVERDUE: "OVERDUE",
} as const;
export type LoanStatus = ValueOf<typeof LOAN_STATUS>;

export const BORROW_REQUEST_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  CANCELLED: "CANCELLED",
} as const;
export type BorrowRequestStatus = ValueOf<typeof BORROW_REQUEST_STATUS>;

export const RESERVATION_STATUS = {
  PENDING: "PENDING",
  FULFILLED: "FULFILLED",
  REJECTED: "REJECTED",
  CANCELLED: "CANCELLED",
} as const;
export type ReservationStatus = ValueOf<typeof RESERVATION_STATUS>;

export const BOOK_CATEGORY = {
  FICTION: "FICTION",
  NON_FICTION: "NON_FICTION",
  SCIENCE: "SCIENCE",
  TECHNOLOGY: "TECHNOLOGY",
  HISTORY: "HISTORY",
  BIOGRAPHY: "BIOGRAPHY",
  SELF_HELP: "SELF_HELP",
  BUSINESS: "BUSINESS",
  PHILOSOPHY: "PHILOSOPHY",
  RELIGION: "RELIGION",
  ART: "ART",
  POETRY: "POETRY",
  DRAMA: "DRAMA",
  COMICS: "COMICS",
  CHILDREN: "CHILDREN",
  EDUCATION: "EDUCATION",
  REFERENCE: "REFERENCE",
  TRAVEL: "TRAVEL",
  COOKING: "COOKING",
  HEALTH: "HEALTH",
  SPORTS: "SPORTS",
  LAW: "LAW",
  POLITICS: "POLITICS",
  MUSIC: "MUSIC",
  OTHER: "OTHER",
} as const;
export type BookCategory = ValueOf<typeof BOOK_CATEGORY>;

export const BOOK_CATEGORY_OPTIONS = Object.entries(BOOK_CATEGORY).map(([, value]) => ({
  label: value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()).replace(/\s+/g, " "),
  value,
})) as readonly { label: string; value: BookCategory }[];
