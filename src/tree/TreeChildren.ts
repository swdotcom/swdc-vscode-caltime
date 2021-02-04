import { TreeItemCollapsibleState } from "vscode";
import {
  getCalendarIntegrations,
  getTimeUntilNextMeeting,
  hasCalendarIntegrations,
  populateCalendarIntegrations,
} from "../managers/IntegrationManager";
import { getItem } from "../managers/LocalManager";
import { getThisWeek } from "../managers/DateManager";
import { isExpanded } from "./TreeUtil";
import { CalTreeItem } from "../models/CalTreeItem";
import { Integration } from "../models/Integration";
import { getThisWeekCalendarEvents } from "../services/CalendarService";
import { format, isBefore } from "date-fns";
import {
  getLoggedInButton,
  getConnectCalendarButton,
  getAccountRevealButton,
  getSignupButton,
  getLogInButton,
  getCalendarRevealButton,
} from "./TreeButtons";

const collapsedStateMap = {};
// mutable
let eventIdMap = {};

// ----------------------------------------------------------------------
// CALENDAR VIEW CHILDREN
// ----------------------------------------------------------------------

export async function getCalendarEventItems(): Promise<CalTreeItem[]> {
  const items: CalTreeItem[] = [];

  // clear out the event ID map
  eventIdMap = {};
  const calEventItems: CalTreeItem[] = await createCalendarEventItems();

  if (calEventItems?.length) {
    items.push(...calEventItems);
  }

  return items;
}

async function createCalendarEventItems(): Promise<CalTreeItem[]> {
  const items: CalTreeItem[] = [];

  const calEventInfo = await getThisWeekCalendarEvents();

  if (calEventInfo?.events?.length) {
    const treeParentMap = {};

    const { start, end } = getThisWeek(false);
    const monthStartStr = format(start, "LLL");
    const monthEndStr = format(end, "LLL");
    const startStr = format(start, "do");
    const endStr = format(end, "do");
    const now: Date = new Date();
    const today: string = format(now, "eeee");

    // NEXT MEETING LABEL
    // find out when the next meeting is starting
    const nextMeetingLabel = getTimeUntilNextMeeting(calEventInfo.events);
    const nextMeetingLabelItem = new CalTreeItem("", "", nextMeetingLabel);
    nextMeetingLabelItem.id = nextMeetingLabel;
    items.push(nextMeetingLabelItem);

    // WEEK FOLDER
    const weekFolder: CalTreeItem = new CalTreeItem("This week", "", `${monthStartStr} ${startStr} to ${monthEndStr} ${endStr}`);
    weekFolder.id = "cal_week_folder";
    weekFolder.children = [];
    items.push(weekFolder);
    weekFolder.collapsibleState = !collapsedStateMap[weekFolder.id] ? TreeItemCollapsibleState.Expanded : collapsedStateMap[weekFolder.id];

    for (const item of calEventInfo.events) {
      const eventStartDate: Date = new Date(item.start);
      if (isBefore(eventStartDate, start)) {
        continue;
      }

      const dayStr = format(eventStartDate, "eeee");
      let dayParent: CalTreeItem = treeParentMap[dayStr];

      if (!dayParent) {
        let collapsibleState: TreeItemCollapsibleState = isExpanded(dayStr) ? TreeItemCollapsibleState.Expanded : TreeItemCollapsibleState.Collapsed;

        // create the parent item
        if (dayStr === today) {
          collapsibleState = !collapsedStateMap[dayStr] ? TreeItemCollapsibleState.Expanded : collapsedStateMap[dayStr];
          dayParent = new CalTreeItem(dayStr, "", "", "dot.svg");
        } else {
          dayParent = new CalTreeItem(dayStr, "", "");
        }
        dayParent.collapsibleState = collapsibleState;
        dayParent.children = [];
        dayParent.id = dayStr;
        weekFolder.children.push(dayParent);
        treeParentMap[dayStr] = dayParent;
      }

      const startTime = format(new Date(item.start), "K:mm bbbb");

      if (!eventIdMap[item.id]) {
        eventIdMap[item.id] = item;

        const calName = item.source === "google_calendar" ? "Google" : "Outlook";
        let iconName = "event.svg";
        let tooltip = `Event from ${calName} Calendar`;
        if (!item.isProtected && item.attendeeCount && item.attendeeCount > 1) {
          iconName = "meeting.svg";
        } else if (item.isProtected) {
          iconName = "protected.svg";
          tooltip = `Protected code time (${calName})`;
        }

        const eventItem: CalTreeItem = new CalTreeItem(item.name, tooltip, startTime, iconName);
        if (item.isProtected) {
          eventItem.contextValue = "protected-calendar-event";
        }
        eventItem.id = item.eventId;
        eventItem.command = { title: "View calendar event", command: "calendartime.viewEvent", arguments: [item] };
        eventItem.value = item;

        dayParent.children.push(eventItem);
      }
    }

    // check to see if the integrations is not in sync with what we've retrieved
    if (!hasCalendarIntegrations()) {
      // fetch the integrations (async)
      populateCalendarIntegrations();
    }
  } else {
    if (!hasCalendarIntegrations()) {
      // no events found
      items.push(getConnectCalendarButton());
    }
  }

  items.push(getCalendarRevealButton());

  return items;
}

// ----------------------------------------------------------------------
// ACCOUNT VIEW CHILDREN
// ----------------------------------------------------------------------
export async function getAccountChildrenItems(): Promise<CalTreeItem[]> {
  const items: CalTreeItem[] = [];
  const name = getItem("name");
  if (!name) {
    items.push(getSignupButton());
    items.push(getLogInButton());
  } else {
    // get the logged in button
    items.push(getLoggedInButton());

    // add the cal connect button
    if (!hasCalendarIntegrations()) {
      items.push(getConnectCalendarButton());
    } else {
      // show the calendar integrations
      // get the integration type
      const calendarsFolder: CalTreeItem = new CalTreeItem("Calendars", "", "");
      calendarsFolder.id = "calendar_folder";
      calendarsFolder.contextValue = "calendar-integration-folder";
      calendarsFolder.collapsibleState = !collapsedStateMap[calendarsFolder.id]
        ? TreeItemCollapsibleState.Expanded
        : collapsedStateMap[calendarsFolder.id];
      calendarsFolder.children = [];

      items.push(calendarsFolder);
      const calIntegrations: Integration[] = getCalendarIntegrations();
      if (calIntegrations?.length) {
        for (const calIntegration of calIntegrations) {
          const calendarIntegrationItem: CalTreeItem = new CalTreeItem(calIntegration.value, "", "", "google.svg");
          calendarIntegrationItem.id = calIntegration.value;
          calendarIntegrationItem.value = calIntegration;
          calendarIntegrationItem.contextValue = "calendar-integration-item";
          calendarsFolder.children.push(calendarIntegrationItem);
        }
      }
    }
  }
  items.push(getAccountRevealButton());
  return items;
}
