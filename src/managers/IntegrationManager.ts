import { CalEvent } from "../models/CalEvent";
import { Integration } from "../models/Integration";
import { getIntegrations, syncIntegrations } from "./LocalManager";
import { isAfter, isToday, formatDistanceToNow } from "date-fns";

export function getCalendarIntegrations() {
  return getIntegrations().filter((n:Integration) => n.name.toLowerCase().includes("calendar") && n.status.toLowerCase() === "active" && n.access_token);
}

export function hasCalendarIntegrations() {
  return !!(getCalendarIntegrations().length);
}

export function clearCalendarIntegrations() {
  const filteredIntegrations = getIntegrations().filter((n:Integration) => !n.name.toLowerCase().includes("calendar"));
  syncIntegrations(filteredIntegrations);
}

export function getTimeUntilNextMeeting(calEvents: CalEvent[]): string {
  const now: Date = new Date();

  if (calEvents?.length) {
    for (const event of calEvents) {

      if (event.isProtected) {
        // its protected, no need to alert about this event block
        continue;
      }

      const startDate: Date = new Date(event.start);
      if (isAfter(startDate, now)) {
        if (isToday(startDate)) {
          // it's the same day, return it
          return formatDistanceToNow(startDate, { addSuffix: true });
        }
        break;
      }
    }
  }
  return "No upcoming meetings today";
}