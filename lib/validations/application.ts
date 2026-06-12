import { z } from "zod";
import type { ApplicationStatus } from "@prisma/client";

// The join questionnaire (PRD §5.3). Kept schema-driven: the questions live here and the
// answers are stored as a single JSON blob on `Application.answers`, so adding/removing a
// question is a schema + form edit — never a migration. The admin review (4.4) reads the
// same shape back. Field set is deliberately easy to adjust.

// Options for the one select field; the Zod enum derives from these so they can't drift.
export const REFERRAL_OPTIONS = [
  { value: "friend", label: "A friend or family member" },
  { value: "reddit", label: "Reddit" },
  { value: "discord", label: "Discord" },
  { value: "search", label: "A search engine" },
  { value: "other", label: "Somewhere else" },
] as const;

const referralValues = REFERRAL_OPTIONS.map((o) => o.value) as [
  string,
  ...string[],
];

export const applicationSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "Tell us what to call you")
    .max(60, "Keep it under 60 characters"),
  contact: z
    .string()
    .trim()
    .min(2, "Add a way to reach you")
    .max(120, "Keep it under 120 characters"),
  referralSource: z.enum(referralValues, {
    message: "Pick how you found us",
  }),
  watchInterests: z
    .string()
    .trim()
    .min(2, "Tell us a little about what you watch")
    .max(1000, "Keep it under 1000 characters"),
  devices: z
    .string()
    .trim()
    .min(2, "Which devices will you watch on?")
    .max(200, "Keep it under 200 characters"),
  agreeToRules: z
    .boolean()
    .refine((v) => v === true, "You must agree to the house rules"),
  note: z.string().trim().max(1000, "Keep it under 1000 characters").optional(),
});

export type ApplicationInput = z.input<typeof applicationSchema>;
export type ApplicationValues = z.output<typeof applicationSchema>;

// Which application statuses an applicant may still edit/resubmit from (PRD §5.3 —
// "re-submission allowed if rejected", configurable). `approved` is locked (you're in —
// don't reset yourself to pending); `none` just means no application yet (blank form).
export const RESUBMITTABLE_STATUSES = ["pending", "rejected"] as const;

export function isResubmittable(status: ApplicationStatus): boolean {
  return (RESUBMITTABLE_STATUSES as readonly string[]).includes(status);
}
