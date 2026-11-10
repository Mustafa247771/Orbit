import { REPORT_REASONS } from "./communityTypes.ts";

export const REPORT_NOTE_MAX = 200;

export type ReportErrors = Partial<Record<"reason" | "note", string>>;

export function validateReport(input: {
  reason: string | null;
  note: string;
}): ReportErrors {
  const errors: ReportErrors = {};

  if (!REPORT_REASONS.some((item) => item.value === input.reason)) {
    errors.reason = "Choose a reason for your report.";
  }
  if (input.note.trim().length > REPORT_NOTE_MAX) {
    errors.note = `Keep your note to ${REPORT_NOTE_MAX} characters.`;
  }
  return errors;
}
