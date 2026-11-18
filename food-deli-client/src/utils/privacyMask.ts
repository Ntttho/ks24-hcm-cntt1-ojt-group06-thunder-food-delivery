/**
 * Privacy Masking Utilities for User, Driver and Customer Contact Protection
 */

/**
 * Mask phone number for privacy display (e.g., 0987654321 -> 098***4321 or 0987654***)
 * @param phone Raw phone string
 * @param mode 'middle' (masks 3 middle digits) or 'last3' (masks last 3 digits)
 * @returns Clean masked string, or '-' if invalid/empty
 */
export function maskPhoneNumber(phone?: string | null, mode: 'middle' | 'last3' = 'middle'): string {
  if (!phone) return '-';
  const clean = phone.trim().replace(/\s+/g, '');
  if (clean.length < 7) return clean;

  if (mode === 'last3') {
    return clean.slice(0, -3) + '***';
  }

  // Middle masking (keeps first 3-4 digits and last 3-4 digits, masks 3 middle digits)
  if (clean.length === 10) {
    return `${clean.slice(0, 3)}***${clean.slice(6)}`;
  }
  if (clean.length === 11) {
    return `${clean.slice(0, 4)}***${clean.slice(7)}`;
  }

  // Fallback for custom length
  const mid = Math.floor(clean.length / 2);
  const start = clean.slice(0, Math.max(2, mid - 1));
  const end = clean.slice(Math.min(clean.length - 2, mid + 2));
  return `${start}***${end}`;
}

/**
 * Mask customer full name for public reviews (e.g. "Nguyễn Tuấn Tài" -> "Nguyễn T*** Tài" or "N*** Tài")
 */
export function maskFullName(name?: string | null): string {
  if (!name) return 'Khách hàng';
  const trimmed = name.trim();
  const parts = trimmed.split(/\s+/);
  if (parts.length <= 1) {
    return trimmed.length > 2 ? `${trimmed[0]}***${trimmed.slice(-1)}` : trimmed;
  }
  const first = parts[0];
  const last = parts[parts.length - 1];
  return `${first} ${last.charAt(0)}***`;
}

/**
 * Get 1-2 uppercase letters from name for avatar initials
 */
export function getInitials(name?: string | null): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Get consistent color palette based on name string hash
 */
export function getAvatarColor(name?: string | null): string {
  if (!name) return '#f97316'; // default orange
  const colors = [
    '#f97316', // orange
    '#3b82f6', // blue
    '#10b981', // emerald
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#eab308', // amber
    '#14b8a6', // teal
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}
