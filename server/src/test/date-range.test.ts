import { buildLocalDateRange, isValidTimeZone } from '../lib/date-range.js';

describe('local date ranges', () => {
  it('uses local midnight boundaries in Asia/Jerusalem', () => {
    const range = buildLocalDateRange({
      startDate: '2026-07-14',
      endDate: '2026-07-14',
      timeZone: 'Asia/Jerusalem',
    });

    expect(range.gte?.toISOString()).toBe('2026-07-13T21:00:00.000Z');
    expect(range.lt?.toISOString()).toBe('2026-07-14T21:00:00.000Z');
  });

  it('accounts for winter daylight-saving offsets', () => {
    const range = buildLocalDateRange({
      startDate: '2026-01-14',
      endDate: '2026-01-14',
      timeZone: 'Asia/Jerusalem',
    });

    expect(range.gte?.toISOString()).toBe('2026-01-13T22:00:00.000Z');
    expect(range.lt?.toISOString()).toBe('2026-01-14T22:00:00.000Z');
  });

  it('recognizes valid and invalid IANA time zones', () => {
    expect(isValidTimeZone('Asia/Jerusalem')).toBe(true);
    expect(isValidTimeZone('not/a-time-zone')).toBe(false);
  });
});
