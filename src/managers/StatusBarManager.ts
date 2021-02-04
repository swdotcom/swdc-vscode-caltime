import { StatusBarAlignment, StatusBarItem, window } from "vscode";

let statusBarItem: StatusBarItem = undefined;

export function initializeStatusBar() {
  if (!statusBarItem) {
    statusBarItem = window.createStatusBarItem(StatusBarAlignment.Right, 9);
    statusBarItem.command = "calendartime.revealCalendarView";
    statusBarItem.text = "$(calendar)";
    statusBarItem.show();
  }
}

export function showMeetingAlert() {
  statusBarItem.text = "$(calendar)🟡";
}

export function clearMeetingAlert() {
  statusBarItem.text = "$(calendar)";
}
