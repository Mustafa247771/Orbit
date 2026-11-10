import assert from "node:assert/strict";
import test from "node:test";
import {
  accountDocErrorMessage,
  cacheFileName,
  decideWinner,
  parseCacheEnvelope,
  parseCloudCopy,
  settleAfterPush,
} from "../src/core/storage/cloudDocModel.ts";

const cloud = (t, data = { from: "cloud" }) => ({ data, clientUpdatedAt: t });
const cache = (t, pending, data = { from: "cache" }) => ({
  data,
  clientUpdatedAt: t,
  pending,
});

test("cache file name is per document and per account", () => {
  assert.equal(cacheFileName("profile", "u1"), "cloud-profile-u1.json");
});

test("nothing anywhere decides none", () => {
  assert.deepEqual(decideWinner(null, null), { use: "none", push: false });
});

test("cloud only is used without pushing", () => {
  assert.deepEqual(decideWinner(cloud(5), null), { use: "cloud", push: false });
});

test("phone copy with an empty cloud is uploaded", () => {
  assert.deepEqual(decideWinner(null, cache(5, false)), { use: "cache", push: true });
  assert.deepEqual(decideWinner(null, cache(5, true)), { use: "cache", push: true });
});

test("a pending phone copy beats the cloud copy whatever the clocks say", () => {
  assert.deepEqual(decideWinner(cloud(5), cache(9, true)), { use: "cache", push: true });
  assert.deepEqual(decideWinner(cloud(9), cache(5, true)), { use: "cache", push: true });
  assert.deepEqual(decideWinner(cloud(9), cache(9, true)), { use: "cache", push: true });
});

test("a confirmed phone copy never beats the cloud, even when newer", () => {
  assert.deepEqual(decideWinner(cloud(5), cache(9, false)), { use: "cloud", push: false });
});

test("cache envelope parsing keeps the pending flag and rejects bad files", () => {
  assert.deepEqual(parseCacheEnvelope({ data: [1], clientUpdatedAt: 3, pending: true }), {
    data: [1],
    clientUpdatedAt: 3,
    pending: true,
  });
  assert.equal(parseCacheEnvelope({ data: 1, clientUpdatedAt: 3 }).pending, false);
  assert.equal(parseCacheEnvelope({ data: 1, clientUpdatedAt: 3, pending: "yes" }).pending, false);
  assert.equal(parseCacheEnvelope(null), null);
  assert.equal(parseCacheEnvelope({ data: 1 }), null);
  assert.equal(parseCacheEnvelope({ data: 1, clientUpdatedAt: "3" }), null);
  assert.equal(parseCacheEnvelope({ clientUpdatedAt: 3 }), null);
});

test("cloud copy parsing needs data and a numeric clientUpdatedAt", () => {
  assert.deepEqual(parseCloudCopy({ data: { a: 1 }, clientUpdatedAt: 7, updatedAt: {} }), {
    data: { a: 1 },
    clientUpdatedAt: 7,
  });
  assert.equal(parseCloudCopy({ data: 1 }), null);
  assert.equal(parseCloudCopy(undefined), null);
});

test("settling after a push clears pending only for the same edit", () => {
  assert.equal(settleAfterPush(cache(5, true), 5).pending, false);
  assert.equal(settleAfterPush(cache(8, true), 5).pending, true);
  assert.equal(settleAfterPush(null, 5), null);
});

test("error messages are friendly and fall back for unknown errors", () => {
  assert.match(accountDocErrorMessage({ code: "firestore/unavailable" }), /offline/);
  assert.match(accountDocErrorMessage({ code: "timeout" }), /too long/);
  assert.match(accountDocErrorMessage(new Error("boom")), /could not be synced/);
});
