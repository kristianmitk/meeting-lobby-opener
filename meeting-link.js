const MEETING_URL_PATTERN =
  /https:\/\/(?:[\w-]+\.)?(?:meet\.google\.com\/[a-z0-9-]+|zoom\.us\/(?:j|my|w)\/[^\s"'<>)]+|teams\.microsoft\.com\/l\/meetup-join\/[^\s"'<>)]+|teams\.live\.com\/meet\/[^\s"'<>)]+|webex\.com\/[^\s"'<>)]+|whereby\.com\/[^\s"'<>)]+)/i;

const NEW_MEET_URL = "https://meet.google.com/new";

const SKIPPED_EVENT_TYPES = new Set(["workingLocation", "outOfOffice", "focusTime"]);

export function meetingLink(event, accountEmail) {
  const link = conferenceLink(event) ?? linkInText(`${event.location ?? ""} ${event.description ?? ""}`);
  if (!link) return null;
  return withGoogleAccount(link, accountEmail);
}

export function newMeetingLink(accountEmail) {
  return withGoogleAccount(NEW_MEET_URL, accountEmail);
}

export function isJoinable(event) {
  if (!event.start?.dateTime) return false; // all-day events have only start.date
  if (SKIPPED_EVENT_TYPES.has(event.eventType)) return false;
  if (event.status === "cancelled") return false;
  const self = event.attendees?.find((attendee) => attendee.self);
  return self?.responseStatus !== "declined";
}

export function isDue(event, now, leadMs, lateGraceMs) {
  const start = Date.parse(event.start.dateTime);
  const end = Date.parse(event.end?.dateTime ?? event.start.dateTime);
  return now >= start - leadMs && now <= Math.min(start + lateGraceMs, end);
}

function conferenceLink(event) {
  if (event.hangoutLink) return event.hangoutLink;
  return event.conferenceData?.entryPoints?.find((entry) => entry.entryPointType === "video")?.uri ?? null;
}

function linkInText(text) {
  // Descriptions are HTML, so links inside href attributes carry &amp; entities
  const match = text.replaceAll("&amp;", "&").match(MEETING_URL_PATTERN);
  return match ? match[0] : null;
}

// Without authuser, Meet opens in the browser's default Google account, which
// may not be the one invited to the meeting
function withGoogleAccount(link, accountEmail) {
  if (!accountEmail || !link.includes("meet.google.com")) return link;
  const url = new URL(link);
  url.searchParams.set("authuser", accountEmail);
  return url.toString();
}
