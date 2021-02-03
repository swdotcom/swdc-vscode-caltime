import { ViewColumn, WebviewPanel, window } from "vscode";
import { CalEvent } from "../models/CalEvent";
import path = require("path");
import fs = require("fs");
import { format } from "date-fns";

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
        case "locationSelect":
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
  const attendeeNames = event.attendees.map((attendee) => attendee.email).join(", ");

  // name, summary, organizer, status, location
  const templateVars = {
    cardTextColor,
    cardBackgroundColor,
    cardInputHeaderColor,
    location: event.location || event.htmlLink,
    name: event.name,
    organizer: event.organizer?.email ?? "",
    summary: event.summary,
    status: event.status,
    attendeeCount: event.attendeeCount,
    dateString,
    attendeeNames,
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
