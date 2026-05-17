function stripIsbn(isbn: string) {
  return isbn.replace(/[-\s]/g, "");
}

export function formatIsbn(isbn: string | null | undefined): string {
  if (!isbn) return "";
  const digits = stripIsbn(isbn);
  if (digits.length !== 13) return isbn;
  // Format as 978-3-16-148410-0
  return `${digits.slice(0, 3)}-${digits[3]}-${digits.slice(4, 6)}-${digits.slice(6, 12)}-${digits[12]}`;
}

export function isValidIsbn(isbn: string): boolean {
  const digits = stripIsbn(isbn).replace(/\D/g, "");
  if (digits.length !== 13) return false;
  if (!digits.startsWith("978") && !digits.startsWith("979")) return false;

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(digits[i], 10);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(digits[12], 10);
}
