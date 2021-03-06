import { commands, window } from "vscode";
import { isResponseOk, softwarePost } from "../client/HttpClient";
import { API_ENDPOINT, SOFTWARE_URL } from "../Constants";
import { getUserRegistrationState } from "../services/UserService";
import { clearCalendarIntegrations, populateCalendarIntegrations } from "./IntegrationManager";
import { getAuthCallbackState, getItem, getPluginUuid, setAuthCallbackState, setItem } from "./LocalManager";
import { showQuickPick } from "./MenuManager";
import { getHostname, getPluginId, getPluginType, getVersion, getOsUsername } from "./UtilManager";

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
    userStatusFetchHandlerLazily(40);
  }, 1000);
}

async function userStatusFetchHandlerLazily(tryCountUntilFoundUser) {
  const state = await getUserRegistrationState();
  if (!state.loggedOn) {
    // try again if the count is not zero
    if (tryCountUntilFoundUser > 0) {
      tryCountUntilFoundUser -= 1;
      userStatusFetchHandlerLazily(tryCountUntilFoundUser);
    } else {
      // clear the auth callback state
      setItem("switching_account", false);
      setAuthCallbackState(null);
    }
  } else {
    // clear the auth callback state
    setItem("switching_account", false);
    setAuthCallbackState(null);

    clearCalendarIntegrations();

    window.showInformationMessage("Successfully logged on to Calendar Time");

    await populateCalendarIntegrations(state.user);

    commands.executeCommand("calendartime.refreshAccountView");
    commands.executeCommand("calendartime.refreshCalendarView");
  }
}

export function viewWebCalendarSettings() {
  if (!checkRegistration()) {
    return;
  }
  // check to see if the user is registered
  open(`${SOFTWARE_URL}/settings/sources`);
}

export function checkRegistration(showSignup = true) {
  if (!getItem("name")) {
    if (showSignup) {
      // reveal the account tree
      commands.executeCommand("calendartime.revealAccountView");
      showModalSignupPrompt("Connecting a calendar requires a registered account. Sign up or log in to continue.");
    }
    return false;
  }
  return true;
}

export function showModalSignupPrompt(msg: string) {
  window
    .showInformationMessage(
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

/**
 * create an anonymous user based on github email or mac addr
 */
export async function createAnonymousUser(): Promise<string> {
  let jwt = getItem("jwt");

  // check one more time before creating the anon user
  if (!jwt) {
    // this should not be undefined if its an account reset
    let plugin_uuid = getPluginUuid();
    let auth_callback_state = getAuthCallbackState();
    const username = await getOsUsername();
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const hostname = await getHostname();

    const resp = await softwarePost("/plugins/onboard", {
      timezone,
      username,
      plugin_uuid,
      hostname,
      auth_callback_state,
    });
    if (isResponseOk(resp) && resp.data && resp.data.jwt) {
      setItem("jwt", resp.data.jwt);
      if (!resp.data.user.registered) {
        setItem("name", null);
      }
      setItem("switching_account", false);
      setAuthCallbackState(null);
      jwt = resp.data.jwt;
    }
  }

  return jwt;
}
