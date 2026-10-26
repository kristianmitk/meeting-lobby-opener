// Stands in for the chrome.* APIs so popup.html renders demo data outside the extension
const demoNow = new Date();
demoNow.setHours(9, 58, 0, 0);
Date.now = () => demoNow.getTime();

const at = (hours, minutes) => new Date(new Date(demoNow).setHours(hours, minutes, 0, 0)).toISOString();
const meeting = (key, title, start, end) => ({ key, title, start: at(...start), end: at(...end), link: "#" });

const local = {
  connected: window.storeView !== "signin",
  account: "you@example.com",
  status: window.storeView === "signin"
    ? { state: "signin", message: "Connect your Google Calendar to get started" }
    : { state: "ok", message: "Watching your calendar" },
  upcoming: [
    meeting("1", "Daily stand-up", [9, 45], [10, 0]),
    meeting("2", "Design review", [10, 30], [11, 0]),
    meeting("3", "Customer onboarding call", [11, 0], [11, 45]),
    meeting("4", "1:1 with Alex", [13, 30], [14, 0]),
    meeting("5", "Sprint planning", [15, 0], [16, 0]),
  ],
};

window.chrome = {
  storage: {
    sync: { get: async (defaults) => defaults, set: async () => {} },
    local: { get: async () => local },
    onChanged: { addListener() {} },
  },
  tabs: { create() {} },
  runtime: { sendMessage: async () => ({ ok: true }) },
  commands: { getAll: async () => [{ name: "join-meeting", shortcut: "Alt+Shift+J" }] },
};
