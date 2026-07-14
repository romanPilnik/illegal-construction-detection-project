import {
  exportByDateRangeBodySchema,
  getAnalysesQuerySchema,
} from '../validation/analysis.validation.js';
import { getUsersQuerySchema } from '../validation/user.validation.js';

describe('API validation contracts', () => {
  it('accepts date-only export ranges from the client', () => {
    expect(
      exportByDateRangeBodySchema.safeParse({
        format: 'PDF',
        start_date: '2026-07-01',
        end_date: '2026-07-14',
        time_zone: 'Asia/Jerusalem',
      }).success
    ).toBe(true);
  });

  it('rejects reversed and malformed analysis ranges', () => {
    expect(
      getAnalysesQuerySchema.safeParse({
        start_date: '2026-07-15',
        end_date: '2026-07-14',
      }).success
    ).toBe(false);
    expect(
      getAnalysesQuerySchema.safeParse({ start_date: '14-07-2026' }).success
    ).toBe(false);
  });

  it('accepts only the supported active-user filters', () => {
    expect(getUsersQuerySchema.safeParse({ isActiveFilter: '0' }).success).toBe(
      true
    );
    expect(getUsersQuerySchema.safeParse({ isActiveFilter: '1' }).success).toBe(
      true
    );
    expect(getUsersQuerySchema.safeParse({ isActiveFilter: '2' }).success).toBe(
      false
    );
  });
});
