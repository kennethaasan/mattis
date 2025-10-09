import { Leaderboard } from "@/components/Leaderboard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LeaderboardPage() {
  return (
    <div className="container space-y-10 pb-16 pt-12">
      <div className="flex flex-col gap-2 text-left">
        <Badge variant="outline" className="w-fit border-primary/40 text-primary">
          Se tapsprosent
        </Badge>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Tabeller
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Tallene oppdateres automatisk når en ny runde registreres.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Sesongtall</CardTitle>
        </CardHeader>
        <CardContent>
          <Leaderboard />
        </CardContent>
      </Card>
    </div>
  );
}
