"use client";

import { useState, useTransition, useMemo } from "react";
import { getDiscordUser } from "./actions";
import styles from "./profile.module.css";

export default function HomePage() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<Awaited<ReturnType<typeof getDiscordUser>> | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setResult(null);
    startTransition(async () => {
      const res = await getDiscordUser(form);
      setResult(res);
    });
  }

  const hasData = result && result.ok;

  return (
    <main className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Discord User Lookup</h1>
        <p className={styles.subtitle}>Enter a Discord User ID to preview a polished profile card.</p>
      </div>

      <form onSubmit={onSubmit} className={styles.form}>
        <input
          type="text"
          name="userId"
          placeholder="e.g., 80351110224678912"
          required
          className={styles.input}
          aria-label="Discord User ID"
        />
        <button type="submit" disabled={pending} className={styles.button}>
          {pending ? "Fetching..." : "Create Card"}
        </button>
      </form>

      <section className={styles.resultSection}>
        {pending && (
          <div className={styles.card + " " + styles.cardSkeleton} aria-busy="true" aria-live="polite">
            <div className={styles.bannerSkeleton} />
            <div className={styles.avatarSkeleton} />
            <div className={styles.metaSkeleton}>
              <div className={styles.line} />
              <div className={styles.lineShort} />
            </div>
          </div>
        )}

        {result && !result.ok && (
          <div className={styles.errorBox} role="alert">
            <span className={styles.errorDot} />
            <div>
              <strong>Error:</strong> {result.error}
            </div>
          </div>
        )}

        {hasData && result?.ok && (
          <ProfileCard
            displayName={result.data.displayName}
            username={result.data.username}
            id={result.data.id}
            avatar={result.data.avatar}
            banner={result.data.banner}
            bio={result.data.bio}
            decoration={result.data.decoration}
          />
        )}
      </section>

      <footer className={styles.footer}>
        Note: Some profile cosmetics like avatar decorations may not be available via public APIs for arbitrary users.
      </footer>
    </main>
  );
}

function ProfileCard({
  displayName,
  username,
  id,
  avatar,
  banner,
  bio,
  decoration,
}: {
  displayName: string | null;
  username: string;
  id: string;
  avatar: string | null;
  banner: string | null;
  bio: string | null;
  decoration: string | null;
}) {
  const accent = useMemo(() => gradientFromId(id), [id]);

  return (
    <article
      className={styles.card}
      style={{ "--accent-from": accent.from, "--accent-to": accent.to } as React.CSSProperties}
    >
      <div className={styles.bannerWrap}>
        {banner ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={banner} alt="Profile banner" className={styles.banner} />
        ) : (
          <div className={styles.bannerFallback} />
        )}

        <div className={styles.avatarWrap}>
          <div className={styles.avatarRing}>
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt="Avatar" className={styles.avatar} />
            ) : (
              <div className={styles.avatarEmpty}>?</div>
            )}

            {decoration && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={decoration} alt="" aria-hidden className={styles.avatarDecoration} />
            )}
          </div>
        </div>
      </div>

      <div className={styles.body}>
        <div className={styles.nameplate}>
          <div className={styles.namePrimary}>
            <span className={styles.tagLabel}>Displayname</span>{displayName || username || id}</div>
          <div className={styles.namePrimary}>
            <span className={styles.tagLabel}>Username</span> {username}
          </div>
          <div className={styles.namePrimary}>
            <span className={styles.tagLabel}>UserID</span> {id}
          </div>
        </div>

        {bio && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Bio</h3>
            <p className={styles.bio}>{bio}</p>
          </div>
        )}
      </div>
    </article>
  );
}

function gradientFromId(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  const palettes = [
    { from: "#6366F1", to: "#22D3EE" },
    { from: "#F43F5E", to: "#F59E0B" },
    { from: "#10B981", to: "#3B82F6" },
    { from: "#8B5CF6", to: "#EC4899" },
    { from: "#06B6D4", to: "#22C55E" },
  ];
  return palettes[hash % palettes.length];
}
