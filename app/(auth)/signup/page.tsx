import type { Metadata } from "next";
import Link from "next/link";

import { requireGuest } from "@/lib/auth-guards";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FadeIn } from "@/components/motion/fade-in";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Create account · REZFLIX Hub",
};

export default async function SignupPage() {
  // Already signed in? Nothing to do here.
  await requireGuest();

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <FadeIn className="w-full max-w-md">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Create your Hub account</CardTitle>
            <CardDescription>
              One account for REZFLIX. After signing up you can link your
              Jellyfin account or apply to join.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SignupForm />
            <p className="text-muted-foreground mt-6 text-center text-sm">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-foreground underline-offset-4 hover:underline"
              >
                Log in
              </Link>
            </p>
          </CardContent>
        </Card>
      </FadeIn>
    </main>
  );
}
