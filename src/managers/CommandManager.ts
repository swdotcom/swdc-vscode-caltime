import { commands, Disposable, TreeView, window } from "vscode";
import { THIS_WEEK_EVENTS } from "../Constants";
import { CalTreeItem } from "../models/CalTreeItem";
import { clearGlobalState } from "../services/LocalStorageService";
import { AccountProvider } from "../tree/AccountProvider";
import { CalendarEventProvider } from "../tree/CalendarEventProvider";
import { connectCalendar, launchAuth, showLogInMenuOptions, showSignUpMenuOptions } from "./AccountManager";
import { connectTreeView } from "./TreeManager";

let intervals: any[] = [];

export function initializeCommands(): {dispose: () => void;} {

  const cmds = [];

  const calTreeView: TreeView<CalTreeItem> = createCalEventTreeView(cmds);
  cmds.push(connectTreeView(calTreeView));

  const accountTreeView: TreeView<CalTreeItem> = createCalAccountTreeView(cmds);
  cmds.push(connectTreeView(accountTreeView));

  cmds.push(
    commands.registerCommand("calendartime.signUp", () => {
      showSignUpMenuOptions();
    })
  );

  cmds.push(
    commands.registerCommand("calendartime.logIn", () => {
      showLogInMenuOptions();
    })
  );

  cmds.push(
    commands.registerCommand("calendartime.googleLogin", () => {
      launchAuth("google", false);
    })
  );

  cmds.push(
    commands.registerCommand("calendartime.githubLogin", () => {
      launchAuth("github", false);
    })
  );

  cmds.push(
    commands.registerCommand("calendartime.emailLogin", () => {
      launchAuth("software", false);
    })
  );

  cmds.push(
    commands.registerCommand("calendartime.emailSignup", () => {
      launchAuth("software", true);
    })
  );

  cmds.push(
    commands.registerCommand("calendartime.connectCalendar", () => {
      connectCalendar();
    })
  );

  return Disposable.from(...cmds);
}

function createCalEventTreeView(cmds): TreeView<CalTreeItem> {
  const calEventProvider = new CalendarEventProvider();
  const calEventTreeView: TreeView<CalTreeItem> = window.createTreeView("calendar-time-view", {
    treeDataProvider: calEventProvider,
    showCollapseAll: false,
  });
  calEventProvider.bindView(calEventTreeView);

  cmds.push(
    commands.registerCommand("calendartime.refreshUpcomingMeetingInfo", () => {
      calEventProvider.refresh();
    })
  );

  cmds.push(
    commands.registerCommand("calendartime.refreshCalendarView", () => {
      clearGlobalState(THIS_WEEK_EVENTS);
      calEventProvider.refresh();
    })
  );

  intervals.push(setInterval(() => {
    commands.executeCommand("calendartime.refreshUpcomingMeetingInfo");
  }, 1000 * 60 * 15));

  return calEventTreeView;
}

function createCalAccountTreeView(cmds): TreeView<CalTreeItem> {
  const accountProvider = new AccountProvider();
  const accountTreeView: TreeView<CalTreeItem> = window.createTreeView("calendar-account-view", {
    treeDataProvider: accountProvider,
    showCollapseAll: false,
  });
  accountProvider.bindView(accountTreeView);

  cmds.push(
    commands.registerCommand("calendartime.refreshAccountView", () => {
      accountProvider.refresh();
    })
  );

  return accountTreeView;
}

export function disposeCommandIntervals() {
  for (const interval of intervals) {
    clearTimeout(interval);
  }
}