import assert from "node:assert/strict";
import test from "node:test";
import { ApodError } from "../src/features/apod/model/Apod.ts";
import {
  apodErrorFromResponse,
  apodErrorMessage,
  apodPageUrl,
  parseApodEntry,
  parseApodList,
} from "../src/features/apod/model/apodParsing.ts";

const image = {
  date: "2024-05-10",
  title: "Aurora",
  explanation: "  Lights.  ",
  media_type: "image",
  url: "https://apod.nasa.gov/apod/image/a.jpg",
  hdurl: "https://apod.nasa.gov/apod/image/a_big.jpg",
  copyright: "\nJane   Doe\n",
  service_version: "v1",
};

test("parseApodEntry: image", () => {
  const e = parseApodEntry(image);
  assert.equal(e.kind, "image");
  assert.equal(e.imageUrl, image.url);
  assert.equal(e.hdUrl, image.hdurl);
  assert.equal(e.videoUrl, null);
  assert.equal(e.explanation, "Lights.");
  assert.equal(e.copyright, "Jane Doe");
  assert.equal(e.pageUrl, "https://apod.nasa.gov/apod/ap240510.html");
});

test("parseApodEntry: missing hdurl, http upgraded, blank copyright", () => {
  const e = parseApodEntry({
    ...image,
    hdurl: undefined,
    url: "http://apod.nasa.gov/apod/image/old.jpg",
    copyright: " \n ",
  });
  assert.equal(e.hdUrl, null);
  assert.equal(e.imageUrl, "https://apod.nasa.gov/apod/image/old.jpg");
  assert.equal(e.copyright, null);
});

test("parseApodEntry: YouTube video gets watch link and thumbnail", () => {
  const e = parseApodEntry({
    ...image,
    media_type: "video",
    url: "https://www.youtube.com/embed/abc123XYZ_-?rel=0",
    hdurl: undefined,
  });
  assert.equal(e.kind, "video");
  assert.equal(e.videoUrl, "https://www.youtube.com/watch?v=abc123XYZ_-");
  assert.equal(e.thumbnailUrl, "https://img.youtube.com/vi/abc123XYZ_-/hqdefault.jpg");
  assert.equal(e.imageUrl, e.thumbnailUrl);
  const short = parseApodEntry({ ...image, media_type: "video", url: "http://youtu.be/abc123XYZ_-" });
  assert.equal(short.videoUrl, "https://www.youtube.com/watch?v=abc123XYZ_-");
});

test("parseApodEntry: video prefers the API thumbnail; Vimeo link", () => {
  const e = parseApodEntry({
    ...image,
    media_type: "video",
    url: "https://player.vimeo.com/video/123456?h=x",
    thumbnail_url: "http://img.example.com/t.jpg",
  });
  assert.equal(e.videoUrl, "https://vimeo.com/123456");
  assert.equal(e.thumbnailUrl, "https://img.example.com/t.jpg");
  const bare = parseApodEntry({
    ...image,
    media_type: "video",
    url: "https://player.vimeo.com/video/123456",
  });
  assert.equal(bare.imageUrl, null);
});

test("parseApodEntry: other media has no image unless thumbnail", () => {
  const e = parseApodEntry({ ...image, media_type: "other", url: "https://x.org/page" });
  assert.equal(e.kind, "other");
  assert.equal(e.imageUrl, null);
  assert.equal(e.videoUrl, null);
  const t = parseApodEntry({ ...image, media_type: "other", thumbnail_url: "https://x.org/t.png" });
  assert.equal(t.imageUrl, "https://x.org/t.png");
});

test("parseApodEntry: rejects malformed input", () => {
  assert.equal(parseApodEntry(null), null);
  assert.equal(parseApodEntry("nope"), null);
  assert.equal(parseApodEntry([]), null);
  assert.equal(parseApodEntry({ ...image, date: "2024-02-30" }), null);
  assert.equal(parseApodEntry({ ...image, title: "  " }), null);
  assert.equal(parseApodEntry({ ...image, url: undefined }), null);
});

test("apodPageUrl: two-digit year path", () => {
  assert.equal(apodPageUrl("1995-06-16"), "https://apod.nasa.gov/apod/ap950616.html");
});

test("parseApodList: skips invalid items and sorts newest first", () => {
  const list = parseApodList([
    { ...image, date: "2024-05-08", title: "B" },
    { bad: true },
    { ...image, date: "2024-05-10", title: "A" },
    null,
    { ...image, date: "2024-05-09", title: "C" },
  ]);
  assert.deepEqual(list.map((e) => e.date), ["2024-05-10", "2024-05-09", "2024-05-08"]);
  assert.deepEqual(parseApodList("junk"), []);
  assert.equal(parseApodList(image).length, 1);
});

test("apodErrorFromResponse: gateway body shape", () => {
  const limit = apodErrorFromResponse(429, { error: { code: "OVER_RATE_LIMIT", message: "slow" } });
  assert.ok(limit instanceof ApodError);
  assert.equal(limit.code, "rate-limit");
  assert.equal(
    apodErrorFromResponse(403, { error: { code: "API_KEY_INVALID", message: "bad" } }).code,
    "invalid-key",
  );
  assert.equal(
    apodErrorFromResponse(403, { error: { code: "API_KEY_MISSING", message: "none" } }).code,
    "invalid-key",
  );
});

test("apodErrorFromResponse: APOD body shape and statuses", () => {
  assert.equal(
    apodErrorFromResponse(400, { code: 400, msg: "Date must be between Jun 16, 1995 and today." }).code,
    "out-of-range",
  );
  assert.equal(apodErrorFromResponse(404, { code: 404, msg: "No data available" }).code, "not-published");
  assert.equal(apodErrorFromResponse(500, { code: 500, msg: "Internal" }).code, "server");
  assert.equal(apodErrorFromResponse(503, null).code, "server");
  assert.equal(apodErrorFromResponse(429, null).code, "rate-limit");
  assert.equal(apodErrorFromResponse(403, "<html>").code, "invalid-key");
});

test("apodErrorFromResponse: malformed bodies", () => {
  assert.equal(apodErrorFromResponse(400, { msg: "bad count" }).code, "bad-response");
  assert.equal(apodErrorFromResponse(418, undefined).code, "bad-response");
  assert.equal(apodErrorFromResponse(400, []).code, "bad-response");
  assert.equal(apodErrorFromResponse(404, 42).code, "not-published");
});

test("apodErrorMessage: friendly text per code", () => {
  assert.match(apodErrorMessage(new ApodError("rate-limit", "x")), /busy/);
  assert.match(apodErrorMessage(new ApodError("rate-limit", "x")), /little while/);
  for (const code of [
    "invalid-key",
    "not-published",
    "out-of-range",
    "network",
    "timeout",
    "server",
    "bad-response",
  ]) {
    assert.ok(apodErrorMessage(new ApodError(code, "x")).length > 10, code);
  }
  assert.match(apodErrorMessage(new Error("boom")), /try again/i);
  assert.match(apodErrorMessage("weird"), /try again/i);
});
