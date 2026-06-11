import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// TEMPORARY: Phase 0.2 verification that shadcn primitives render dark + on-token.
// Replaced by the real landing page in Phase 7.
export default function Home() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>REZFLIX Hub</CardTitle>
          <CardDescription>
            Dark-only theme check — shadcn/ui (new-york) on DESIGN-SYSTEM tokens.
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
    </main>
  );
}
