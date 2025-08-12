"use server";

import { fetchUser, fetchUserProfile, avatarUrl, bannerUrl, avatarDecorationUrl } from "@/lib/discord";

export type UserResult =
  | {
      ok: true;
      data: {
        id: string;
        username: string;
        displayName: string | null;
        avatar: string | null;
        banner: string | null;
        bio: string | null;
        decoration: string | null;
      };
    }
  | {
      ok: false;
      error: string;
    };

export async function getDiscordUser(formData: FormData): Promise<UserResult> {
  const userId = (formData.get("userId") as string)?.trim();
  if (!userId) return { ok: false, error: "Please provide a Discord user ID." };

  try {
    const user = await fetchUser(userId);
    const profile = await fetchUserProfile(userId);
    user.bio = profile.bio ?? user.bio;
    if (!user.banner && profile.banner) user.banner = profile.banner;

    return {
      ok: true,
      data: {
        id: user.id,
        username: user.username + (user.discriminator && user.discriminator !== "0" ? `#${user.discriminator}` : ""),
        displayName: user.global_name ?? null,
        avatar: avatarUrl(user),
        banner: bannerUrl(user),
        bio: user.bio ?? null,
        decoration: avatarDecorationUrl(user),
      },
    };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Failed to fetch user." };
  }
}
