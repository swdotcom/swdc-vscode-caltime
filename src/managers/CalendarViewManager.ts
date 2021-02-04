import { ViewColumn, WebviewPanel, window } from "vscode";
import { CalEvent } from "../models/CalEvent";
import path = require("path");
import fs = require("fs");
import { format } from "date-fns";

const open = require("open");

let currentPanel: WebviewPanel | undefined = undefined;
let currentColorKind: number = undefined;
let currentEvent: CalEvent = null;

function init() {
  currentColorKind = window.activeColorTheme.kind;
  window.onDidChangeActiveColorTheme((event) => {
    const kind = event?.kind ?? currentColorKind;
    if (kind !== currentColorKind) {
      // reload the current panel if its not null/undefined
      if (currentPanel && currentEvent) {
        setTimeout(() => {
          showCalendarInfo(currentEvent);
        }, 250);
      }
      currentColorKind = kind;
    }
  });
}

export function showCalendarInfo(event: CalEvent) {
  if (currentColorKind === null) {
    init();
  }
  currentEvent = currentEvent;
  const generatedHtml = getCalendarEventInfo(event);

  if (currentPanel) {
    // dipose the previous one. always use the same tab
    currentPanel.dispose();
  }

  if (!currentPanel) {
    currentPanel = window.createWebviewPanel("calendar_view", "Event Info", ViewColumn.One, { enableScripts: true });
    currentPanel.onDidDispose(() => {
      currentPanel = undefined;
      currentEvent = null;
    });
    currentPanel.webview.onDidReceiveMessage(async (message) => {
      switch (message.command) {
        case "join":
        case "edit":
          open(message.value);
          break;
      }
      if (currentPanel) {
        // dipose it
        currentPanel.dispose();
        currentEvent = null;
      }
    });
  }
  currentPanel.webview.html = generatedHtml;
  currentPanel.reveal(ViewColumn.One);
}

export function getCalendarViewTemplate() {
  const resourcePath: string = path.join(__dirname, "resources/templates");
  const file = path.join(resourcePath, "calendar_view.html");
  return file;
}

export function getCalendarEventInfo(event: CalEvent): string {
  const { cardTextColor, cardBackgroundColor, cardInputHeaderColor } = getInputFormStyles();

  // K:mmbbbb
  const eventDate: Date = new Date(event.start);
  const dateString = format(eventDate, "ccc, LLL do 'at' K:mm bbbb");
  const attendeeNames = event.attendees?.map((attendee) => attendee.email).join(", ") ?? "";

  // if "location" is available then it's most likely a zoom link, but
  // it's a video meet in any case
  // if "conferenceData" is available then it's a google meet
  // conferenceData structure:
  // {conferenceId, conferenceSolution: {iconUri, key: {type}, name}, entryPoints: [{entryPointType, label, uri}], signature}

  let location = "";
  let locationLabel = "";
  let eventButtonLabel = "";
  const link = event.link.replace(/(^\w+:|^)\/\//, "");
  const eventLink = event.htmlLink;
  if (event.location) {
    location = event.location;
    locationLabel = location.replace(/(^\w+:|^)\/\//, "");
    // get the domain name
    let hostname = locationLabel.split(/[/?#]/)[0];
    if (hostname.indexOf(".") !== -1) {
      hostname = hostname.substring(0, hostname.lastIndexOf("."));
    }
    // uppercase the 1st character
    hostname = hostname.charAt(0).toUpperCase() + hostname.slice(1);
    eventButtonLabel = `Join with ${hostname}`;
  } else if (event?.conferenceData?.entryPoints?.length) {
    // get it out of the conference Data
    if (event.hangoutLink) {
      location = event.hangoutLink;
    } else {
      location = event.conferenceData.entryPoints[0].uri;
    }
    locationLabel = event.conferenceData.entryPoints[0].label;
    eventButtonLabel = "Join with " + event.conferenceData.conferenceSolution.name;
  } else {
    // use the link
    location = event.link ?? event.htmlLink;
    locationLabel = link.substring(0, link.lastIndexOf("/"));
    eventButtonLabel = "View Event";
  }

  const summary = event.isProtected ? event.summary : event.description ?? event.summary;

  // name, summary, organizer, status, location
  const templateVars = {
    cardTextColor,
    cardBackgroundColor,
    cardInputHeaderColor,
    location,
    locationLabel,
    name: event.name,
    organizer: event.organizer?.email ?? "",
    summary,
    status: event.status,
    attendeeCount: event.attendeeCount,
    dateString,
    attendeeNames,
    eventButtonLabel,
    eventLink,
  };

  const templateString = fs.readFileSync(getCalendarViewTemplate()).toString();
  const fillTemplate = function (templateString: string, templateVars: any) {
    return new Function("return `" + templateString + "`;").call(templateVars);
  };

  // return the html content
  return fillTemplate(templateString, templateVars);
}

function getInputFormStyles() {
  let cardTextColor = "#FFFFFF";
  let cardBackgroundColor = "rgba(255,255,255,0.05)";
  let cardInputHeaderColor = "#e6e2e2";
  if (window.activeColorTheme.kind === 1) {
    cardTextColor = "#444444";
    cardBackgroundColor = "rgba(0,0,0,0.10)";
    cardInputHeaderColor = "#565758";
  }
  return { cardTextColor, cardBackgroundColor, cardInputHeaderColor };
}
