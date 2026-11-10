import assert from "node:assert/strict";
import test from "node:test";
import {
  authErrorMessage,
  errorCode,
} from "../src/features/auth/model/authErrors.ts";

const GENERIC = "We could not complete that request. Please try again.";

test("errorCode returns the string code of an error object", () => {
  assert.equal(errorCode({ code: "auth/invalid-email" }), "auth/invalid-email");
});

test("errorCode returns an empty string when there is no string code", () => {
  for (const bad of [null, undefined, "oops", 5, {}, { code: 42 }]) {
    assert.equal(errorCode(bad), "");
  }
});

test("a known Firebase code maps to its friendly message", () => {
  assert.equal(
    authErrorMessage({ code: "auth/invalid-email" }),
    "Enter a valid email address.",
  );
});

test("an unknown code falls back to the generic message", () => {
  assert.equal(authErrorMessage({ code: "auth/unheard-of" }), GENERIC);
});

test("non-object errors fall back to the generic message", () => {
  assert.equal(authErrorMessage("boom"), GENERIC);
  assert.equal(authErrorMessage(null), GENERIC);
});
