import { Disposable, TreeItemCollapsibleState, TreeView } from "vscode";
import { CalendarEventInfo } from "../models/CalendarEventInfo";
import { CalEvent } from "../models/CalEvent";
import { CalTreeItem } from "../models/CalTreeItem";
import { getThisWeekCalendarEvents } from "../services/CalendarService";
import { getItem } from "./LocalManager";
import { format } from "date-fns";
import { getThisWeek } from "./UtilManager";
import { getTimeUntilNextMeeting, hasCalendarIntegrations } from "./IntegrationManager";
import { populateCalendarIntegrations } from "../services/UserService";
import { getGlobalState, updateGlobalState } from "../services/LocalStorageService";
import { THIS_WEEK_EVENTS } from "../Constants";

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

export function isExpanded(id:string) {
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
    }
  }
  return items;
}

async function createCalendarEventItems(): Promise<CalTreeItem[]> {
  const items: CalTreeItem[] = [];
  let calEventInfo:CalendarEventInfo = getGlobalState(THIS_WEEK_EVENTS);
  if (!calEventInfo) {
    calEventInfo = await getThisWeekCalendarEvents();
  }

  const treeParentMap = {};

  const { start, end } = getThisWeek(false);
  const monthStartStr = format(start, "LLL");
  const monthEndStr = format(end, "LLL");
  const startStr = format(start, "do");
  const endStr = format(end, "do");

  const thisWeekParent: CalTreeItem = new CalTreeItem("This week", "", `${monthStartStr} ${startStr} to ${monthEndStr} ${endStr}`);
  items.push(thisWeekParent);

  const now : Date = new Date();
  const today: string = format(now, "eeee");

  if (calEventInfo?.events?.length) {

    updateGlobalState(THIS_WEEK_EVENTS, calEventInfo);
    
    thisWeekParent.children = [];

    // find out when the next meeting is starting
    const nextMeetingLabel = getTimeUntilNextMeeting(calEventInfo.events);
    thisWeekParent.children.push(new CalTreeItem("", "", nextMeetingLabel));

    const thisWeekCollapsibleState: TreeItemCollapsibleState = collapsedStateMap["This week"];
    if (!thisWeekCollapsibleState) {
      thisWeekParent.collapsibleState  = TreeItemCollapsibleState.Expanded;
    } else {
      thisWeekParent.collapsibleState = thisWeekCollapsibleState;
    }

    calEventInfo.events.forEach((item:CalEvent) => {
      const eventDate: Date = new Date(item.start);
      const dayStr = format(eventDate, "eeee");
      let dayParent: CalTreeItem = treeParentMap[dayStr];

      if (!dayParent) {
        let collapsibleState: TreeItemCollapsibleState = isExpanded(dayStr) ? TreeItemCollapsibleState.Expanded : TreeItemCollapsibleState.Collapsed;

        // create the parent item
        if (dayStr === today) {
          if (!collapsedStateMap[dayStr]) {
            // start it off as expanded
            collapsibleState = TreeItemCollapsibleState.Expanded;
          }
          dayParent = new CalTreeItem(dayStr, "", "", "dot.svg");
        } else {
          dayParent = new CalTreeItem(dayStr, "", "");
        }
        dayParent.collapsibleState = collapsibleState;
        dayParent.children = [];
        thisWeekParent.children.push(dayParent);
        treeParentMap[dayStr] = dayParent;
      }

      const dateStr = format(new Date(item.start), "K:mmbbbb");
      dayParent.children.push(new CalTreeItem(item.name, item.summary, dateStr));
    });
  }

  // check to see if the integrations is not in sync with what we've retrieved
  if (!hasCalendarIntegrations() && items.length) {
    // fetch the integrations
    populateCalendarIntegrations();
  }

  return items;
}

function getConnectCalendarButton(): CalTreeItem {
  return new CalTreeItem("Connect Calendar", "", "", "today.svg", "calendartime.connectCalendar");
}

function getLoggedInButton(): CalTreeItem {
  const connectedToInfo = getAuthTypeIconAndLabel();
  return new CalTreeItem(connectedToInfo.label, connectedToInfo.tooltip, "", connectedToInfo.icon);
}

function createAccountButtons(): CalTreeItem[] {
  const items: CalTreeItem[] = [];

  const signupButton = new CalTreeItem(
    "Sign up",
    "Sign up to connect your calendar events",
    "",
    "google.svg",
    "calendartime:signUp",
    "cal-time-sign-up");
  items.push(signupButton);

  const loginButton = new CalTreeItem(
    "Log in",
    "Log in to connect your calendar events",
    "",
    "google.svg",
    "calendartime:signUp",
    "cal-time-sign-up");
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