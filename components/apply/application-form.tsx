"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import {
  applicationSchema,
  REFERRAL_OPTIONS,
  type ApplicationInput,
} from "@/lib/validations/application";
import { submitApplication } from "@/app/apply/actions";

export function ApplicationForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<ApplicationInput>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      displayName: "",
      contact: "",
      referralSource: undefined,
      watchInterests: "",
      devices: "",
      agreeToRules: false,
      note: "",
    },
  });

  function onSubmit(values: ApplicationInput) {
    setFormError(null);
    startTransition(async () => {
      const result = await submitApplication(values);
      if ("error" in result) {
        setFormError(result.error);
        return;
      }
      // Submitted: the server revalidated /apply; refresh to show the status view.
      router.refresh();
    });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
        noValidate
      >
        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display name</FormLabel>
              <FormControl>
                <Input placeholder="What should we call you?" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contact"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact</FormLabel>
              <FormControl>
                <Input placeholder="Email or Discord handle" {...field} />
              </FormControl>
              <FormDescription>
                How we&apos;ll reach you about your application.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="referralSource"
          render={({ field }) => (
            <FormItem>
              <FormLabel>How did you hear about REZFLIX?</FormLabel>
              <FormControl>
                <select
                  {...field}
                  className={cn(
                    "h-11 w-full rounded-lg border border-input bg-transparent px-3 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive md:text-sm dark:bg-input/30",
                    !field.value && "text-muted-foreground",
                  )}
                >
                  <option value="" disabled>
                    Select one…
                  </option>
                  {REFERRAL_OPTIONS.map((o) => (
                    <option
                      key={o.value}
                      value={o.value}
                      className="text-foreground"
                    >
                      {o.label}
                    </option>
                  ))}
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="watchInterests"
          render={({ field }) => (
            <FormItem>
              <FormLabel>What do you want to watch?</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Films, shows, genres you're into…"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="devices"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Devices you&apos;ll use</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. Apple TV, iPhone, web browser"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Anything else?{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </FormLabel>
              <FormControl>
                <Textarea placeholder="A note for the admins…" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="agreeToRules"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-start gap-3">
                <FormControl>
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                    className="border-input accent-primary focus-visible:ring-ring/50 mt-1 size-5 shrink-0 rounded border focus-visible:ring-3"
                  />
                </FormControl>
                <FormLabel className="font-normal">
                  I agree to the REZFLIX house rules.
                </FormLabel>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {formError ? (
          <p className="text-destructive text-sm">{formError}</p>
        ) : null}

        <Button type="submit" className="h-11 w-full" disabled={isPending}>
          {isPending ? "Submitting…" : "Submit application"}
        </Button>
      </form>
    </Form>
  );
}
