import { signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Logout is a state-changing POST, so it goes through a form + server action rather than
// a link. `signOut` clears the JWT session cookie and redirects home. Server component:
// the inline action runs server-side, so no client JS is shipped for it.
export function SignOutButton({
  className,
  variant = "ghost",
}: {
  className?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
}) {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/" });
      }}
    >
      <Button type="submit" variant={variant} className={cn(className)}>
        Log out
      </Button>
    </form>
  );
}
