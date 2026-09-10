import { requireArtist } from "@/lib/session";
import { ComingSoon } from "@/components/ComingSoon";

export default async function AudiencePage() {
  await requireArtist();

  return (
    <ComingSoon
      title="Audience"
      description="Follower growth, listener locations, and demographics will land here once listening data is being collected."
    />
  );
}
