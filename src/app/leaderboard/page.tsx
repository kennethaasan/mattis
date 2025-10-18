import { Leaderboard } from "@/components/Leaderboard";
import { PageShell } from "@/components/layout/page-shell";
import { SectionHeader } from "@/components/section-header";
import { Badge } from "@/components/ui/badge";

export default function LeaderboardPage() {
  return (
    <PageShell className="gap-10">
      <SectionHeader
        badge={
          <Badge variant="outline" className="border-primary/40 text-primary">
            Se tapsprosent
          </Badge>
        }
        title="Tabeller"
        description="Tallene oppdateres automatisk når en ny runde registreres."
        titleAs="h1"
        descriptionClassName="max-w-2xl"
      />
      <Leaderboard />
    </PageShell>
  );
}
