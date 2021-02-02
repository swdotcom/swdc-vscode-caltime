import { CalEvent } from "../models/CalEvent";
import { Integration } from "../models/Integration";
import { getIntegrations, syncIntegrations } from "./LocalManager";
import { isAfter, isToday, formatDistanceToNow } from "date-fns";
import { getUser } from "../services/UserService";
import { SoftwareUser } from "../models/SoftwareUser";
import { commands, window } from "vscode";

export function getCalendarIntegrations() {
  return getIntegrations().filter(
    (n: Integration) => n.name.toLowerCase().includes("calendar") && n.status.toLowerCase() === "active" && n.access_token
  );
}

export function hasCalendarIntegrations() {
  return !!getCalendarIntegrations().length;
}

export function clearCalendarIntegrations() {
  const filteredIntegrations = getIntegrations().filter((n: Integration) => !n.name.toLowerCase().includes("calendar"));
  syncIntegrations(filteredIntegrations);
}

export async function checkForNewCalendarIntegrationLazily(tryCountUntilFound = 40) {
  const user: SoftwareUser = await getUser();

  if (!user || !user.integrations || user.integrations.length === 0) {
    // try again
    tryCountUntilFound--;
    setTimeout(() => {
      checkForNewCalendarIntegrationLazily(tryCountUntilFound);
    }, 12000);
  }

  const foundNewIntegrations: boolean = await populateCalendarIntegrations(user);
  if (!foundNewIntegrations && tryCountUntilFound > 0) {
    setTimeout(() => {
      checkForNewCalendarIntegrationLazily(tryCountUntilFound);
    }, 12000);
  } else if (foundNewIntegrations) {
    // show a notification we found a new integration
    window.showInformationMessage("Successfully connected your calendar");
  }

  // done checking: either try count is zero or foundNewIntegrations is TRUE
}

export async function populateCalendarIntegrations(user: SoftwareUser = null): Promise<boolean> {
  let foundNewIntegrations = false;
  user = !user ? await getUser() : user;
  if (user && user.integrations && user.integrations.length) {
    const integrations: Integration[] = getIntegrations();
    const calIntegrations: Integration[] = user.integrations.filter(
      (n: Integration) => n.name.toLowerCase().includes("calendar") && n.status.toLowerCase() === "active" && n.access_token
    );

    // add the ones not currently found in the current integrations
    if (calIntegrations?.length) {
      for (const calIntegration of calIntegrations) {
        const foundExisting = integrations.find((n: Integration) => n.authid === calIntegration.authid);
        if (!foundExisting) {
          foundNewIntegrations = true;
          integrations.push(calIntegration);
        }
      }
      syncIntegrations(integrations);
    }

    commands.executeCommand("calendartime.refreshAccountView");

    if (foundNewIntegrations) {
      commands.executeCommand("calendartime.refreshCalendarView");
    }
  }
  return foundNewIntegrations;
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
