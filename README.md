# Meeting Lobby Opener

Chrome/Chromium extension (MV3). Every 30 s it reads your primary Google
Calendar. When a meeting with a video link starts, it opens the link in a new
tab and focuses the window, so you land in the lobby (Meet's "Ready to join?"
screen, or the Zoom/Teams launcher).

- Link sources: Meet / conference data first, then Zoom, Teams, Webex and Whereby links in location or description.
- Skips all-day events, declined events, focus time, out-of-office and working-location entries.
- Opens each occurrence only once. Opens 30 s before start by default; if the laptop was asleep, still opens up to 5 min after start.
- Meet links get `authuser=<calendar email>`, so they open in the right Google account.
- Read-only scope: `calendar.events.readonly`. The token stays in session storage; nothing leaves the browser except the call to Google.

## Install

1. `chrome://extensions` → Developer mode → **Load unpacked** → this folder.
2. Click the extension icon → **Connect Google Calendar**.

`Alt+Shift+J` joins the current or next meeting; **+ New meeting** starts an instant Meet (it has no default shortcut). Change or set both under `chrome://extensions/shortcuts`.
The icon shows an orange `!` when it needs you to connect again, red `!` on errors.

## Google OAuth client (publisher only)

The client ID is built into `settings.js` (`CLIENT_ID`). The client lives in
dedicated Google Cloud project of the personal account (client ID prefix
`747484621322`) → Google Auth Platform → Clients (type *Web application*),
with the redirect URI
`https://lnfpbaagpkmgggafpbabnejnojcialjd.chromiumapp.org/` — the trailing
slash matters.

The `key` in `manifest.json` pins the extension ID, so that URI is the same on
every install. `key.pem` is the matching private key (gitignored) — keep it if
you want to publish to the Web Store under the same ID.

While the app is in *Testing*, only users listed under Audience → Test users
can connect.

## Share with a colleague

    npm run bundle

writes the extension files from the last commit to `dist/meeting-lobby-opener/`
(load that folder with **Load unpacked**) and zips it to
`dist/meeting-lobby-opener.zip`. Uncommitted changes, tests and `key.pem` are
not included. The colleague unzips it, loads the
`meeting-lobby-opener` folder with **Load unpacked**, and clicks **Connect
Google Calendar**. While the OAuth app is in *Testing*, add them as a test
user first.

## Tests

    npm test
