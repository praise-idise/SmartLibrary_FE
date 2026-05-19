import {
  createRouter,
  createRootRoute,
  createRoute,
  redirect,
} from "@tanstack/react-router";
import { getAuthUser, isAuthenticated } from "@/auth/session";
import { APP_ROLES } from "@/auth/roles";
import { AuthLayout } from "@/layouts/AuthLayout";
import { AppShellLayout } from "@/layouts/AppShellLayout";
import { RootLayout } from "@/layouts/RootLayout";
import { BookDetailPage } from "@/pages/app/BookDetailPage";
import { BooksPage } from "@/pages/app/BooksPage";
import { DashboardPage } from "@/pages/app/DashboardPage";
import { LoginPage } from "@/pages/auth/LoginPage";
import { SignupPage } from "@/pages/auth/SignupPage";
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "@/pages/auth/ResetPasswordPage";
import { VerifyEmailPage } from "@/pages/auth/VerifyEmailPage";
import { LandingPage } from "@/pages/LandingPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { LoansPage } from "@/pages/app/LoansPage";
import { SettingsPage } from "@/pages/app/SettingsPage";
import { AdminBooksPage } from "@/pages/app/admin/AdminBooksPage";
import { AdminBorrowRequestsPage } from "@/pages/app/admin/AdminBorrowRequestsPage";
import { AdminReservationsPage } from "@/pages/app/admin/AdminReservationsPage";
import { AdminUsersPage } from "@/pages/app/admin/AdminUsersPage";

type AuthSearch = {
  email?: string;
  token?: string;
};

const parseAuthSearch = (search: Record<string, unknown>): AuthSearch => {
  const next: AuthSearch = {};

  if (typeof search.email === "string") {
    next.email = search.email;
  }

  if (typeof search.token === "string") {
    next.token = search.token;
  }

  return next;
};

const rootRoute = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
});

const landingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: LandingPage,
});

const authLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/auth",
  component: AuthLayout,
});

const loginRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: "/login",
  component: LoginPage,
  beforeLoad: () => {
    if (isAuthenticated()) {
      throw redirect({ to: "/app/dashboard" });
    }
  },
});

const registerRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: "/register",
  component: SignupPage,
  beforeLoad: () => {
    if (isAuthenticated()) {
      throw redirect({ to: "/app/dashboard" });
    }
  },
});

const signupAliasRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: "/signup",
  beforeLoad: () => {
    throw redirect({ to: "/auth/register" });
  },
});

const forgotPasswordRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: "/forgot-password",
  component: ForgotPasswordPage,
  beforeLoad: () => {
    if (isAuthenticated()) {
      throw redirect({ to: "/app/dashboard" });
    }
  },
});

const resetPasswordRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: "/reset-password",
  component: ResetPasswordPage,
  validateSearch: parseAuthSearch,
  beforeLoad: () => {
    if (isAuthenticated()) {
      throw redirect({ to: "/app/dashboard" });
    }
  },
});

const verifyEmailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/verify-email",
  component: VerifyEmailPage,
  validateSearch: parseAuthSearch,
});

const resetPasswordCompatRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/reset-password",
  validateSearch: parseAuthSearch,
  beforeLoad: ({ search }) => {
    throw redirect({ to: "/auth/reset-password", search });
  },
});

const forgotPasswordCompatRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/forgot-password",
  beforeLoad: () => {
    throw redirect({ to: "/auth/forgot-password" });
  },
});

const appShellRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/app",
  component: AppShellLayout,
  beforeLoad: () => {
    if (!isAuthenticated()) {
      throw redirect({ to: "/auth/login" });
    }
  },
});

const dashboardRoute = createRoute({
  getParentRoute: () => appShellRoute,
  path: "/dashboard",
  component: DashboardPage,
});

const booksRoute = createRoute({
  getParentRoute: () => appShellRoute,
  path: "/books",
  component: BooksPage,
});

const bookDetailRoute = createRoute({
  getParentRoute: () => appShellRoute,
  path: "/books/$bookId",
  component: BookDetailPage,
});

const borrowsRoute = createRoute({
  getParentRoute: () => appShellRoute,
  path: "/borrows",
  component: LoansPage,
});

const settingsRoute = createRoute({
  getParentRoute: () => appShellRoute,
  path: "/settings",
  component: SettingsPage,
});

const adminGuard = () => {
  const authUser = getAuthUser();
  if (!authUser?.roles?.includes(APP_ROLES.ADMIN)) {
    throw redirect({ to: "/app/dashboard" });
  }
};

const adminIndexRoute = createRoute({
  getParentRoute: () => appShellRoute,
  path: "/admin",
  beforeLoad: () => {
    adminGuard();
    throw redirect({ to: "/app/admin/books" });
  },
});

const adminBooksRoute = createRoute({
  getParentRoute: () => appShellRoute,
  path: "/admin/books",
  component: AdminBooksPage,
  beforeLoad: adminGuard,
});

const adminBorrowRequestsRoute = createRoute({
  getParentRoute: () => appShellRoute,
  path: "/admin/borrow-requests",
  component: AdminBorrowRequestsPage,
  beforeLoad: adminGuard,
});

const adminReservationsRoute = createRoute({
  getParentRoute: () => appShellRoute,
  path: "/admin/reservations",
  component: AdminReservationsPage,
  beforeLoad: adminGuard,
});

const adminUsersRoute = createRoute({
  getParentRoute: () => appShellRoute,
  path: "/admin/users",
  component: AdminUsersPage,
  beforeLoad: adminGuard,
});

const routeTree = rootRoute.addChildren([
  landingRoute,
  verifyEmailRoute,
  resetPasswordCompatRoute,
  forgotPasswordCompatRoute,
  authLayoutRoute.addChildren([
    loginRoute,
    registerRoute,
    signupAliasRoute,
    forgotPasswordRoute,
    resetPasswordRoute,
  ]),
  appShellRoute.addChildren([
    dashboardRoute,
    booksRoute,
    bookDetailRoute,
    borrowsRoute,
    settingsRoute,
    adminIndexRoute,
    adminBooksRoute,
    adminBorrowRequestsRoute,
    adminReservationsRoute,
    adminUsersRoute,
  ]),
]);

export const router = createRouter({ routeTree });

// Augment the TanStack Router module with our router type for full type-safety.
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
