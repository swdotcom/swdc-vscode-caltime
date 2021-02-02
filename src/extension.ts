import * as vscode from "vscode";
import { disposeCommandIntervals, initializeCommands } from "./managers/CommandManager";
import { getPluginName, getVersion } from "./managers/UtilManager";
import { initializeLocalStorageContext } from "./services/LocalStorageService";

export function activate(ctx: vscode.ExtensionContext) {

	initializeLocalStorageContext(ctx);

	console.log(`Loaded ${getPluginName()} v${getVersion()}`);

	ctx.subscriptions.push(initializeCommands());
	
}

// this method is called when your extension is deactivated
export function deactivate() {
	disposeCommandIntervals();
}
