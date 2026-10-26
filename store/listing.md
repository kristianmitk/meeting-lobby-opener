# Chrome Web Store listing

Copy these values into the [Developer Dashboard](https://chrome.google.com/webstore/devconsole).
Upload `dist/meeting-lobby-opener-store.zip` (built by `npm run bundle`).

## Store listing tab

**Name** (from the manifest): Meeting Lobby Opener

**Summary** (from the manifest): Opens the video-call lobby in a new tab when a Google Calendar meeting starts.

**Description**

```
Never miss the start of a meeting again.

Meeting Lobby Opener watches your Google Calendar. When a meeting with a video link starts, it opens the meeting lobby in a new tab and brings the browser window to the front, so you are on the "Ready to join?" screen on time.

FEATURES
• Opens Google Meet, Zoom, Microsoft Teams, Webex and Whereby links from your calendar events
• Open the lobby when the meeting starts, or up to 5 minutes early to check camera and microphone
• Away when the meeting started? The lobby still opens when you are back, but only within a time you choose, so you never land in a meeting that is half over
• Each meeting opens only once
• The toolbar icon shows how many meetings are left today
• See your next meetings and join any of them with one click
• Keyboard shortcut (Alt+Shift+J) joins the current or next meeting
• Start an instant Google Meet from the popup
• Skips declined, cancelled and all-day events, focus time and out-of-office blocks
• Pause it any time with one switch

PRIVACY
• Read-only access to your calendar events
• Works entirely in your browser. There is no server, no analytics and no tracking
• Disconnect revokes the access at once

Privacy policy: https://github.com/kristianmitk/gmeet-lobby-opener/blob/main/PRIVACY.md
```

**Category**: Productivity → Workflow & Planning

**Language**: English

**Graphic assets** (all in `store/`, rebuilt by `store/render.sh`)

| Field | File |
| --- | --- |
| Store icon (128×128) | `icons/icon-128.png` |
| Screenshots (1280×800) | `screenshot-1-meetings.png`, `screenshot-2-timing.png`, `screenshot-3-signin.png` |
| Small promo tile (440×280) | `promo-tile-440x280.png` |

**Homepage URL**: https://github.com/kristianmitk/gmeet-lobby-opener

**Support URL**: https://github.com/kristianmitk/gmeet-lobby-opener/issues

## Privacy tab

**Single purpose**

```
Opens the video-call lobby of a Google Calendar meeting in a new tab when the meeting starts.
```

**Permission justifications**

| Permission | Justification |
| --- | --- |
| `identity` | Signs the user in with Google (chrome.identity.launchWebAuthFlow) to get read-only access to their calendar events. |
| `alarms` | Checks the calendar every 30 seconds, so the lobby opens when a meeting starts, also after the service worker was stopped. |
| `storage` | Keeps the user's settings, the list of upcoming meetings for the popup, and which meetings were already opened, so a meeting opens only once. |
| Host permission `https://www.googleapis.com/*` | Reads the user's calendar events from the Google Calendar API. |
| Host permission `https://oauth2.googleapis.com/*` | Revokes the Google access token when the user clicks Disconnect. |

**Are you using remote code?** No, I am not using remote code.

**Data usage** — tick:

- Personally identifiable information (the Google account email, used to open Meet links with the right account)
- Authentication information (the Google access token, kept in session storage)
- Personal communications (calendar event titles, times, descriptions and meeting links)

Then tick all three certifications:

- I do not sell or transfer user data to third parties, outside of the approved use cases
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose
- I do not use or transfer user data to determine creditworthiness or for lending purposes

**Privacy policy URL**: https://github.com/kristianmitk/gmeet-lobby-opener/blob/main/PRIVACY.md

## Distribution tab

**Visibility**: Unlisted (only people with the link can install it) or Public.

## Test instructions (for the reviewer)

```
1. Click the toolbar icon and then "Connect Google Calendar". Sign in with any Google account and allow read-only calendar access.
2. Create a calendar event that starts in 2 minutes and add Google Meet video conferencing to it.
3. The popup lists the event under "Next meetings". When the event starts (30 seconds before, by default), the Meet lobby opens in a new tab.
The extension has no account or server of its own.
```

## Before you submit

1. The OAuth consent screen of the Google Cloud project must be **In production**,
   not *Testing*. In *Testing* only listed test users can sign in, so the
   reviewer gets `403 access_denied` and the review can fail.
2. After the first upload, the dashboard shows the store item ID. Add
   `https://<store item ID>.chromiumapp.org/` as an authorized redirect URI on
   the OAuth client. Without it, sign-in fails with `redirect_uri_mismatch`.
3. Push the repository, so the privacy policy URL works.
