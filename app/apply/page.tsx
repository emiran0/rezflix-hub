import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { PageContainer } from "@/components/page-container";
import { Section } from "@/components/section";
import { Card, CardContent } from "@/components/ui/card";
import { FadeIn } from "@/components/motion/fade-in";
import { ApplicationForm } from "@/components/apply/application-form";
import { ApplicationStatus } from "@/components/apply/application-status";
import {
  isResubmittable,
  type ApplicationInput,
} from "@/lib/validations/application";

export const metadata: Metadata = {
  title: "Apply to join · REZFLIX Hub",
};

export default async function ApplyPage() {
  const sessionUser = await requireUser();

  // Members/admins have no reason to apply — send them to their profile.
  if (sessionUser.role !== "applicant") redirect("/profile");

  const application = await prisma.application.findUnique({
    where: { userId: sessionUser.id },
    select: { status: true, answers: true, createdAt: true },
  });

  const hasSubmitted = application && application.status !== "none";

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

          {hasSubmitted ? (
            <ApplicationStatus
              status={application.status as "pending" | "approved" | "rejected"}
              submittedAtLabel={
                application.createdAt
                  ? application.createdAt.toLocaleDateString()
                  : null
              }
              // Stored from validated input, so safe to feed back as form defaults.
              answers={(application.answers ?? {}) as Partial<ApplicationInput>}
              canResubmit={isResubmittable(application.status)}
            />
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
