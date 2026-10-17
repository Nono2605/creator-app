import { LoginForm } from "./LoginForm";

// Page serveur : elle lit `?notice=` (posé par /auth/callback) et le passe au formulaire.
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const { notice } = await searchParams;
  return (
    <LoginForm notice={notice === "confirmed" ? "If you confirmed your email, log in below to continue." : null} />
  );
}
