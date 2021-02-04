import { isResponseOk, softwareDelete, softwareGet } from "../client/HttpClient";
import { CalEvent } from "../models/CalEvent";
import { getPluginType, getThisWeek, getVersion } from "../managers/UtilManager";
import { getAuthCallbackState, getItem, getPluginUuid } from "../managers/LocalManager";
import { API_ENDPOINT, SOFTWARE_URL } from "../Constants";
import { checkForNewCalendarIntegrationLazily } from "../managers/IntegrationManager";
import { checkRegistration } from "../managers/AccountManager";
import { CalendarEventInfo } from "../models/CalendarEventInfo";
import { commands, window } from "vscode";
import { CalTreeItem } from "../models/CalTreeItem";

const queryString = require("query-string");
const open = require("open");

export async function connectGoogleCalendar() {
  if (!checkRegistration()) {
    return;
  }
  const auth_callback_state: string = getAuthCallbackState(true);

  let obj = {
    plugin: getPluginType(),
    plugin_uuid: getPluginUuid(),
    pluginVersion: getVersion(),
    plugin_id: getPluginUuid(),
    auth_callback_state,
    token: getItem("jwt"),
    integrate: "calendar",
    redirect: `${SOFTWARE_URL}/settings/sources/integrations/gcal`,
  };
  const url: string = `${API_ENDPOINT}/auth/google/calendar?${queryString.stringify(obj)}`;
  open(url);

  // fetch for the new integration lazily
  setTimeout(() => {
    checkForNewCalendarIntegrationLazily(40);
  }, 12000);
}

export async function getThisWeekCalendarEvents(): Promise<CalendarEventInfo> {
  const calEventInfo: CalendarEventInfo = new CalendarEventInfo();

  const qryStr = queryString.stringify(getThisWeek());

  /** predictions structure
   * { "start": "2021-02-11T19:00:00Z",
            "end": "2021-02-11T20:00:00Z",
            "calendar": {
                "name": "Predictions"
            },
            "isPrediction": true
        }
   */
  const resp = await softwareGet(`/calendars/events?${qryStr}`);
  if (isResponseOk(resp)) {
    const data = resp.data;
    calEventInfo.predictions = data.predictionEvents;
    const events: CalEvent[] = data.events;
    if (events?.length) {
      // filter out events with "eventId"
      calEventInfo.events = events.filter((n: CalEvent) => n.eventId);
    }

    calEventInfo.events = calEventInfo.events.sort((a: CalEvent, b: CalEvent) => new Date(a.start).getTime() - new Date(b.start).getTime());
  }

  return calEventInfo;
}

export async function deleteProtectedEvent(treeItem: CalTreeItem) {
  const calEvent: CalEvent = treeItem.value;
  const resp = await softwareDelete(`/calendars/primary/events/${calEvent.id}?source=${calEvent.source}`);
  if (isResponseOk(resp)) {
    window.showInformationMessage("Deleted protected calendar event");
    commands.executeCommand("calendartime.refreshCalendarView");
  }
}
