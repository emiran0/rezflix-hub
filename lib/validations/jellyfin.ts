import { z } from "zod";

// Validation for the "Link Jellyfin Account" form (ARCHITECTURE §5.3). These are the user's
// *Jellyfin* credentials, verified once against Jellyfin as proof of ownership and never
// stored. We don't normalize: Jellyfin usernames can be case-sensitive, and the password
// must be passed through byte-for-byte. We only require both fields to be present.
export const linkJellyfinSchema = z.object({
  jellyfinUsername: z.string().trim().min(1, "Enter your Jellyfin username"),
  jellyfinPassword: z.string().min(1, "Enter your Jellyfin password"),
});

export type LinkJellyfinInput = z.input<typeof linkJellyfinSchema>;
export type LinkJellyfinValues = z.output<typeof linkJellyfinSchema>;
