import { commands, window } from "vscode";
import { API_ENDPOINT, SOFTWARE_URL } from "../Constants";
import { getUserRegistrationState, populateCalendarIntegrations } from "../services/UserService";
import { clearCalendarIntegrations } from "./IntegrationManager";
import { getAuthCallbackState, getItem, getPluginUuid, setAuthCallbackState, setItem } from "./LocalManager";
import { showQuickPick } from "./MenuManager";
import { getPluginId, getPluginType, getVersion } from "./UtilManager";

const queryString = require("query-string");
const open = require("open");

export function showLogInMenuOptions() {
  showAuthMenuOptions("Log in", false /*isSignup*/);
}

export function showSignUpMenuOptions() {
  showAuthMenuOptions("Sign up", true /*isSignup*/);
}

function showAuthMenuOptions(authText: string, isSignup: boolean = true) {
  const items = [];
  const placeholder = `${authText} using...`;
  items.push({
    label: `${authText} with Google`,
    command: "calendartime.googleLogin",
    commandArgs: [true /*switching_account*/],
  });
  items.push({
    label: `${authText} with GitHub`,
    command: "calendartime.githubLogin",
    commandArgs: [true /*switching_account*/],
  });
  if (isSignup) {
    items.push({
      label: `${authText} with Email`,
      command: "calendartime.emailSignup",
      commandArgs: [false /*switching_account*/],
    });
  } else {
    items.push({
      label: `${authText} with Email`,
      command: "calendartime.emailLogin",
      commandArgs: [true /*switching_account*/],
    });
  }
  const menuOptions = {
    items,
    placeholder,
  };
  showQuickPick(menuOptions);
}

export async function launchAuth(loginType: string, isSignup: boolean) {
  const auth_callback_state: string = getAuthCallbackState(true);

  let url = SOFTWARE_URL;

  let obj = {
    plugin: getPluginType(),
    plugin_uuid: getPluginUuid(),
    pluginVersion: getVersion(),
    plugin_id: getPluginId(),
    auth_callback_state,
    login: true,
  };

  if (loginType === "github") {
    // github signup/login flow
    obj["redirect"] = SOFTWARE_URL;
    url = `${API_ENDPOINT}/auth/github`;
  } else if (loginType === "google") {
    // google signup/login flow
    obj["redirect"] = SOFTWARE_URL;
    url = `${API_ENDPOINT}/auth/google`;
  } else if (isSignup) {
    obj["auth"] = "software";
    url = `${SOFTWARE_URL}/email-signup`;
  } else {
    // email login
    obj["login"] = true;
    obj["auth"] = "software";
    url = `${SOFTWARE_URL}/onboarding`;
  }

  open(`${url}?${queryString.stringify(obj)}`);

  setTimeout(() => {
    userStatusFetchHandler(40);
  }, 1000);
}

async function userStatusFetchHandler(tryCountUntilFoundUser) {
  const state = await getUserRegistrationState();
  if (!state.loggedOn) {
    // try again if the count is not zero
    if (tryCountUntilFoundUser > 0) {
      tryCountUntilFoundUser -= 1;
      userStatusFetchHandler(tryCountUntilFoundUser);
    } else {
      // clear the auth callback state
      setItem("switching_account", false);
      userStatusFetchHandler(null);
    }
  } else {
    // clear the auth callback state
    setItem("switching_account", false);
    setAuthCallbackState(null);

    clearCalendarIntegrations();

    const message = "Successfully logged on to Calendar Time";
    window.showInformationMessage(message);

    await populateCalendarIntegrations(state.user);

    commands.executeCommand("calendartime.refreshAccountView");
    commands.executeCommand("calendartime.refreshCalendarView");
  }
}

export function connectCalendar() {
  if (!checkRegistration()) {
    return;
  }
  // check to see if the user is registered
  open(`${SOFTWARE_URL}/settings/sources`);
}

export function checkRegistration(showSignup = true) {
  if (!getItem("name")) {
    if (showSignup) {
      showModalSignupPrompt("Connecting a calendar requires a registered account. Sign up or log in to continue.");
    }
    return false;
  }
  return true;
}

export function showModalSignupPrompt(msg: string) {
  window.showInformationMessage(
      msg,
      {
        modal: true,
      },
      "Sign up"
    )
    .then(async (selection) => {
      if (selection === "Sign up") {
        commands.executeCommand("calendartime.signUp");
      }
    });
}