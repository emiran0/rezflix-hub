"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  reviewApplication,
  type ReviewDecision,
} from "@/app/admin/applications/actions";
import { REFERRAL_OPTIONS } from "@/lib/validations/application";

type Status = "none" | "pending" | "approved" | "rejected";

export type ApplicationRow = {
  id: string;
  status: Status;
  submittedAtLabel: string | null;
  reviewedAtLabel: string | null;
  applicant: { username: string; email: string };
  answers: Record<string, unknown>;
};

const STATUS_STYLE: Record<Status, string> = {
  none: "text-muted-foreground",
  pending: "text-warning",
  approved: "text-success",
  rejected: "text-destructive",
};

const REFERRAL_LABEL = new Map<string, string>(
  REFERRAL_OPTIONS.map((o) => [o.value, o.label]),
);

// Stored answers are keyed by the questionnaire schema (lib/validations/application.ts).
// Listed here so the admin sees them in a stable, labeled order.
const ANSWER_FIELDS: { key: string; label: string }[] = [
  { key: "displayName", label: "Display name" },
  { key: "contact", label: "Contact" },
  { key: "referralSource", label: "Heard about us" },
  { key: "watchInterests", label: "Wants to watch" },
  { key: "devices", label: "Devices" },
  { key: "note", label: "Note" },
];

function formatAnswer(key: string, value: unknown): string {
  if (value == null || value === "") return "—";
  if (key === "referralSource" && typeof value === "string") {
    return REFERRAL_LABEL.get(value) ?? value;
  }
  return String(value);
}

export function ApplicationReviewItem({ row }: { row: ApplicationRow }) {
  const [status, setStatus] = useState<Status>(row.status);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function decide(decision: ReviewDecision) {
    setError(null);
    startTransition(async () => {
      const result = await reviewApplication(row.id, decision);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setStatus(decision === "approve" ? "approved" : "rejected");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-3">
          <span>{row.applicant.username}</span>
          <span className={`text-sm font-medium ${STATUS_STYLE[status]}`}>
            {status === "none" ? "—" : status}
          </span>
        </CardTitle>
        <p className="text-muted-foreground text-sm">{row.applicant.email}</p>
        {row.submittedAtLabel ? (
          <p className="text-muted-foreground text-xs">
            Submitted {row.submittedAtLabel}
            {row.reviewedAtLabel ? ` · reviewed ${row.reviewedAtLabel}` : ""}
          </p>
        ) : null}
      </CardHeader>

      <CardContent>
        <dl className="divide-border divide-y text-sm">
          {ANSWER_FIELDS.map((field) => (
            <div key={field.key} className="grid grid-cols-3 gap-3 py-2">
              <dt className="text-muted-foreground col-span-1">
                {field.label}
              </dt>
              <dd className="col-span-2 break-words whitespace-pre-wrap">
                {formatAnswer(field.key, row.answers[field.key])}
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>

      <CardFooter className="flex-col items-stretch gap-2">
        {error ? <p className="text-destructive text-sm">{error}</p> : null}
        <div className="flex gap-2">
          <Button
            onClick={() => decide("approve")}
            disabled={pending || status === "approved"}
          >
            Approve
          </Button>
          <Button
            variant="outline"
            onClick={() => decide("reject")}
            disabled={pending || status === "rejected"}
          >
            Reject
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
