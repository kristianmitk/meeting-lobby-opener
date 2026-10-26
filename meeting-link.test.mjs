import assert from "node:assert/strict";
import { test } from "node:test";
import { countStartingLaterToday, endOfDay, isDue, isJoinable, meetingLink, newMeetingLink } from "./meeting-link.js";

const at = (iso) => ({ dateTime: iso });

test("prefers the Meet link and pins the Google account", () => {
  const link = meetingLink({ hangoutLink: "https://meet.google.com/abc-defg-hij" }, "me@x.com");
  assert.equal(link, "https://meet.google.com/abc-defg-hij?authuser=me%40x.com");
});

test("starts a new Meet in the calendar's Google account", () => {
  assert.equal(newMeetingLink("me@x.com"), "https://meet.google.com/new?authuser=me%40x.com");
  assert.equal(newMeetingLink(undefined), "https://meet.google.com/new");
});

test("finds a Zoom link inside an HTML description", () => {
  const event = { description: '<a href="https://us02web.zoom.us/j/123?pwd=a&amp;b=1">Join</a>' };
  assert.equal(meetingLink(event), "https://us02web.zoom.us/j/123?pwd=a&b=1");
});

test("finds a Teams link in the location", () => {
  const event = { location: "https://teams.microsoft.com/l/meetup-join/19%3ameeting_x/0?context=y" };
  assert.match(meetingLink(event), /^https:\/\/teams\.microsoft\.com\/l\/meetup-join\//);
});

test("returns null without a link", () => {
  assert.equal(meetingLink({ location: "Office 3" }), null);
});

test("skips all-day, declined and focus-time events", () => {
  assert.equal(isJoinable({ start: { date: "2026-10-26" } }), false);
  assert.equal(isJoinable({ start: at("2026-10-26T10:00:00Z"), attendees: [{ self: true, responseStatus: "declined" }] }), false);
  assert.equal(isJoinable({ start: at("2026-10-26T10:00:00Z"), eventType: "focusTime" }), false);
  assert.equal(isJoinable({ start: at("2026-10-26T10:00:00Z"), attendees: [{ self: true, responseStatus: "accepted" }] }), true);
});

test("counts only meetings that start later today", () => {
  const now = new Date(2026, 9, 26, 12, 0).getTime();
  const startingAt = (...parts) => ({ start: { dateTime: new Date(2026, 9, ...parts).toISOString() } });
  const events = [startingAt(26, 11, 30), startingAt(26, 12, 0), startingAt(26, 14, 0), startingAt(26, 23, 30), startingAt(27, 9, 0)];
  assert.equal(countStartingLaterToday(events, now), 2);
});

test("end of day is the last millisecond of the local day", () => {
  const end = new Date(endOfDay(new Date(2026, 9, 26, 7, 15).getTime()));
  assert.deepEqual([end.getDate(), end.getHours(), end.getMinutes()], [26, 23, 59]);
});

test("is due from the lead time until the grace period ends", () => {
  const event = { start: at("2026-10-26T10:00:00Z"), end: at("2026-10-26T10:30:00Z") };
  const t = (iso) => Date.parse(iso);
  assert.equal(isDue(event, t("2026-10-26T09:59:00Z"), 30_000, 300_000), false);
  assert.equal(isDue(event, t("2026-10-26T09:59:45Z"), 30_000, 300_000), true);
  assert.equal(isDue(event, t("2026-10-26T10:04:00Z"), 30_000, 300_000), true);
  assert.equal(isDue(event, t("2026-10-26T10:06:00Z"), 30_000, 300_000), false);
});
