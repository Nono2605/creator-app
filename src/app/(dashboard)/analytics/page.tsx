import { requireArtist } from "@/lib/session";
import { ComingSoon } from "@/components/ComingSoon";

export default async function AnalyticsPage() {
  await requireArtist();

  return (
    <ComingSoon
      title="Analytics"
      description="Plays, listening time, and top tracks over time will show up here once streaming is instrumented."
    />
  );
}
