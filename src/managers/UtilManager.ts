import { extensions } from "vscode";
import { IDE_PLUGIN_ID, PLUGIN_TYPE, SOFTWARE_PLUGIN_ID } from "../Constants";
import { getUnixTime, endOfWeek, startOfWeek } from "date-fns";

const os = require("os");
const { exec } = require("child_process");

export function getVersion() {
  const extension = extensions.getExtension(IDE_PLUGIN_ID);
  return extension.packageJSON.version;
}

export function getPluginId() {
  return SOFTWARE_PLUGIN_ID;
}

export function getPluginName() {
  return IDE_PLUGIN_ID;
}

export function getPluginType() {
  return PLUGIN_TYPE;
}

export function isWindows() {
  return process.platform.indexOf("win32") !== -1;
}

export function isMac() {
  return process.platform.indexOf("darwin") !== -1;
}

export function getOffsetSeconds() {
  let d = new Date();
  return d.getTimezoneOffset() * 60;
}

export function getOs() {
  let parts = [];
  let osType = os.type();
  if (osType) {
    parts.push(osType);
  }
  let osRelease = os.release();
  if (osRelease) {
    parts.push(osRelease);
  }
  let platform = os.platform();
  if (platform) {
    parts.push(platform);
  }
  if (parts.length > 0) {
    return parts.join("_");
  }
  return "";
}

export async function getHostname() {
  let hostname = await getCommandResultLine("hostname");
  return hostname;
}

export async function getOsUsername() {
  let username = os.userInfo().username;
  if (!username || username.trim() === "") {
    username = await getCommandResultLine("whoami");
  }
  return username;
}

export function getRandomArbitrary(min, max) {
  max = max + 0.1;
  return parseInt(Math.random() * (max - min) + min, 10);
}

export async function getCommandResultLine(cmd, projectDir = null) {
  const resultList = await getCommandResultList(cmd, projectDir);

  let resultLine = "";
  if (resultList && resultList.length) {
    for (let i = 0; i < resultList.length; i++) {
      let line = resultList[i];
      if (line && line.trim().length > 0) {
        resultLine = line.trim();
        break;
      }
    }
  }
  return resultLine;
}

export async function getCommandResultList(cmd, projectDir = null) {
  let result = await wrapExecPromise(`${cmd}`, projectDir);
  if (!result) {
    return [];
  }
  const contentList = result.replace(/\r\n/g, "\r").replace(/\n/g, "\r").split(/\r/);
  return contentList;
}

export async function wrapExecPromise(cmd, projectDir) {
  let result = null;
  try {
    let opts = projectDir !== undefined && projectDir !== null ? { cwd: projectDir } : {};
    result = await execPromise(cmd, opts).catch((e) => {
      if (e.message) {
        console.log(e.message);
      }
      return null;
    });
  } catch (e) {
    if (e.message) {
      console.log(e.message);
    }
    result = null;
  }
  return result;
}

export function execPromise(command, opts) {
  return new Promise(function (resolve, reject) {
    exec(command, opts, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(stdout.trim());
    });
  });
}

export function getThisWeek(isUnix: boolean = true) {
  const d: Date = new Date();
  const start = isUnix ? getUnixTime(startOfWeek(d)) : startOfWeek(d);
  const end = isUnix ? getUnixTime(endOfWeek(d)) : endOfWeek(d);
  return { start, end };
}
