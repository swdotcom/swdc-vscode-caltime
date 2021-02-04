import { commands, Disposable, TreeView, window } from "vscode";
import { CalEvent } from "../models/CalEvent";
import { CalTreeItem } from "../models/CalTreeItem";
import { connectGoogleCalendar, deleteProtectedEvent } from "../services/CalendarService";
import { disconnectCalendarIntegration } from "../services/IntegrationService";
import { AccountProvider } from "../tree/AccountProvider";
import { CalendarEventProvider } from "../tree/CalendarEventProvider";
import { launchAuth, showLogInMenuOptions, showSignUpMenuOptions } from "./AccountManager";
import { showCalendarInfo } from "./CalendarViewManager";
import { connectTreeView } from "../tree/TreeUtil";
import { getAccountRevealButton, getCalendarRevealButton } from "../tree/TreeButtons";

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
    commands.registerCommand("calendartime.disconnectCalendar", (treeItem: CalTreeItem) => {
      disconnectCalendarIntegration(treeItem);
    })
  );

  cmds.push(
    commands.registerCommand("calendartime.deleteProtectedEvent", (treeItem: CalTreeItem) => {
      deleteProtectedEvent(treeItem);
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

  cmds.push(
    commands.registerCommand("calendartime.revealCalendarView", () => {
      calEventProvider.revealTree(getCalendarRevealButton());
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

  cmds.push(
    commands.registerCommand("calendartime.revealAccountView", () => {
      accountProvider.revealTree(getAccountRevealButton());
    })
  );

  return accountTreeView;
}
