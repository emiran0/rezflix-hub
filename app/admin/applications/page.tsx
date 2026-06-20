import type { Metadata } from "next";

import { requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { PageContainer } from "@/components/page-container";
import { Section } from "@/components/section";
import { Card, CardContent } from "@/components/ui/card";
import { FadeIn } from "@/components/motion/fade-in";
import {
  ApplicationReviewItem,
  type ApplicationRow,
} from "@/components/admin/application-review-item";

export const metadata: Metadata = {
  title: "Applications · REZFLIX Hub",
};

// Pending applications float to the top so the admin sees what needs action first.
const STATUS_ORDER: Record<string, number> = {
  pending: 0,
  rejected: 1,
  approved: 2,
  none: 3,
};

export default async function AdminApplicationsPage() {
  await requireAdmin();

  const applications = await prisma.application.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      answers: true,
      createdAt: true,
      reviewedAt: true,
      user: { select: { username: true, email: true } },
    },
  });

  const rows: ApplicationRow[] = applications
    .map((a) => ({
      id: a.id,
      status: a.status,
      submittedAtLabel: a.createdAt ? a.createdAt.toLocaleDateString() : null,
      reviewedAtLabel: a.reviewedAt ? a.reviewedAt.toLocaleDateString() : null,
      applicant: { username: a.user.username, email: a.user.email },
      answers: (a.answers ?? {}) as Record<string, unknown>,
    }))
    .sort(
      (x, y) => (STATUS_ORDER[x.status] ?? 9) - (STATUS_ORDER[y.status] ?? 9),
    );

  return (
    <PageContainer>
      <Section className="mx-auto max-w-2xl">
        <FadeIn className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Applications
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Review join requests. Approving doesn&apos;t grant access on its
              own — create the Jellyfin account, then the applicant links it to
              become a member.
            </p>
          </div>

          {rows.length === 0 ? (
            <Card>
              <CardContent className="text-muted-foreground pt-6 text-sm">
                No applications yet.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {rows.map((row) => (
                <ApplicationReviewItem key={row.id} row={row} />
              ))}
            </div>
          )}
        </FadeIn>
      </Section>
    </PageContainer>
  );
}
