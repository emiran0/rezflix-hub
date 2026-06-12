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
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign in · REZFLIX Hub",
};

export default async function LoginPage() {
  // Already signed in? Nothing to do here.
  await requireGuest();

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <FadeIn className="w-full max-w-md">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Sign in to REZFLIX Hub</CardTitle>
            <CardDescription>
              Use your Hub username and password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
            <p className="text-muted-foreground mt-6 text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="text-foreground underline-offset-4 hover:underline"
              >
                Create one
              </Link>
            </p>
          </CardContent>
        </Card>
      </FadeIn>
    </main>
  );
}
