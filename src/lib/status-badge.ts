const badgeToneClassMap = {
  neutral: "border-border bg-muted text-muted-foreground",
  warning: "border-amber-600/45 bg-amber-500/35 text-amber-900 dark:text-amber-100",
  success: "border-emerald-600/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  info: "border-primary/20 bg-primary/10 text-primary",
  danger: "border-destructive/20 bg-destructive/10 text-destructive",
} as const;

const statusBadgeClassMap: Record<string, string> = {
  available: badgeToneClassMap.success,
  borrowed: badgeToneClassMap.warning,
  reserved: badgeToneClassMap.info,
  pending: badgeToneClassMap.warning,
  approved: badgeToneClassMap.success,
  rejected: badgeToneClassMap.danger,
  cancelled: badgeToneClassMap.danger,
  fulfilled: badgeToneClassMap.success,
  active: badgeToneClassMap.success,
  returned: badgeToneClassMap.neutral,
  overdue: badgeToneClassMap.danger,
};

function normalizeStatusKey(status: string) {
  return status.replace(/[^a-zA-Z]/g, "").toLowerCase();
}

export function formatStatusLabel(status: string) {
  return status
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim();
}

export function getStatusBadgeClassName(status: string) {
  return (
    statusBadgeClassMap[normalizeStatusKey(status)] ?? badgeToneClassMap.neutral
  );
}
