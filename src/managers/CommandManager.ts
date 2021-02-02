import { commands, Disposable, TreeView, window } from "vscode";
import { CalEvent } from "../models/CalEvent";
import { CalTreeItem } from "../models/CalTreeItem";
import { connectGoogleCalendar, disconnectGoogleCalendar } from "../services/CalendarService";
import { AccountProvider } from "../tree/AccountProvider";
import { CalendarEventProvider } from "../tree/CalendarEventProvider";
import { connectCalendar, launchAuth, showLogInMenuOptions, showSignUpMenuOptions } from "./AccountManager";
import { showCalendarInfo } from "./CalendarViewManager";
import { connectTreeView } from "./TreeManager";

export function initializeCommands(): { dispose: () => void } {
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
      connectGoogleCalendar();
    })
  );

  cmds.push(
    commands.registerCommand("calendartime.viewEvent", (event: CalEvent) => {
      showCalendarInfo(event);
    })
  );

  cmds.push(
    commands.registerCommand("calendartime.disconnectCalendar", (event: CalEvent) => {
      disconnectGoogleCalendar();
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
    commands.registerCommand("calendartime.refreshCalendarView", () => {
      calEventProvider.refresh();
    })
  );

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
