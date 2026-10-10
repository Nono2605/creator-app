import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { api } from "@/lib/api";
import type { Me, Artist } from "@/lib/session";
import { Logo } from "@/components/Logo";
import { ApplyForm } from "./ApplyForm";
import { ArtistForm } from "./ArtistForm";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  let me: Me;
  try {
    me = await api.get<Me>("/me", { accessToken: session.access_token });
  } catch (err) {
    return <ErrorNotice message={err instanceof Error ? err.message : "Could not load your account."} />;
  }

  if (me.role !== "creator" && me.role !== "admin") {
    return (
      <div className="bg-signature" style={wrapperStyle}>
        <div style={logoStyle}>
          <Logo />
        </div>
        <h1 style={titleStyle}>Become a creator</h1>
        <p style={subtitleStyle}>
          Enable creator mode on your account to upload and manage music.
        </p>
        <ApplyForm />
      </div>
    );
  }

  let artist: Artist | null;
  try {
    artist = await api.get<Artist | null>("/creator/artist", {
      accessToken: session.access_token,
    });
  } catch (err) {
    return (
      <ErrorNotice message={err instanceof Error ? err.message : "Could not load your artist profile."} />
    );
  }
  if (artist) redirect("/tracks");

  return (
    <div className="bg-signature" style={wrapperStyle}>
      <div style={logoStyle}>
        <Logo />
      </div>
      <h1 style={titleStyle}>Create your artist page</h1>
      <p style={subtitleStyle}>This is the public identity your tracks will be released under.</p>
      <ArtistForm />
    </div>
  );
}

function ErrorNotice({ message }: { message: string }) {
  return (
    <div className="bg-signature" style={wrapperStyle}>
      <div style={logoStyle}>
        <Logo />
      </div>
      <h1 style={titleStyle}>Something went wrong</h1>
      <p style={{ color: "var(--vynl-erreur)" }}>{message}</p>
    </div>
  );
}

const wrapperStyle: React.CSSProperties = {
  maxWidth: 400,
  margin: "var(--space-xl) auto",
  padding: "0 var(--space-md)",
};

const logoStyle: React.CSSProperties = {
  marginBottom: "var(--space-lg)",
};

// Titres d'impact (texte fixe, jamais saisi par l'utilisateur) : Dela Gothic One.
const titleStyle: React.CSSProperties = {
  fontFamily: "var(--vynl-police-marque)",
  fontWeight: 400,
  fontSize: "2rem",
  lineHeight: 1.2,
  marginBottom: "var(--space-sm)",
};

const subtitleStyle: React.CSSProperties = {
  color: "var(--vynl-texte-2)",
  marginBottom: "var(--space-md)",
};
