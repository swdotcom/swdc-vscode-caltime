import { commands, Disposable, TreeItemCollapsibleState, TreeView } from "vscode";
import { CalendarEventInfo } from "../models/CalendarEventInfo";
import { CalEvent } from "../models/CalEvent";
import { CalTreeItem } from "../models/CalTreeItem";
import { getThisWeekCalendarEvents } from "../services/CalendarService";
import { getItem } from "./LocalManager";
import { format } from "date-fns";
import { getThisWeek } from "./UtilManager";
import { getCalendarIntegrations, getTimeUntilNextMeeting, hasCalendarIntegrations, populateCalendarIntegrations } from "./IntegrationManager";
import { Integration } from "../models/Integration";

const collapsedStateMap = {};

export const connectTreeView = (view: TreeView<CalTreeItem>) => {
  return Disposable.from(
    view.onDidCollapseElement(async (e) => {
      const item: CalTreeItem = e.element;
      collapsedStateMap[item.id] = TreeItemCollapsibleState.Collapsed;
    }),

    view.onDidExpandElement(async (e) => {
      const item: CalTreeItem = e.element;
      collapsedStateMap[item.id] = TreeItemCollapsibleState.Expanded;
    }),

    view.onDidChangeSelection(async (e) => {
      //
    }),

    view.onDidChangeVisibility((e) => {
      if (e.visible) {
        //
      }
    })
  );
};

export function handleChangeSelection(view: TreeView<CalTreeItem>, item: CalTreeItem) {
  if (item?.command) {
    const args = item.command?.arguments || [];
    args.unshift(item);
    commands.executeCommand(item.command.command, ...args);
  }
}

export function isExpanded(id: string) {
  return !!(collapsedStateMap[id] && collapsedStateMap[id] === TreeItemCollapsibleState.Expanded);
}

export async function getCalendarEventItems(): Promise<CalTreeItem[]> {
  const items: CalTreeItem[] = [];
  const calEventItems: CalTreeItem[] = await createCalendarEventItems();

  if (calEventItems?.length) {
    items.push(...calEventItems);
  } else {
    items.push(getConnectCalendarButton());
  }

  return items;
}

export async function getAccountItems(): Promise<CalTreeItem[]> {
  const items: CalTreeItem[] = [];
  const name = getItem("name");
  if (!name) {
    items.push(...createAccountButtons());
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
          calendarIntegrationItem.contextValue = "calendar-integration-item";
          calendarsFolder.children.push(calendarIntegrationItem);
        }
      }
    }
  }
  return items;
}

async function createCalendarEventItems(): Promise<CalTreeItem[]> {
  const items: CalTreeItem[] = [];

  let calEventInfo: CalendarEventInfo = null;
  if (!calEventInfo) {
    calEventInfo = await getThisWeekCalendarEvents();
  }

  if (calEventInfo?.events?.length) {
    const treeParentMap = {};

    const { start, end } = getThisWeek(false);
    const monthStartStr = format(start, "LLL");
    const monthEndStr = format(end, "LLL");
    const startStr = format(start, "do");
    const endStr = format(end, "do");

    const weekFolder: CalTreeItem = new CalTreeItem("This week", "", `${monthStartStr} ${startStr} to ${monthEndStr} ${endStr}`);
    items.push(weekFolder);

    const now: Date = new Date();
    const today: string = format(now, "eeee");

    weekFolder.children = [];

    // find out when the next meeting is starting
    const nextMeetingLabel = getTimeUntilNextMeeting(calEventInfo.events);
    weekFolder.children.push(new CalTreeItem("", "", nextMeetingLabel));
    weekFolder.collapsibleState = !collapsedStateMap[weekFolder.id] ? TreeItemCollapsibleState.Expanded : collapsedStateMap[weekFolder.id];

    calEventInfo.events.forEach((item: CalEvent) => {
      const eventDate: Date = new Date(item.start);
      const dayStr = format(eventDate, "eeee");
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
        weekFolder.children.push(dayParent);
        treeParentMap[dayStr] = dayParent;
      }

      const dateStr = format(new Date(item.start), "K:mm bbbb");
      const eventItem: CalTreeItem = new CalTreeItem(item.name, item.summary, dateStr, null);
      eventItem.command = { title: "View calendar event", command: "calendartime.viewEvent", arguments: [item] };
      eventItem.value = item;

      dayParent.children.push(eventItem);
    });

    // check to see if the integrations is not in sync with what we've retrieved
    if (!hasCalendarIntegrations()) {
      // fetch the integrations (async)
      populateCalendarIntegrations();
    }
  } else {
    // no events found
    items.push(getConnectCalendarButton());
  }

  return items;
}

function getConnectCalendarButton(): CalTreeItem {
  const calConnectButton: CalTreeItem = new CalTreeItem("Connect Calendar", "", "", "today.svg");
  calConnectButton.command = { title: "View calendar event", command: "calendartime.connectCalendar", arguments: [] };
  return calConnectButton;
}

function getLoggedInButton(): CalTreeItem {
  const connectedToInfo = getAuthTypeIconAndLabel();
  return new CalTreeItem(connectedToInfo.label, connectedToInfo.tooltip, "", connectedToInfo.icon);
}

function createAccountButtons(): CalTreeItem[] {
  const items: CalTreeItem[] = [];

  const signupButton = new CalTreeItem("Sign up", "Sign up to connect your calendar events", "", "google.svg");
  signupButton.command = { title: "Sign up", command: "calendartime.signUp", arguments: [] };
  items.push(signupButton);

  const loginButton = new CalTreeItem("Log in", "Log in to connect your calendar events", "", "google.svg");
  loginButton.command = { title: "Log in", command: "calendartime.logIn", arguments: [] };
  items.push(loginButton);
  return items;
}

export function getAuthTypeIconAndLabel() {
  const authType = getItem("authType");
  const name = getItem("name");
  let tooltip = name ? `Connected as ${name}` : "";
  if (authType === "google") {
    return {
      icon: "google.svg",
      label: name,
      tooltip,
    };
  } else if (authType === "github") {
    return {
      icon: "github.svg",
      label: name,
      tooltip,
    };
  }
  return {
    icon: "email.svg",
    label: name,
    tooltip,
  };
}
