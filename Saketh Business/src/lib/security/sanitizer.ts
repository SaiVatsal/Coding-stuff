// ============================================================
// NITRO HUB: Security & Input Sanitization Utilities
// ============================================================

export function sanitizeText(input?: string | null): string {
  if (!input) return '';
  return input
    .replace(/[&<>"']/g, (match) => {
      const escapeMap: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
      };
      return escapeMap[match] || match;
    })
    .trim();
}

export function isValidIndianPincode(pincode: string): boolean {
  return /^[1-9][0-9]{5}$/.test(pincode.trim());
}

export function isValidIndianPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s-+()]/g, '');
  return /^(91)?[6-9]\d{9}$/.test(cleaned);
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function sanitizeQuantity(quantity: any, maxStock: number = 10): number {
  const parsed = parseInt(String(quantity), 10);
  if (isNaN(parsed) || parsed < 1) return 1;
  return Math.min(parsed, Math.max(1, maxStock), 10);
}
