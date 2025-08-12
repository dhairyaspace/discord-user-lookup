const DISCORD_API = "https://discord.com/api/v10";

export type DiscordUser = {
  id: string;
  username: string;
  global_name?: string | null;
  discriminator?: string;
  avatar?: string | null;
  banner?: string | null;
  bio?: string | null;
  avatar_decoration?: string | null;
};

function authHeaders() {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) throw new Error("Missing DISCORD_BOT_TOKEN");
  return {
    Authorization: `Bot ${token}`,
    "Content-Type": "application/json",
  };
}

export async function fetchUser(userId: string): Promise<DiscordUser> {
  const res = await fetch(`${DISCORD_API}/users/${encodeURIComponent(userId)}`, {
    headers: authHeaders(),
    cache: "no-store",
  });

  if (res.status === 429) {
    const retry = res.headers.get("retry-after");
    throw new Error(`Rate limited by Discord. Retry after ${retry ?? "a bit"} seconds.`);
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch user: ${res.status} ${text}`);
  }

  const user = await res.json();

  return {
    id: user.id,
    username: user.username,
    global_name: user.global_name ?? null,
    discriminator: user.discriminator,
    avatar: user.avatar,
    banner: user.banner ?? null,
    bio: null,
    avatar_decoration: user.avatar_decoration_data?.asset ?? null,
  };
}

export async function fetchUserProfile(userId: string): Promise<{ bio: string | null; banner: string | null }> {
  const res = await fetch(`${DISCORD_API}/users/${encodeURIComponent(userId)}/profile`, {
    headers: authHeaders(),
    cache: "no-store",
  });

  if (res.status === 403) return { bio: null, banner: null };

  if (res.status === 429) {
    const retry = res.headers.get("retry-after");
    throw new Error(`Rate limited by Discord. Retry after ${retry ?? "a bit"} seconds.`);
  }

  if (!res.ok) return { bio: null, banner: null };

  const json = await res.json();
  const bio = json?.user_profile?.bio ?? json?.bio ?? null;
  const banner = json?.user?.banner ?? json?.banner ?? null;
  return { bio, banner };
}

export function avatarUrl(user: { id: string; avatar: string | null }): string | null {
  if (!user.avatar) return null;
  const ext = user.avatar.startsWith("a_") ? "gif" : "png";
  return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${ext}?size=512`;
}

export function bannerUrl(user: { id: string; banner: string | null }): string | null {
  if (!user.banner) return null;
  const ext = user.banner.startsWith("a_") ? "gif" : "png";
  return `https://cdn.discordapp.com/banners/${user.id}/${user.banner}.${ext}?size=1024`;
}

export function avatarDecorationUrl(user: { avatar_decoration: string | null }): string | null {
  const asset = user.avatar_decoration;
  if (!asset) return null;
  // No stable, documented CDN path yet -> return null to avoid broken image.
  return null;
}
