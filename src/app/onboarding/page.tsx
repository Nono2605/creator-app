import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { api } from "@/lib/api";
import type { Me, Artist } from "@/lib/session";
import { ApplyForm } from "./ApplyForm";
import { ArtistForm } from "./ArtistForm";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const me = await api.get<Me>("/me", { accessToken: session.access_token });

  if (me.role !== "creator" && me.role !== "admin") {
    return (
      <div style={wrapperStyle}>
        <h1 style={titleStyle}>Become a creator</h1>
        <p style={subtitleStyle}>
          Enable creator mode on your account to upload and manage music.
        </p>
        <ApplyForm />
      </div>
    );
  }

  const artist = await api.get<Artist | null>("/creator/artist", {
    accessToken: session.access_token,
  });
  if (artist) redirect("/tracks");

  return (
    <div style={wrapperStyle}>
      <h1 style={titleStyle}>Create your artist page</h1>
      <p style={subtitleStyle}>This is the public identity your tracks will be released under.</p>
      <ArtistForm />
    </div>
  );
}

const wrapperStyle: React.CSSProperties = {
  maxWidth: 400,
  margin: "var(--space-xl) auto",
  padding: "0 var(--space-md)",
};

const titleStyle: React.CSSProperties = {
  fontSize: "1.75rem",
  marginBottom: "var(--space-sm)",
};

const subtitleStyle: React.CSSProperties = {
  color: "var(--color-text-muted)",
  marginBottom: "var(--space-md)",
};
