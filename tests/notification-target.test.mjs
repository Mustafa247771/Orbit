import assert from "node:assert/strict";
import test from "node:test";
import { notificationTarget } from "../src/core/notifications/notificationTarget.ts";

test("allowed hrefs map to their routes", () => {
  assert.equal(notificationTarget({ href: "/apod" }), "/apod");
  assert.equal(notificationTarget({ href: "/launches" }), "/launches");
});

test("unknown or unsafe hrefs are ignored", () => {
  for (const href of ["/profile", "/apod/", "https://evil.test", "", 5, null]) {
    assert.equal(notificationTarget({ href }), null);
  }
});

test("missing or garbage data is ignored", () => {
  for (const bad of [undefined, null, "/apod", 7, [], {}, { url: "/apod" }]) {
    assert.equal(notificationTarget(bad), null);
  }
});
