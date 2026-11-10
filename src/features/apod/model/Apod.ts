export type ApodKind = "image" | "video" | "other";

export type ApodEntry = {
  date: string;
  title: string;
  explanation: string;
  kind: ApodKind;
  /** Image to display: the picture itself, or a video/other thumbnail. */
  imageUrl: string | null;
  hdUrl: string | null;
  /** Link the user can open to watch a video. */
  videoUrl: string | null;
  thumbnailUrl: string | null;
  copyright: string | null;
  pageUrl: string;
};

export type ApodErrorCode =
  | "rate-limit"
  | "invalid-key"
  | "not-published"
  | "out-of-range"
  | "network"
  | "timeout"
  | "server"
  | "bad-response";

export class ApodError extends Error {
  code: ApodErrorCode;

  constructor(code: ApodErrorCode, message: string) {
    super(message);
    this.name = "ApodError";
    this.code = code;
  }
}

export function isApodError(value: unknown): value is ApodError {
  return value instanceof ApodError;
}
