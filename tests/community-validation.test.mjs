import assert from "node:assert/strict";
import test from "node:test";
import {
  CAPTION_MAX,
  CAPTION_MIN,
  OBJECT_NAME_MAX,
  OBJECT_NAME_MIN,
  POST_COOLDOWN_MS,
  canPostAgain,
  validatePostDraft,
} from "../src/features/community/model/postValidation.ts";
import {
  COMMENT_MAX,
  validateComment,
} from "../src/features/community/model/commentValidation.ts";
import {
  REPORT_NOTE_MAX,
  validateReport,
} from "../src/features/community/model/reportValidation.ts";
import {
  OBSERVER_SEARCH_MAX,
  OBSERVER_SEARCH_MIN,
  validateObserverSearch,
} from "../src/features/community/model/searchValidation.ts";

const draft = { caption: "Saw Jupiter", objectName: "Jupiter" };

test("post draft: a valid draft has no errors", () => {
  assert.deepEqual(validatePostDraft(draft), {});
});

test("post draft: blank and too-short captions are rejected", () => {
  assert.ok(validatePostDraft({ ...draft, caption: "   " }).caption);
  assert.match(validatePostDraft({ ...draft, caption: "ab" }).caption, /at least 3/);
});

test("post draft: caption boundaries 3 and 500 are accepted, 501 is not", () => {
  assert.equal(validatePostDraft({ ...draft, caption: "x".repeat(CAPTION_MIN) }).caption, undefined);
  assert.equal(validatePostDraft({ ...draft, caption: "x".repeat(CAPTION_MAX) }).caption, undefined);
  assert.match(validatePostDraft({ ...draft, caption: "x".repeat(CAPTION_MAX + 1) }).caption, /500/);
});

test("post draft: object name boundaries 2 and 40 are accepted, 1 and 41 are not", () => {
  assert.equal(validatePostDraft({ ...draft, objectName: "x".repeat(OBJECT_NAME_MIN) }).objectName, undefined);
  assert.equal(validatePostDraft({ ...draft, objectName: "x".repeat(OBJECT_NAME_MAX) }).objectName, undefined);
  assert.ok(validatePostDraft({ ...draft, objectName: "x" }).objectName);
  assert.ok(validatePostDraft({ ...draft, objectName: "x".repeat(OBJECT_NAME_MAX + 1) }).objectName);
  assert.ok(validatePostDraft({ ...draft, objectName: "  " }).objectName);
});

test("post draft: both fields can fail at once", () => {
  const errors = validatePostDraft({ caption: "", objectName: "" });
  assert.ok(errors.caption);
  assert.ok(errors.objectName);
});

test("post cooldown: first post and posts after 10 seconds are allowed", () => {
  assert.equal(canPostAgain(null, 1000), true);
  assert.equal(canPostAgain(0, POST_COOLDOWN_MS), true);
});

test("post cooldown: a post one millisecond early is blocked", () => {
  assert.equal(canPostAgain(0, POST_COOLDOWN_MS - 1), false);
});

test("comment: blank is rejected, 1 and 300 characters are accepted, 301 is not", () => {
  assert.ok(validateComment("   "));
  assert.equal(validateComment("a"), null);
  assert.equal(validateComment(`  ${"x".repeat(COMMENT_MAX)}  `), null);
  assert.match(validateComment("x".repeat(COMMENT_MAX + 1)), /300/);
});

test("report: a valid reason with no note is accepted", () => {
  assert.deepEqual(validateReport({ reason: "spam", note: "" }), {});
});

test("report: missing or unknown reason is rejected", () => {
  assert.ok(validateReport({ reason: null, note: "" }).reason);
  assert.ok(validateReport({ reason: "rude", note: "" }).reason);
});

test("report: note of 200 characters is accepted, 201 is not", () => {
  assert.equal(validateReport({ reason: "other", note: "x".repeat(REPORT_NOTE_MAX) }).note, undefined);
  assert.match(validateReport({ reason: "other", note: "x".repeat(REPORT_NOTE_MAX + 1) }).note, /200/);
});

test("observer search: blank and one character are rejected", () => {
  for (const query of ["", "  ", "a", "  a "]) {
    assert.match(validateObserverSearch(query), /at least 2/);
  }
});

test("observer search: 2 and 40 trimmed characters are accepted, 41 is not", () => {
  assert.equal(validateObserverSearch("x".repeat(OBSERVER_SEARCH_MIN)), null);
  assert.equal(validateObserverSearch(` ${"x".repeat(OBSERVER_SEARCH_MAX)} `), null);
  assert.match(validateObserverSearch("x".repeat(OBSERVER_SEARCH_MAX + 1)), /40/);
});
