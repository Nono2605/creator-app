import { requireArtist } from "@/lib/session";
import { ComingSoon } from "@/components/ComingSoon";

export default async function WalletPage() {
  await requireArtist();

  return (
    <ComingSoon
      title="Wallet"
      description="Your balance and payout requests will live here once the payout system is built."
    />
  );
}
