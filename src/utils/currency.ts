/**
 * Currency formatting utilities
 */

/**
 * Format a number as Norwegian Krone (NOK)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('nb-NO', {
    style: 'currency',
    currency: 'NOK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Get currency code (defaults to NOK)
 */
export function getCurrencyCode(): string {
  return 'NOK';
}




