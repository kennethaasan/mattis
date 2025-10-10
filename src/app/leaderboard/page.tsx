import { Leaderboard } from "@/components/Leaderboard";
import { Badge } from "@/components/ui/badge";

export default function LeaderboardPage() {
  return (
    <div className="container space-y-8 pt-12 pb-16">
      <div className="flex flex-col gap-2 text-left">
        <Badge
          variant="outline"
          className="border-primary/40 text-primary w-fit"
        >
          Se tapsprosent
        </Badge>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Tabeller
        </h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          Tallene oppdateres automatisk når en ny runde registreres.
        </p>
      </div>
      <Leaderboard />
    </div>
  );
}
