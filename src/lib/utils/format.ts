/**
 * Formatting utilities for dates and file sizes
 */

import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';

/**
 * Format a date as relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | string | number): string {
  const d = new Date(date);

  if (isToday(d)) {
    return formatDistanceToNow(d, { addSuffix: true });
  }

  if (isYesterday(d)) {
    return `Yesterday at ${format(d, 'h:mm a')}`;
  }

  return format(d, 'MMM d, yyyy');
}

/**
 * Format bytes to human readable size
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
