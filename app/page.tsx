import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FadeIn } from "@/components/motion/fade-in";

// TEMPORARY: Phase 0.2 verification that shadcn primitives render dark + on-token.
// Replaced by the real landing page in Phase 7.
export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <FadeIn className="w-full max-w-md">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>REZFLIX Hub</CardTitle>
            <CardDescription>
              Dark-only theme check — shadcn/ui (new-york) on DESIGN-SYSTEM
              tokens.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-muted-foreground">
              If this card is dark with a warm primary button, tokens are wired.
            </p>
          </CardFooter>
        </Card>
      </FadeIn>
    </main>
  );
}
