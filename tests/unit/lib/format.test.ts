import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatRelativeTime,
  formatCurrency,
  formatNumber,
  formatBytes,
  truncate,
} from '@/lib/utils/format';

describe('Format Utilities', () => {
  describe('formatDate', () => {
    it('formats date with default format', () => {
      const date = new Date('2024-12-24');
      const formatted = formatDate(date);
      expect(formatted).toContain('December');
      expect(formatted).toContain('24');
      expect(formatted).toContain('2024');
    });

    it('accepts custom format string', () => {
      const date = new Date('2024-12-24');
      const formatted = formatDate(date, 'yyyy-MM-dd');
      expect(formatted).toBe('2024-12-24');
    });

    it('handles string date input', () => {
      const formatted = formatDate('2024-06-15', 'MMM d');
      expect(formatted).toBe('Jun 15');
    });
  });

  describe('formatRelativeTime', () => {
    it('formats recent time as relative', () => {
      const recent = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
      const formatted = formatRelativeTime(recent);
      expect(formatted).toContain('minutes ago');
    });

    it('formats yesterday correctly', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const formatted = formatRelativeTime(yesterday);
      expect(formatted).toContain('Yesterday');
    });
  });

  describe('formatCurrency', () => {
    it('formats USD by default', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
    });

    it('formats different currencies', () => {
      expect(formatCurrency(1234.56, 'EUR', 'de-DE')).toContain('€');
      expect(formatCurrency(1234.56, 'GBP', 'en-GB')).toContain('£');
    });

    it('handles zero', () => {
      expect(formatCurrency(0)).toBe('$0.00');
    });

    it('handles negative amounts', () => {
      expect(formatCurrency(-50)).toBe('-$50.00');
    });
  });

  describe('formatBytes', () => {
    it('formats bytes', () => {
      expect(formatBytes(0)).toBe('0 Bytes');
      expect(formatBytes(500)).toBe('500 Bytes');
    });

    it('formats kilobytes', () => {
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1536)).toBe('1.5 KB');
    });

    it('formats megabytes', () => {
      expect(formatBytes(1048576)).toBe('1 MB');
      expect(formatBytes(5242880)).toBe('5 MB');
    });

    it('formats gigabytes', () => {
      expect(formatBytes(1073741824)).toBe('1 GB');
    });

    it('respects decimal places', () => {
      expect(formatBytes(1536, 0)).toBe('2 KB');
      expect(formatBytes(1536, 3)).toBe('1.5 KB');
    });
  });

  describe('truncate', () => {
    it('truncates long strings', () => {
      const longText = 'This is a very long string that needs to be truncated';
      expect(truncate(longText, 20)).toBe('This is a very long...');
    });

    it('does not truncate short strings', () => {
      const shortText = 'Short';
      expect(truncate(shortText, 20)).toBe('Short');
    });

    it('uses default length of 100', () => {
      const text = 'a'.repeat(150);
      const truncated = truncate(text);
      expect(truncated.length).toBe(103); // 100 + '...'
    });
  });
});
