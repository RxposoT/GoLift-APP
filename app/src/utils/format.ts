/**
 * Formats seconds into a human-readable duration string in Portuguese.
 * Returns "Xh Ym" for durations >= 1 hour, or "X min" for shorter durations.
 */
export function formatTime(seconds: number): string {
  if (typeof seconds !== "number" || isNaN(seconds) || seconds < 0) return "0 min";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes} min`;
}

/**
 * Formats a date string into a relative time description in Portuguese.
 * Returns strings like "hoje", "ontem", "há 3 dias", "há 2 sem.", "há 3 meses", "há 1 ano".
 * Returns null for invalid or missing dates.
 */
export function formatRelativeDate(
  dateStr: string | null | undefined,
): string | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "hoje";
  if (diffDays === 1) return "ontem";
  if (diffDays < 7) return `há ${diffDays} dias`;
  if (diffDays < 30) return `há ${Math.floor(diffDays / 7)} sem.`;
  if (diffDays < 365) return `há ${Math.floor(diffDays / 30)} meses`;
  const years = Math.floor(diffDays / 365);
  return `há ${years} ano${years > 1 ? "s" : ""}`;
}
