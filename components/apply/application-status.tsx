"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ApplicationForm } from "@/components/apply/application-form";
import type { ApplicationInput } from "@/lib/validations/application";

type Status = "pending" | "approved" | "rejected";

// Status-specific copy + actions (PRD §5.3). Approval here doesn't grant member access —
// an admin creates the Jellyfin account, then the user links it (ARCHITECTURE §5.5).
const COPY: Record<
  Status,
  { title: string; description: string; editLabel: string; submitLabel: string }
> = {
  pending: {
    title: "Application received",
    description:
      "Thanks! An admin will review your application. You can update it until then.",
    editLabel: "Edit application",
    submitLabel: "Save changes",
  },
  approved: {
    title: "You're approved",
    description:
      "An admin will set up your Jellyfin account. Once it's ready, link it from your profile to unlock member access.",
    editLabel: "",
    submitLabel: "",
  },
  rejected: {
    title: "Not approved this time",
    description:
      "Your application wasn't approved. You can update your answers and resubmit.",
    editLabel: "Edit & resubmit",
    submitLabel: "Resubmit application",
  },
};

export function ApplicationStatus({
  status,
  submittedAtLabel,
  answers,
  canResubmit,
}: {
  status: Status;
  submittedAtLabel: string | null;
  answers: Partial<ApplicationInput>;
  canResubmit: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const copy = COPY[status];

  if (editing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Edit your application</CardTitle>
          <CardDescription>
            Update your answers and submit again. You&apos;ll need to re-agree
            to the house rules.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ApplicationForm
            initialValues={answers}
            submitLabel={copy.submitLabel || "Resubmit application"}
            onCancel={() => setEditing(false)}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{copy.title}</CardTitle>
        <CardDescription>{copy.description}</CardDescription>
      </CardHeader>
      {submittedAtLabel ? (
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Submitted {submittedAtLabel}.
          </p>
        </CardContent>
      ) : null}
      {canResubmit ? (
        <CardFooter>
          <Button variant="outline" onClick={() => setEditing(true)}>
            {copy.editLabel}
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  );
}
