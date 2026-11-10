import assert from "node:assert/strict";
import test from "node:test";
import {
  emailLocalPart,
  handleOf,
  initialsOf,
  nameOf,
} from "../src/features/profile/model/profileNames.ts";

test("emailLocalPart returns the text before the @ and empty for null", () => {
  assert.equal(emailLocalPart("jane.doe@example.com"), "jane.doe");
  assert.equal(emailLocalPart(null), "");
});

test("nameOf prefers the trimmed display name", () => {
  assert.equal(nameOf({ displayName: "  Jane Doe ", email: "j@x.com" }), "Jane Doe");
});

test("nameOf falls back to the email local part when display name is null or blank", () => {
  assert.equal(nameOf({ displayName: null, email: "jane@x.com" }), "jane");
  assert.equal(nameOf({ displayName: "   ", email: "jane@x.com" }), "jane");
});

test("nameOf falls back to Observer when there is no name and no email", () => {
  assert.equal(nameOf({ displayName: null, email: null }), "Observer");
});

test("handleOf uses the email local part, or observer without an email", () => {
  assert.equal(handleOf({ displayName: "Jane", email: "jane.doe@x.com" }), "jane.doe");
  assert.equal(handleOf({ displayName: "Jane", email: null }), "observer");
});

test("initialsOf returns ? for an empty or blank name", () => {
  assert.equal(initialsOf(""), "?");
  assert.equal(initialsOf("   "), "?");
});

test("initialsOf gives one uppercase letter for a single word", () => {
  assert.equal(initialsOf("jane"), "J");
});

test("initialsOf uses first and last word for several words", () => {
  assert.equal(initialsOf("jane doe"), "JD");
  assert.equal(initialsOf("  ada  king  lovelace "), "AL");
});
