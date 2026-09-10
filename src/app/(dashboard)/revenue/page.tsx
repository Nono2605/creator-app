import { requireArtist } from "@/lib/session";
import { ComingSoon } from "@/components/ComingSoon";

export default async function RevenuePage() {
  await requireArtist();

  return (
    <ComingSoon
      title="Revenue"
      description="How your streams turn into earnings — royalty periods, allocations, and payout history — is coming once the royalties system ships."
    />
  );
}
