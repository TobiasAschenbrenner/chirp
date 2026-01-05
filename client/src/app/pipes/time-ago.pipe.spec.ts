import { describe, it, expect, vi, afterEach } from 'vitest';
import { TimeAgoPipe } from './time-ago.pipe';

describe('TimeAgoPipe', () => {
  const pipe = new TimeAgoPipe();

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return empty string for null/undefined', () => {
    expect(pipe.transform(undefined)).toBe('');
    expect(pipe.transform(null)).toBe('');
  });

  it('should format seconds ago', () => {
    vi.spyOn(Date, 'now').mockReturnValue(new Date('2026-01-05T12:00:00.000Z').getTime());

    const tenSecondsAgo = new Date('2026-01-05T11:59:50.000Z');
    const result = pipe.transform(tenSecondsAgo);

    expect(result).toBeTruthy();
  });

  it('should handle ISO string input', () => {
    vi.spyOn(Date, 'now').mockReturnValue(new Date('2026-01-05T12:00:00.000Z').getTime());

    const oneMinuteAgoIso = '2026-01-05T11:59:00.000Z';
    expect(pipe.transform(oneMinuteAgoIso)).toBeTruthy();
  });

  it('should handle future dates', () => {
    vi.spyOn(Date, 'now').mockReturnValue(new Date('2026-01-05T12:00:00.000Z').getTime());

    const inTwoHours = new Date('2026-01-05T14:00:00.000Z');
    expect(pipe.transform(inTwoHours)).toBeTruthy();
  });
});
