import { commands, QuickPickOptions, window } from "vscode";

const open = require("open");

export function showQuickPick(pickOptions): any {
  if (!pickOptions || !pickOptions["items"]) {
    return;
  }
  let options: QuickPickOptions = {
    matchOnDescription: false,
    matchOnDetail: false,
    placeHolder: pickOptions.placeholder || "",
  };

  return window.showQuickPick(pickOptions.items, options).then(async (item) => {
    if (item) {
      const url = item["url"];
      const cb = item["cb"];
      const command = item["command"];
      const commandArgs = item["commandArgs"] || [];
      if (url) {
        open(url);
      } else if (cb) {
        cb();
      } else if (command) {
        commands.executeCommand(command, ...commandArgs);
      }
    }
    return item;
  });
}
