import { SOFTWARE_DIRECTORY } from "../Constants";
import { isWindows } from "./UtilManager";
import { v4 as uuidv4 } from "uuid";
const fs = require("fs");
const os = require("os");
const fileIt = require("file-it");

export function getSoftwareSessionFile() {
  return getFile("session.json");
}

export function getDeviceFile() {
  return getFile("device.json");
}

export function getIntegrationsFile() {
  return getFile("integrations.json");
}

function getFile(name) {
  let filePath = getSoftwareDir();
  if (isWindows()) {
    return `${filePath}\\${name}`;
  }
  return `${filePath}/${name}`;
}

export function getSoftwareDir(autoCreate = true) {
  const homedir = os.homedir();
  let softwareDataDir = homedir;
  if (isWindows()) {
    softwareDataDir += `\\${SOFTWARE_DIRECTORY}`;
  } else {
    softwareDataDir += `/${SOFTWARE_DIRECTORY}`;
  }

  if (autoCreate && !fs.existsSync(softwareDataDir)) {
    fs.mkdirSync(softwareDataDir);
  }

  return softwareDataDir;
}

export function getPluginUuid() {
  let pluginUuid = fileIt.getJsonValue(getDeviceFile(), "plugin_uuid");
  if (!pluginUuid) {
    // set it for the 1st and only time
    pluginUuid = uuidv4();
    fileIt.setJsonValue(getDeviceFile(), "plugin_uuid", pluginUuid);
  }
  return pluginUuid;
}

export function setItem(key, value) {
  fileIt.setJsonValue(getSoftwareSessionFile(), key, value);
}

export function getItem(key) {
  return fileIt.getJsonValue(getSoftwareSessionFile(), key);
}

export function getFileDataAsJson(file) {
  return fileIt.readJsonFileSync(file);
}

/**
 * Return existing integrations or an empty array
 */
export function getIntegrations() {
  let integrations = getFileDataAsJson(getIntegrationsFile());
  if (!integrations) {
    // make sure we return an empty list
    integrations = [];
    syncIntegrations(integrations);
  }
  return integrations;
}

export function syncIntegrations(integrations) {
  fileIt.writeJsonFileSync(getIntegrationsFile(), integrations);
}

export function getAuthCallbackState(autoCreate = true) {
  let auth_callback_state = fileIt.getJsonValue(getDeviceFile(), "auth_callback_state");
  if (!auth_callback_state && autoCreate) {
    auth_callback_state = uuidv4();
    setAuthCallbackState(auth_callback_state);
  }
  return auth_callback_state;
}

export function setAuthCallbackState(value: string) {
  fileIt.setJsonValue(getDeviceFile(), "auth_callback_state", value);
}
