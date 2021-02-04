import { ExtensionContext, window } from "vscode";
import { initializeCommands } from "./managers/CommandManager";
import { getPluginName, getVersion } from "./managers/UtilManager";
import { initializeLocalStorageContext } from "./services/LocalStorageService";
import { getRandomArbitrary } from "./managers/UtilManager";
import { onboardInit } from "./managers/OnboardManager";
import { initializeStatusBar } from "./managers/StatusBarManager";

export function activate(ctx: ExtensionContext) {
  initializeLocalStorageContext(ctx);

  // onboard the user as anonymous if it's being installed
  if (window.state.focused) {
    onboardInit(ctx, intializePlugin /*successFunction*/);
  } else {
    // 9 to 20 second delay
    const secondDelay = getRandomArbitrary(9, 20);
    // initialize in 5 seconds if this is the secondary window
    setTimeout(() => {
      onboardInit(ctx, intializePlugin /*successFunction*/);
    }, 1000 * secondDelay);
  }
}

export async function intializePlugin(ctx: ExtensionContext) {
  console.log(`Loaded ${getPluginName()} v${getVersion()}`);

  ctx.subscriptions.push(initializeCommands());

  initializeStatusBar();
}

// this method is called when your extension is deactivated
export function deactivate() {
  //
}
