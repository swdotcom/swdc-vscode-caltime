import { getUnixTime, endOfWeek, startOfWeek } from "date-fns";

export function getThisWeek(isUnix: boolean = true) {
  const d: Date = new Date();
  const start = isUnix ? getUnixTime(startOfWeek(d)) : startOfWeek(d);
  const end = isUnix ? getUnixTime(endOfWeek(d)) : endOfWeek(d);
  return { start, end };
}
