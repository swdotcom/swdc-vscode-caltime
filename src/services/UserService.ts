import { commands } from "vscode";
import { isResponseOk, softwareGet } from "../client/HttpClient";
import { getIntegrations, setItem, syncIntegrations } from "../managers/LocalManager";
import { Integration } from "../models/Integration";
import { SoftwareUser } from "../models/SoftwareUser";

export async function getUser(): Promise<SoftwareUser> {
  let softwareUser: SoftwareUser = null;

  const resp = await softwareGet("/users/me");
  if (isResponseOk(resp)) {
    if (resp?.data?.data) {
      softwareUser = resp.data.data;
      if (softwareUser.registered === 1) {
        // update jwt to what the jwt is for this spotify user
        setItem("name", softwareUser.email);
      }
    }
  }
  return softwareUser;
}

export async function populateCalendarIntegrations() {
  const user: SoftwareUser = await getUser();
  if (user && user.integrations?.length) {
    const integrations: Integration[] = getIntegrations();
    const calIntegrations: Integration[] = user.integrations.filter(
      (n:Integration) => n.name.toLowerCase().includes("calendar") && n.status.toLowerCase() === "active" && n.access_token);
    integrations.push(...calIntegrations);
    syncIntegrations(integrations);

    commands.executeCommand("calendartime.refreshAccountView");
  }
}