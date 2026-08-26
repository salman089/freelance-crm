export const CURRENCIES = ["USD", "EUR", "GBP", "INR", "CAD", "AUD", "JPY"] as const;

export function formatMoney(amountInMinorUnits: number, currency: string) {
  const isZeroDecimal = currency === "JPY";
  const amount = isZeroDecimal ? amountInMinorUnits : amountInMinorUnits / 100;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: isZeroDecimal ? 0 : 2,
  }).format(amount);
}

export function toMinorUnits(amount: number, currency: string) {
  return currency === "JPY" ? Math.round(amount) : Math.round(amount * 100);
}

export function toMajorUnits(amountInMinorUnits: number, currency: string) {
  return currency === "JPY" ? amountInMinorUnits : amountInMinorUnits / 100;
}
