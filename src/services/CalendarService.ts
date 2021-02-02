import { isResponseOk, softwareGet } from "../client/HttpClient";
import { CalendarEventInfo } from "../models/CalendarEventInfo";
import { CalEvent } from "../models/CalEvent";
import { getPluginType, getThisWeek, getVersion } from "../managers/UtilManager";
import { getAuthCallbackState, getPluginUuid } from "../managers/LocalManager";
import { API_ENDPOINT } from "../Constants";
import { checkForNewCalendarIntegrationLazily } from "../managers/IntegrationManager";

const queryString = require("query-string");
const open = require("open");

export async function disconnectGoogleCalendar() {
  //
}

export async function connectGoogleCalendar() {
  const auth_callback_state: string = getAuthCallbackState(true);

  let obj = {
    plugin: getPluginType(),
    plugin_uuid: getPluginUuid(),
    pluginVersion: getVersion(),
    plugin_id: getPluginUuid(),
    auth_callback_state,
    login: true,
  };
  const url: string = `${API_ENDPOINT}/auth/google/calendar?${queryString.stringify(obj)}`;
  open(url);
  // softwareGet(`${API_ENDPOINT}/auth/google/calendar?${queryString.stringify(obj)}`);

  // fetch for the new integration lazily
  setTimeout(() => {
    checkForNewCalendarIntegrationLazily(40);
  }, 12000);
}

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
      calEventInfo.events = events.filter((n: CalEvent) => n.eventId);
    }
  }

  return calEventInfo;
}
