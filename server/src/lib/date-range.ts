const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

type DateParts = {
  year: number;
  month: number;
  day: number;
};

const parseDateOnly = (value: string): DateParts => {
  const match = DATE_ONLY_PATTERN.exec(value);
  if (!match) {
    throw new Error('Date must use YYYY-MM-DD format');
  }

  const parts = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
  const candidate = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  if (
    candidate.getUTCFullYear() !== parts.year ||
    candidate.getUTCMonth() !== parts.month - 1 ||
    candidate.getUTCDate() !== parts.day
  ) {
    throw new Error('Date is not a valid calendar date');
  }

  return parts;
};

const addCalendarDay = (parts: DateParts): DateParts => {
  const next = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + 1));
  return {
    year: next.getUTCFullYear(),
    month: next.getUTCMonth() + 1,
    day: next.getUTCDate(),
  };
};

const zonedMidnightToUtc = (parts: DateParts, timeZone: string): Date => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  const targetUtc = Date.UTC(parts.year, parts.month - 1, parts.day);
  let candidate = targetUtc;

  // A second pass handles the rare case where the first offset crosses a DST boundary.
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const formatted = Object.fromEntries(
      formatter
        .formatToParts(new Date(candidate))
        .filter((part) => part.type !== 'literal')
        .map((part) => [part.type, Number(part.value)])
    );
    const representedUtc = Date.UTC(
      formatted.year,
      formatted.month - 1,
      formatted.day,
      formatted.hour,
      formatted.minute,
      formatted.second
    );
    candidate += targetUtc - representedUtc;
  }

  return new Date(candidate);
};

export const isValidTimeZone = (value: string): boolean => {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
};

export const buildLocalDateRange = (input: {
  startDate?: string;
  endDate?: string;
  timeZone: string;
}) => {
  const startParts = input.startDate ? parseDateOnly(input.startDate) : null;
  const endParts = input.endDate ? parseDateOnly(input.endDate) : null;

  return {
    ...(startParts && { gte: zonedMidnightToUtc(startParts, input.timeZone) }),
    ...(endParts && {
      lt: zonedMidnightToUtc(addCalendarDay(endParts), input.timeZone),
    }),
  };
};
