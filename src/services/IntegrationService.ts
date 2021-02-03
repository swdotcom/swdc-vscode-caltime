import { commands, window } from "vscode";
import { isResponseOk, softwareDelete } from "../client/HttpClient";
import { removeIntegration } from "../managers/IntegrationManager";
import { CalTreeItem } from "../models/CalTreeItem";
import { Integration } from "../models/Integration";

export async function disconnectCalendarIntegration(treeItem: CalTreeItem) {
  const integrationToDisconnect: Integration = treeItem.value;

  if (integrationToDisconnect) {
    removeIntegration(integrationToDisconnect);
    const resp = await softwareDelete(`/integrations/${integrationToDisconnect.id}`);
    if (isResponseOk(resp)) {
      window.showInformationMessage("Disconnected calendar integration");
      commands.executeCommand("calendartime.refreshCalendarView");
      commands.executeCommand("calendartime.refreshAccountView");
    }
  }
}
