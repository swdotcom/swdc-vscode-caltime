import { commands } from "vscode";
import { isResponseOk, softwareGet } from "../client/HttpClient";
import { getAuthCallbackState, getIntegrations, getItem, setAuthCallbackState, setItem, syncIntegrations } from "../managers/LocalManager";
import { Integration } from "../models/Integration";
import { SoftwareUser } from "../models/SoftwareUser";

export async function getUser(): Promise<SoftwareUser> {
  let softwareUser: SoftwareUser = null;

  const resp = await softwareGet("/users/me");
  if (isResponseOk(resp)) {
    if (resp?.data?.data) {
      softwareUser = resp.data.data;
      if (softwareUser.registered === 1) {
        // update the name
        setItem("name", softwareUser.email);
      }
    }
  }
  return softwareUser;
}

export async function getUserRegistrationState(isIntegration = false) {
  const jwt = getItem("jwt");
  const auth_callback_state = getAuthCallbackState(false /*autoCreate*/);

  const token = auth_callback_state ? auth_callback_state : jwt;

  const resp = await softwareGet("/users/plugin/state", token);

  const foundUser = !!(isResponseOk(resp) && resp.data && resp.data.user);
  const state = foundUser ? resp.data.state : "UNKNOWN";

  if (foundUser) {
    // set the jwt, name (email), and use the registration flag
    // to determine if they're logged in or not
    const user: SoftwareUser = resp.data.user;
    const registered = user.registered;

    // update the name and jwt if we're authenticating
    if (!isIntegration) {
      if (user.plugin_jwt) {
        setItem("jwt", user.plugin_jwt);
      }
      if (registered === 1) {
        setItem("name", user.email);
      }
    }

    setItem("switching_account", false);
    setAuthCallbackState(null);

    // if we need the user it's "resp.data.user"
    return { loggedOn: registered === 1, state, user };
  }

  // all else fails, set false and UNKNOWN
  return { loggedOn: false, state, user: null };
}
