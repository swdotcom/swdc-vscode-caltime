let meetingCheckTimer: NodeJS.Timeout = null;

export function initializeMeetingCheckTimer() {
  if (!meetingCheckTimer) {
    meetingCheckTimer = setInterval(() => {
      checkForUpcomingMeetings();
    }, 1000 * 60 * 2);
  }
}

export function checkForUpcomingMeetings() {
  //
}

export function dispose() {
  if (meetingCheckTimer) {
    clearTimeout(meetingCheckTimer);
    meetingCheckTimer = null;
  }
}
