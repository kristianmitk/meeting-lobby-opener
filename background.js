import { isDue, isJoinable, meetingLink, newMeetingLink } from "./meeting-link.js";
import { CLIENT_ID, DEFAULT_SETTINGS } from "./settings.js";

const ALARM = "poll-calendar";
const LOOKAHEAD_MS = 12 * 60 * 60 * 1000;
const OPENED_RETENTION_MS = 24 * 60 * 60 * 1000;
const TOKEN_EXPIRY_MARGIN_MS = 60 * 1000;
const SCOPE = "https://www.googleapis.com/auth/calendar.events.readonly";
const SHORTCUT_JOIN_WINDOW_MS = 15 * 60 * 1000;
const LISTED_MEETINGS = 20;

class SignInRequired extends Error {}

// A silent sign-in started while the interactive window is open breaks that window
let interactiveSignInOpen = false;

chrome.runtime.onInstalled.addListener(scheduleAlarm);
chrome.runtime.onStartup.addListener(scheduleAlarm);
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM) poll();
});

chrome.commands.onCommand.addListener((command) => {
  if (command === "join-meeting") joinCurrentMeeting();
  if (command === "new-meeting") startNewMeeting();
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const handlers = {
    connect: () => connect(),
    poll: () => poll(),
    disconnect: () => disconnect(),
    join: () => openMeeting(message.key, message.link),
    newMeeting: () => startNewMeeting(),
  };
  const handler = handlers[message.type];
  if (!handler) return false;
  handler()
    .then(() => sendResponse({ ok: true }))
    .catch((error) => sendResponse({ ok: false, error: String(error.message ?? error) }));
  return true; // keeps sendResponse alive for the async handler
});

function scheduleAlarm() {
  chrome.alarms.create(ALARM, { periodInMinutes: 0.5, delayInMinutes: 0 });
}

async function poll() {
  if (interactiveSignInOpen) return;
  const { connected } = await chrome.storage.local.get("connected");
  if (!connected) return setStatus("signin", "Connect your Google Calendar to get started");

  const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  let calendar;
  try {
    calendar = await fetchUpcomingEvents(settings);
  } catch (error) {
    if (error instanceof SignInRequired) return setStatus("signin", "Google sign-in expired — connect again");
    return setStatus("error", error.message);
  }

  const now = Date.now();
  const meetings = calendar.items
    .filter(isJoinable)
    .map((event) => ({ event, link: meetingLink(event, calendar.summary) }))
    .filter(({ link }) => link);

  if (settings.enabled) {
    const leadMs = settings.leadSeconds * 1000;
    const lateGraceMs = settings.lateGraceMinutes * 60 * 1000;
    const { opened = {} } = await chrome.storage.local.get("opened");
    for (const { event, link } of meetings) {
      if (opened[meetingKey(event)] || !isDue(event, now, leadMs, lateGraceMs)) continue;
      await openMeeting(meetingKey(event), link);
    }
  }

  await chrome.storage.local.set({
    account: calendar.summary,
    upcoming: meetings.slice(0, LISTED_MEETINGS).map(({ event, link }) => ({
      key: meetingKey(event),
      title: event.summary ?? "(no title)",
      start: event.start.dateTime,
      end: event.end?.dateTime,
      link,
    })),
  });
  await setStatus("ok", settings.enabled ? "Watching your calendar" : "Paused");
}

async function fetchUpcomingEvents(settings) {
  const now = Date.now();
  const params = new URLSearchParams({
    timeMin: new Date(now - settings.lateGraceMinutes * 60 * 1000).toISOString(),
    timeMax: new Date(now + LOOKAHEAD_MS).toISOString(),
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "50",
  });
  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`;

  let response = await fetch(url, { headers: { Authorization: `Bearer ${await getToken(false)}` } });
  if (response.status === 401) {
    await chrome.storage.session.remove("token");
    response = await fetch(url, { headers: { Authorization: `Bearer ${await getToken(false)}` } });
  }
  if (!response.ok) throw new Error(`Google Calendar answered ${response.status}`);
  return response.json();
}

async function connect() {
  interactiveSignInOpen = true;
  try {
    await getToken(true);
  } finally {
    interactiveSignInOpen = false;
  }
  await chrome.storage.local.set({ connected: true });
  await poll();
}

async function disconnect() {
  const { token } = await chrome.storage.session.get("token");
  if (token) {
    // Best effort: the local state is cleared even if Google cannot be reached
    await fetch(`https://oauth2.googleapis.com/revoke?token=${token.accessToken}`, { method: "POST" }).catch(() => {});
  }
  await chrome.storage.session.remove("token");
  await chrome.storage.local.remove(["connected", "account", "upcoming"]);
  await setStatus("signin", "Connect your Google Calendar to get started");
}

async function getToken(interactive) {
  const { token } = await chrome.storage.session.get("token");
  if (!interactive && token && token.expiresAt - TOKEN_EXPIRY_MARGIN_MS > Date.now()) return token.accessToken;

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.search = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "token",
    redirect_uri: chrome.identity.getRedirectURL(),
    scope: SCOPE,
    prompt: interactive ? "select_account" : "none",
  });

  let responseUrl;
  try {
    responseUrl = await chrome.identity.launchWebAuthFlow({ url: authUrl.toString(), interactive });
  } catch (error) {
    if (!interactive) throw new SignInRequired();
    throw new Error(`Sign-in did not finish: ${error.message}`);
  }
  const result = new URLSearchParams(new URL(responseUrl).hash.slice(1));
  if (result.get("error")) {
    if (!interactive) throw new SignInRequired();
    throw new Error(`Sign-in failed: ${result.get("error")}`);
  }

  const fresh = {
    accessToken: result.get("access_token"),
    expiresAt: Date.now() + Number(result.get("expires_in")) * 1000,
  };
  await chrome.storage.session.set({ token: fresh });
  return fresh.accessToken;
}

async function joinCurrentMeeting() {
  const { upcoming = [] } = await chrome.storage.local.get("upcoming");
  const now = Date.now();
  const meeting = upcoming.find(({ start, end }) => {
    const startMs = Date.parse(start);
    return now >= startMs - SHORTCUT_JOIN_WINDOW_MS && now <= Date.parse(end ?? start);
  });
  if (meeting) await openMeeting(meeting.key, meeting.link);
}

async function startNewMeeting() {
  const { account } = await chrome.storage.local.get("account");
  await openLobby(newMeetingLink(account));
}

async function openMeeting(key, link) {
  await openLobby(link);
  const now = Date.now();
  const { opened = {} } = await chrome.storage.local.get("opened");
  opened[key] = now;
  await chrome.storage.local.set({
    opened: Object.fromEntries(Object.entries(opened).filter(([, at]) => now - at < OPENED_RETENTION_MS)),
  });
}

function meetingKey(event) {
  return `${event.id}@${event.start.dateTime}`;
}

async function openLobby(url) {
  try {
    const tab = await chrome.tabs.create({ url, active: true });
    await chrome.windows.update(tab.windowId, { focused: true, drawAttention: true });
  } catch {
    await chrome.windows.create({ url, focused: true });
  }
}

async function setStatus(state, message) {
  await chrome.storage.local.set({ status: { state, message, at: Date.now() } });
  await chrome.action.setBadgeText({ text: state === "ok" ? "" : "!" });
  await chrome.action.setBadgeBackgroundColor({ color: state === "signin" ? "#f29900" : "#d93025" });
}
