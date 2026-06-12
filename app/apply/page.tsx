import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { PageContainer } from "@/components/page-container";
import { Section } from "@/components/section";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FadeIn } from "@/components/motion/fade-in";
import { ApplicationForm } from "@/components/apply/application-form";

export const metadata: Metadata = {
  title: "Apply to join · REZFLIX Hub",
};

// Copy per application status (PRD §5.3). Approval alone doesn't grant member access — an
// admin creates the Jellyfin account, then the user links it (ARCHITECTURE §5.5).
const STATUS_VIEW: Record<
  "pending" | "approved" | "rejected",
  { title: string; description: string }
> = {
  pending: {
    title: "Application received",
    description:
      "Thanks! An admin will review your application. We'll reach out using the contact you provided.",
  },
  approved: {
    title: "You're approved 🎉",
    description:
      "An admin will set up your Jellyfin account. Once it's ready, link it from your profile to unlock member access.",
  },
  rejected: {
    title: "Not approved this time",
    description:
      "Your application wasn't approved. You may be able to re-apply later.",
  },
};

export default async function ApplyPage() {
  const sessionUser = await requireUser();

  // Members/admins have no reason to apply — send them to their profile.
  if (sessionUser.role !== "applicant") redirect("/profile");

  const application = await prisma.application.findUnique({
    where: { userId: sessionUser.id },
    select: { status: true, createdAt: true },
  });

  const submitted =
    application && application.status !== "none"
      ? STATUS_VIEW[application.status as "pending" | "approved" | "rejected"]
      : null;

  return (
    <PageContainer>
      <Section className="mx-auto max-w-2xl">
        <FadeIn className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Apply to join REZFLIX
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Tell us a bit about you. An admin reviews each request.
            </p>
          </div>

          {submitted ? (
            <Card>
              <CardHeader>
                <CardTitle>{submitted.title}</CardTitle>
                <CardDescription>{submitted.description}</CardDescription>
              </CardHeader>
              {application?.createdAt ? (
                <CardContent>
                  <p className="text-muted-foreground text-sm">
                    Submitted {application.createdAt.toLocaleDateString()}.
                  </p>
                </CardContent>
              ) : null}
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <ApplicationForm />
              </CardContent>
            </Card>
          )}
        </FadeIn>
      </Section>
    </PageContainer>
  );
}
