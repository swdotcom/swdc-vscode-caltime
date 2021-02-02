import { isResponseOk, softwareGet } from "../client/HttpClient";
import { CalendarEventInfo } from "../models/CalendarEventInfo";
import { CalEvent } from "../models/CalEvent";
import { getThisWeek } from "../managers/UtilManager";

const queryString = require("query-string");

export async function getThisWeekCalendarEvents(): Promise<CalendarEventInfo> {
  const calEventInfo: CalendarEventInfo = new CalendarEventInfo();

  const qryStr = queryString.stringify(getThisWeek());

  const resp = await softwareGet(`/calendars/events?${qryStr}`);
  if (isResponseOk(resp)) {
    const data = resp.data;
    calEventInfo.predictions = data.predictionEvents;
    const events: CalEvent[] = data.events;
    if (events?.length) {
      // filter out events with "eventId"
      calEventInfo.events = events.filter((n:CalEvent) => n.eventId);
    }
  }

  return calEventInfo;
}