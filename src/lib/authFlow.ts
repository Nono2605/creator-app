// Parcours d'inscription et de connexion du Studio : les décisions, sans réseau (testées avec
// `npm test`). Le compte est le MÊME que celui de l'app d'écoute (même projet Supabase).

// Où renvoyer la personne après le lien d'un courriel Supabase : un chemin de CE site, jamais une
// adresse extérieure. Les caractères de contrôle sont refusés : le navigateur retire une tabulation
// ou un retour à la ligne d'une adresse, ce qui ferait de « /\t/autre.site » un « //autre.site ».
export function safeNext(value: string | null | undefined, fallback = "/"): string {
  if (typeof value !== "string" || value.length > 200) return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  if (/[\u0000-\u001f\u007f]/.test(value)) return fallback;
  return value;
}

interface AuthErrorLike {
  code?: string;
  message?: string;
  status?: number;
}

// Supabase refuse l'inscription d'une adresse déjà connue (quand la confirmation par courriel est
// désactivée). Avec la confirmation active, il répond au contraire « ok » sans rien dire : le
// message de l'écran couvre alors les deux cas.
export function isExistingAccountError(error: AuthErrorLike): boolean {
  return (
    error.code === "user_already_exists" ||
    error.code === "email_exists" ||
    /already (been )?registered/i.test(error.message ?? "")
  );
}

// Les messages de Supabase sont techniques (« Invalid login credentials ») : on dit ce que la personne
// peut faire, en rappelant que le compte est celui de l'app d'écoute.
export function friendlyLoginError(error: AuthErrorLike): string {
  const message = (error.message ?? "").trim();
  if (error.code === "invalid_credentials" || /invalid login credentials/i.test(message)) {
    return "Email or password is incorrect. The Studio uses the same Vynl account as the listening app.";
  }
  if (error.code === "email_not_confirmed" || /email not confirmed/i.test(message)) {
    return "Confirm your email first: open the link we sent you, then log in.";
  }
  if (error.status === 429 || error.code === "over_request_rate_limit") {
    return "Too many attempts. Wait a minute and try again.";
  }
  return message || "Could not log in. Please try again.";
}
