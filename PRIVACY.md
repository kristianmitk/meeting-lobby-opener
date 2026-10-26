# Privacy policy — Meeting Lobby Opener

Last updated: 26 October 2026

Meeting Lobby Opener is a browser extension that opens the video-call lobby of
a Google Calendar meeting when the meeting starts. This page explains which
data the extension uses and where that data goes.

## Short version

- The extension reads your Google Calendar events, read-only.
- All processing happens inside your browser.
- The extension has no server. The developer does not receive, store or see
  any of your data.
- Nothing is sold, shared with third parties, or used for advertising.

## Data the extension uses

| Data | Why | Where it is kept |
| --- | --- | --- |
| Calendar events of your primary calendar for the rest of the day and the next 12 hours: title, start and end time, status, event type, your own response, location, description, video-call link. The extension does not request the other attendees | To find meetings with a video link and to open the lobby when a meeting starts | Read in memory. For the meetings with a video link, title, start, end and link are kept in the extension's local browser storage so the popup can list them |
| Your Google account email address (returned by the Calendar API as the calendar name) | To open Google Meet links with the correct Google account | Extension's local browser storage |
| Google access token | To call the Google Calendar API | Extension session storage, deleted when the browser closes |
| Your settings (on/off, timing) | To remember your choices | Chrome sync storage of your browser profile |
| Which meetings were already opened | So that a meeting opens only once | Extension's local browser storage, removed after 24 hours |

The extension asks Google only for the
`https://www.googleapis.com/auth/calendar.events.readonly` permission. It
cannot change, create or delete calendar events, and it cannot read your email
or other Google data.

## Where data is sent

The extension talks only to Google:

- `accounts.google.com` to sign in,
- `www.googleapis.com` to read your calendar events,
- `oauth2.googleapis.com` to revoke the access token when you click
  **Disconnect**.

When a meeting starts, the extension opens the meeting link in a new tab. The
video-call provider (for example Google Meet, Zoom or Microsoft Teams) then
handles that page under its own privacy policy.

The extension does not use analytics, tracking, cookies or remote code.

## Your control

- **Disconnect** in the extension popup revokes the Google access token and
  deletes the stored account and meeting list.
- Removing the extension deletes all of its stored data from your browser.
- You can also remove the extension's access at
  <https://myaccount.google.com/permissions>.

## Google API Services User Data Policy

Meeting Lobby Opener's use and transfer of information received from Google
APIs adheres to the
[Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy),
including the Limited Use requirements.

## Changes

If this policy changes, the new version is published at this address with a
new date.

## Contact

Open an issue at <https://github.com/kristianmitk/gmeet-lobby-opener/issues>.
