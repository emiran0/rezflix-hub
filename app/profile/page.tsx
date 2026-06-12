import type { Metadata } from "next";

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
import { LinkJellyfinForm } from "@/components/jellyfin/link-jellyfin-form";

export const metadata: Metadata = {
  title: "Profile · REZFLIX Hub",
};

const ROLE_LABEL: Record<string, string> = {
  applicant: "Applicant",
  member: "Member",
  admin: "Admin",
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="text-muted-foreground text-sm">{label}</dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  );
}

export default async function ProfilePage() {
  const sessionUser = await requireUser();

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: {
      username: true,
      email: true,
      displayName: true,
      role: true,
      jellyfinUserId: true,
      jellyfinLinkedAt: true,
    },
  });
  // requireUser guarantees a valid session; a missing row would mean the account was
  // deleted out from under the session — treat as not-linked and let them re-link/anew.
  const linked = Boolean(user?.jellyfinUserId);

  return (
    <PageContainer>
      <Section className="mx-auto max-w-2xl">
        <FadeIn className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Your REZFLIX Hub account.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="divide-border divide-y">
                <Row
                  label="Username"
                  value={user?.username ?? sessionUser.username}
                />
                <Row label="Email" value={user?.email ?? "—"} />
                {user?.displayName ? (
                  <Row label="Display name" value={user.displayName} />
                ) : null}
                <Row
                  label="Role"
                  value={ROLE_LABEL[user?.role ?? "applicant"] ?? "Applicant"}
                />
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Jellyfin account</CardTitle>
              <CardDescription>
                {linked
                  ? "Your Jellyfin account is linked — you have member access."
                  : "Link your existing Jellyfin account to unlock member access."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {linked ? (
                <dl className="divide-border divide-y">
                  <Row label="Status" value="Linked" />
                  {user?.jellyfinLinkedAt ? (
                    <Row
                      label="Linked on"
                      value={user.jellyfinLinkedAt.toLocaleDateString()}
                    />
                  ) : null}
                </dl>
              ) : (
                <LinkJellyfinForm />
              )}
            </CardContent>
          </Card>
        </FadeIn>
      </Section>
    </PageContainer>
  );
}
