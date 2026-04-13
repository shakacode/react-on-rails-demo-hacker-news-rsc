export function timeAgo(input: number): string {
  const seconds = Math.max(0, Math.floor((Date.now() - input) / 1000));

  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h`;
  }

  const days = Math.floor(hours / 24);
  if (days < 30) {
    return `${days}d`;
  }

  const months = Math.floor(days / 30);
  if (months < 12) {
    return `${months}mo`;
  }

  return `${Math.floor(months / 12)}y`;
}

export function formatAbsoluteDate(input: number): string {
  return new Date(input).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function pluralize(count: number, singular: string): string {
  return count === 1 ? singular : `${singular}s`;
}
