import { DEFAULT_SETTINGS } from "./settings.js";

const $ = (id) => document.getElementById(id);
const MINUTE_MS = 60 * 1000;
const CLOCK_REFRESH_MS = 30 * 1000;

const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);
$("enabled").checked = settings.enabled;
$("leadSeconds").value = String(settings.leadSeconds);
$("lateGraceMinutes").value = String(settings.lateGraceMinutes);

$("enabled").addEventListener("change", () => saveAndPoll({ enabled: $("enabled").checked }));

$("leadSeconds").addEventListener("change", () => saveAndPoll({ leadSeconds: Number($("leadSeconds").value) }));
$("lateGraceMinutes").addEventListener("change", () => saveAndPoll({ lateGraceMinutes: Number($("lateGraceMinutes").value) }));
$("connect").addEventListener("click", () => send({ type: "connect" }));
$("disconnect").addEventListener("click", () => send({ type: "disconnect" }));
$("new-meeting").addEventListener("click", () => send({ type: "newMeeting" }));
$("change-shortcut").addEventListener("click", () => chrome.tabs.create({ url: "chrome://extensions/shortcuts" }));

chrome.storage.onChanged.addListener(render);
render();
renderShortcut();
send({ type: "poll" });
setInterval(render, CLOCK_REFRESH_MS);

async function saveAndPoll(change) {
  await chrome.storage.sync.set(change);
  await send({ type: "poll" });
}

async function send(message) {
  const response = await chrome.runtime.sendMessage(message);
  if (!response?.ok) showStatus("error", response?.error ?? "The extension did not answer — reload it");
}

async function render() {
  const { connected, status, account, upcoming = [] } = await chrome.storage.local.get(["connected", "status", "account", "upcoming"]);
  const needsSignIn = !connected || status?.state === "signin";
  $("signin").hidden = !needsSignIn;
  $("main").hidden = needsSignIn;
  $("signin-message").textContent = status?.message ?? "Connect your Google Calendar to get started";
  if (needsSignIn) return;

  if (status) showStatus(status.state, status.message);
  $("account").textContent = account ?? "";
  $("upcoming").replaceChildren(...upcoming.map(meetingItem));
  $("empty").hidden = upcoming.length > 0;
}

async function renderShortcut() {
  const commands = await chrome.commands.getAll();
  const shortcut = commands.find(({ name }) => name === "join-meeting")?.shortcut;
  if (!shortcut) return;
  $("shortcut").textContent = shortcut;
}

function meetingItem(meeting) {
  const start = new Date(meeting.start);
  const end = meeting.end ? new Date(meeting.end) : start;
  const isLive = Date.now() >= start && Date.now() <= end;
  const item = element("li", isLive ? "live" : "");

  const when = element("div", "when");
  when.append(
    element("div", "time", start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })),
    element("div", "relative", relativeTime(start, isLive)),
  );
  const join = element("button", "join", "Join");
  join.addEventListener("click", () => send({ type: "join", key: meeting.key, link: meeting.link }));

  item.append(when, Object.assign(element("div", "title", meeting.title), { title: meeting.title }), join);
  return item;
}

function relativeTime(start, isLive) {
  if (isLive) return "now";
  if (start.toDateString() !== new Date().toDateString()) return "tomorrow";
  const minutes = Math.round((start - Date.now()) / MINUTE_MS);
  if (minutes < 0) return `${-minutes}m ago`;
  if (minutes < 60) return `in ${minutes}m`;
  return `in ${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

function element(tag, className, text = "") {
  return Object.assign(document.createElement(tag), { className, textContent: text });
}

function showStatus(state, message) {
  $("signin-message").textContent = message;
  $("status").textContent = message;
  $("status").className = state;
  $("status").hidden = state === "ok" && $("enabled").checked;
}
