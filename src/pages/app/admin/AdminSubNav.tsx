import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/cn";

const sections = [
  { label: "Books", to: "/app/admin/books" },
  { label: "Borrow Requests", to: "/app/admin/borrow-requests" },
  { label: "Reservations", to: "/app/admin/reservations" },
  { label: "Users", to: "/app/admin/users" },
] as const;

export function AdminSubNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="flex flex-wrap gap-1 rounded-lg border border-border bg-surface/95 p-1">
      {sections.map((section) => (
        <Link
          key={section.to}
          to={section.to}
          className={cn(
            "inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            pathname === section.to
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          {section.label}
        </Link>
      ))}
    </nav>
  );
}
