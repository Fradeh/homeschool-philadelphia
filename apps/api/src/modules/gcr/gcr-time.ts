export const GCR_TIME_ZONE = "America/Panama";

const DAY_MS = 86_400_000;

export function parseDateOnly(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) throw new Error("Invalid date format");
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error("Invalid calendar date");
  }
  return date;
}

export function formatDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * DAY_MS);
}

export function mondayOfWeek(date: Date) {
  const weekday = date.getUTCDay();
  const daysSinceMonday = weekday === 0 ? 6 : weekday - 1;
  return addDays(date, -daysSinceMonday);
}

export function weekNumberWithinTerm(weekStart: Date, termStart: Date) {
  const firstTermWeek = mondayOfWeek(termStart);
  return Math.floor((weekStart.getTime() - firstTermWeek.getTime()) / (7 * DAY_MS)) + 1;
}

export function panamaDeadline(reportDate: string) {
  const date = parseDateOnly(reportDate);
  return zonedDateTimeToUtc(
    {
      year: date.getUTCFullYear(),
      month: date.getUTCMonth() + 1,
      day: date.getUTCDate(),
      hour: 10,
      minute: 0,
      second: 0
    },
    GCR_TIME_ZONE
  );
}

export function isLateSubmission(reportDate: string, submittedAt: Date) {
  return submittedAt.getTime() > panamaDeadline(reportDate).getTime();
}

export function isRapidAttendanceClosed(reportDate: string, checkedAt: Date) {
  const date = parseDateOnly(reportDate);
  const deadline = zonedDateTimeToUtc(
    {
      year: date.getUTCFullYear(),
      month: date.getUTCMonth() + 1,
      day: date.getUTCDate(),
      hour: 10,
      minute: 0,
      second: 0
    },
    GCR_TIME_ZONE
  );
  return checkedAt.getTime() >= deadline.getTime();
}

function zonedDateTimeToUtc(
  parts: { year: number; month: number; day: number; hour: number; minute: number; second: number },
  timeZone: string
) {
  const desiredAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  });
  const formatted = Object.fromEntries(
    formatter
      .formatToParts(new Date(desiredAsUtc))
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)])
  );
  const representedAsUtc = Date.UTC(
    formatted.year,
    formatted.month - 1,
    formatted.day,
    formatted.hour,
    formatted.minute,
    formatted.second
  );
  return new Date(desiredAsUtc + (desiredAsUtc - representedAsUtc));
}
