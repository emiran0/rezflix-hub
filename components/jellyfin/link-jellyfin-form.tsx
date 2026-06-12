"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  linkJellyfinSchema,
  type LinkJellyfinInput,
} from "@/lib/validations/jellyfin";
import { linkJellyfin } from "@/app/profile/actions";

export function LinkJellyfinForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<LinkJellyfinInput>({
    resolver: zodResolver(linkJellyfinSchema),
    defaultValues: { jellyfinUsername: "", jellyfinPassword: "" },
  });

  function onSubmit(values: LinkJellyfinInput) {
    setFormError(null);
    startTransition(async () => {
      const result = await linkJellyfin(values);
      if ("error" in result) {
        setFormError(result.error);
        return;
      }
      // Linked: the server revalidated /profile; refresh to show the linked state.
      toast.success("Jellyfin account linked. You're now a member.");
      form.reset();
      router.refresh();
    });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-5"
        noValidate
      >
        <FormField
          control={form.control}
          name="jellyfinUsername"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Jellyfin username</FormLabel>
              <FormControl>
                <Input
                  autoComplete="off"
                  placeholder="your Jellyfin login"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="jellyfinPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Jellyfin password</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="off" {...field} />
              </FormControl>
              <FormDescription>
                Used once to verify you own the account, then discarded — we
                never store your Jellyfin password.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {formError ? (
          <p className="text-destructive text-sm">{formError}</p>
        ) : null}

        <Button type="submit" className="h-11 w-full" disabled={isPending}>
          {isPending ? "Linking…" : "Link Jellyfin account"}
        </Button>
      </form>
    </Form>
  );
}
