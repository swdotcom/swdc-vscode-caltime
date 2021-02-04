import { getItem } from "../managers/LocalManager";
import { CalTreeItem } from "../models/CalTreeItem";

export function getConnectCalendarButton(): CalTreeItem {
  const calConnectButton: CalTreeItem = new CalTreeItem("Connect Calendar", "", "", "today.svg");
  calConnectButton.id = "calendar_connect";
  calConnectButton.command = { title: "View calendar event", command: "calendartime.connectCalendar", arguments: [] };
  return calConnectButton;
}

export function getCalendarRevealButton(): CalTreeItem {
  const calRevealButton: CalTreeItem = new CalTreeItem("", "");
  calRevealButton.id = "cal_reveal_button";
  return calRevealButton;
}

export function getAccountRevealButton(): CalTreeItem {
  const accountRevealButton: CalTreeItem = new CalTreeItem("", "");
  accountRevealButton.id = "account_reveal_button";
  return accountRevealButton;
}

export function getLoggedInButton(): CalTreeItem {
  const connectedToInfo = getAuthTypeIconAndLabel();
  const loggedInButton = new CalTreeItem(connectedToInfo.label, connectedToInfo.tooltip, "", connectedToInfo.icon);
  loggedInButton.id = "logged_in_button";
  return loggedInButton;
}

export function getSignupButton() {
  const signupButton = new CalTreeItem("Sign up", "Sign up to connect your calendar events", "", "google.svg");
  signupButton.command = { title: "Sign up", command: "calendartime.signUp", arguments: [] };
  signupButton.id = "sign_up_button";
  return signupButton;
}

export function getLogInButton() {
  const loginButton = new CalTreeItem("Log in", "Log in to connect your calendar events", "", "google.svg");
  loginButton.command = { title: "Log in", command: "calendartime.logIn", arguments: [] };
  loginButton.id = "log_in_button";
  return loginButton;
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
