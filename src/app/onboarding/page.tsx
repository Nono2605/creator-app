import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { api } from "@/lib/api";
import type { Me, Artist } from "@/lib/session";
import { Logo } from "@/components/Logo";
import { OnboardingSteps } from "@/components/OnboardingSteps";
import { loadGenres } from "@/lib/genres";
import { logout } from "@/app/actions/auth";
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
    const genres = await loadGenres();
    return (
      <div className="bg-signature" style={wrapperStyle}>
        <div style={logoStyle}>
          <Logo />
        </div>
        <OnboardingSteps current="terms" />
        <h1 style={titleStyle}>Become a creator</h1>
        {/* Le compte existe déjà : c'est celui de l'écoute. On le dit, avec de quoi changer de compte. */}
        <p style={subtitleStyle}>
          You&apos;re signed in as <strong style={{ color: "var(--vynl-texte)" }}>{me.email}</strong>. This is your Vynl
          account, the same one you use to listen. Enabling creator mode adds the Studio to it; your library, playlists
          and follows stay as they are.
        </p>
        <ApplyForm genres={genres} />
        <SwitchAccount />
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
      <OnboardingSteps current="artist" />
      <h1 style={titleStyle}>Create your artist page</h1>
      <p style={subtitleStyle}>
        This is the public identity your tracks will be released under.
        {me.profile && (
          <>
            {" "}
            It is separate from your listening profile (<strong style={{ color: "var(--vynl-texte)" }}>{me.profile.username}</strong>
            ), which listeners keep seeing as before.
          </>
        )}
      </p>
      <ArtistForm />
      <SwitchAccount />
    </div>
  );
}

// « Ce n'est pas mon compte » : se déconnecter pour entrer avec un autre compte Vynl.
function SwitchAccount() {
  return (
    <form action={logout} style={{ marginTop: "var(--space-md)" }}>
      <button type="submit" className="btn-plain" style={{ color: "var(--vynl-texte-2)", fontSize: "0.875rem" }}>
        Not your account? Log out
      </button>
    </form>
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
