const cnyCurrencyFormatter = new Intl.NumberFormat("zh-CN", {
  style: "currency",
  currency: "CNY",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCnyCurrency(value: number): string {
  return cnyCurrencyFormatter.format(value);
}
