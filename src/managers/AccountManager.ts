import { API_ENDPOINT, SOFTWARE_URL } from "../Constants";
import { getAuthCallbackState, getPluginUuid } from "./LocalManager";
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
}

export function connectCalendar() {
  open(`${SOFTWARE_URL}/settings/sources`);
}