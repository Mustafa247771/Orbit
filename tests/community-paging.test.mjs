import assert from "node:assert/strict";
import test from "node:test";
import {
  FEED_PAGE_SIZE,
  comparePosts,
  decodeFeedCursor,
  encodeFeedCursor,
  makeFeedPage,
  makePost,
} from "../src/features/community/model/feedPaging.ts";

const post = (id, createdAt) => ({ id, createdAt });
const posts = (count) =>
  Array.from({ length: count }, (_, index) => post(`p${String(index).padStart(3, "0")}`, 1000 - index));

test("cursor: encode then decode round-trips", () => {
  const cursor = encodeFeedCursor(1234.5, "abc");
  assert.deepEqual(decodeFeedCursor(cursor), [1234.5, "abc"]);
});

test("cursor: empty values mean first page", () => {
  assert.equal(decodeFeedCursor(null), null);
  assert.equal(decodeFeedCursor(undefined), null);
  assert.equal(decodeFeedCursor(""), null);
});

test("cursor: malformed cursors throw a clear error", () => {
  for (const bad of [
    "not json",
    "{}",
    "[1]",
    "[1,2]",
    '["1","a"]',
    "[1,\"\"]",
    "[1,\"a/b\"]",
    "[null,\"a\"]",
    "[1,\"a\",3]",
  ]) {
    assert.throws(() => decodeFeedCursor(bad), /Invalid feed cursor/, bad);
  }
});

test("makeFeedPage: a short list is the last page", () => {
  const page = makeFeedPage(posts(FEED_PAGE_SIZE));
  assert.equal(page.posts.length, FEED_PAGE_SIZE);
  assert.equal(page.cursor, null);
  assert.deepEqual(makeFeedPage([]), { posts: [], cursor: null });
});

test("makeFeedPage: one extra post means another page exists", () => {
  const list = posts(FEED_PAGE_SIZE + 1);
  const page = makeFeedPage(list);
  assert.equal(page.posts.length, FEED_PAGE_SIZE);
  const last = list[FEED_PAGE_SIZE - 1];
  assert.deepEqual(decodeFeedCursor(page.cursor), [last.createdAt, last.id]);
});

test("comparePosts: newest first, then id descending on ties", () => {
  const sorted = [post("a", 1), post("c", 2), post("b", 2), post("d", 3)].sort(comparePosts);
  assert.deepEqual(sorted.map((item) => item.id), ["d", "c", "b", "a"]);
  assert.equal(comparePosts(post("a", 1), post("a", 1)), 0);
});

test("makePost: trims text and derives the cell from coordinates", () => {
  const author = { uid: "u", name: "N", initials: "N", rank: "Observer" };
  const made = makePost(
    author,
    { caption: "  hi there ", objectName: " Moon ", photoUrl: null, latitude: 30.9, longitude: 31.2 },
    "id1",
  );
  assert.equal(made.caption, "hi there");
  assert.equal(made.objectName, "Moon");
  assert.equal(made.cell, "30:31");
  assert.equal(made.commentCount, 0);
  const bare = makePost(author, { caption: "abc", objectName: "Mars", photoUrl: null }, "id2");
  assert.equal(bare.cell, null);
  assert.equal(bare.sightingId, null);
});
