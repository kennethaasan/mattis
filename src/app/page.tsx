import { ArrowRight, CalendarRange, Trophy, Users2, Zap } from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";
import { FettmattisTable } from "@/components/fettmattis-table";
import { Leaderboard } from "@/components/Leaderboard";
import { RoundsTable } from "@/components/rounds-table";
import { SectionHeader } from "@/components/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  toFettMattisResponse,
  toRoundResponse,
} from "@/lib/api/response-helpers";
import {
  getOverviewStats,
  listRecentFettMattis,
  listRecentRounds,
} from "@/lib/db-client";

const featureCards = [
  {
    Icon: Trophy,
    title: "To tabeller",
    description:
      "Følg tapprosent og Fettmattis-utdelinger i én samlet opplevelse.",
  },
  {
    Icon: Users2,
    title: "Enkel spillerstyring",
    description:
      "Inviter, gi nytt navn eller sett spillere som inaktive uten å miste historikken.",
  },
  {
    Icon: CalendarRange,
    title: "Sesongvis innsikt",
    description:
      "Alle tall nullstilles hvert UTC-år, samtidig som arkivet bevares.",
  },
];

const workflowCards = [
  {
    title: "Rask registrering",
    description:
      "Legg inn deltakerne, pek ut taperen, og jobben er gjort – helt uten regneark.",
  },
  {
    title: "Tilgjengelig overalt",
    description:
      "Responsivt design og mørk modus gjør tavlen pen på alle enheter.",
  },
  {
    title: "Tro mot tradisjonen",
    description:
      "Viderefører Mattis-åndens ritualer, bygget med moderne verktøy og arbeidsflyt.",
  },
];

export default async function Home() {
  await connection();

  const [overviewStats, recentRounds, recentFettMattis] = await Promise.all([
    getOverviewStats(),
    listRecentRounds({ limit: 5 }),
    listRecentFettMattis({ limit: 5 }),
  ]);

  const { totalRounds, fettMattisMoments, activePlayers } = overviewStats;
  const roundsForDisplay = recentRounds.map(toRoundResponse);
  const fettMattisForDisplay = recentFettMattis.map(toFettMattisResponse);
  const formatter = new Intl.NumberFormat("nb-NO");

  const highlightStats = [
    {
      label: "Registrerte runder",
      value: formatter.format(totalRounds),
      description: "Registrert hvert år med presise detaljer.",
    },
    {
      label: "Fettmattis-øyeblikk",
      value: formatter.format(fettMattisMoments),
      description: "Feirede utmerkelser du kan finne igjen.",
    },
    {
      label: "Aktive spillere",
      value: formatter.format(activePlayers),
      description: "I Mattis-miljøet – og tallet vokser.",
    },
  ];

  return (
    <div className="flex flex-col">
      <section className="border-border/60 bg-muted/40 border-b py-16">
        <div className="container flex flex-col gap-10">
          <SectionHeader
            badge={
              <Badge
                variant="outline"
                className="border-primary/40 text-primary"
              >
                Se tapsprosent
              </Badge>
            }
            title="Hold oversikt over sesongen"
            description="Vanlig stilling og Fettmattis-utdelinger vises side om side og oppdateres straks en runde registreres."
            titleAs="h1"
            descriptionClassName="max-w-3xl"
          />
          <Leaderboard />
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="h-full">
              <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-1">
                  <CardTitle>De siste rundene</CardTitle>
                  <CardDescription>
                    Et lite utdrag av sesongens ferskeste registreringer.
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/rounds">Se alle runder</Link>
                </Button>
              </CardHeader>
              <CardContent>
                <RoundsTable
                  rounds={roundsForDisplay}
                  emptyMessage="Ingen runder er registrert ennå."
                />
              </CardContent>
            </Card>

            <Card className="h-full">
              <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-1">
                  <CardTitle>Ferske Fettmattiser</CardTitle>
                  <CardDescription>
                    Hedringene som ble delt ut nylig.
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/rounds">Se tildelinger</Link>
                </Button>
              </CardHeader>
              <CardContent>
                <FettmattisTable fettMattis={fettMattisForDisplay} />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden py-16 md:py-24">
        <div className="relative container flex flex-col items-center gap-8 text-center">
          <SectionHeader
            badge={
              <Badge className="bg-primary/10 text-primary shadow-primary/20 rounded-full shadow-xs">
                Ny Mattis-opplevelse
              </Badge>
            }
            title="Et vakkert hjem for hver Mattis-runde, hvert tap og hver Fettmattis-feiring."
            description="Registrer spillkveldene på sekunder, få oppdaterte tabeller og gjenopplev Fettmattis-høydepunktene i et moderne grensesnitt laget for Mattis-gjengen."
            align="center"
            descriptionClassName="max-w-2xl sm:text-lg"
          />
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/leaderboard">
                Utforsk tabellene
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/players">Administrer spillere</Link>
            </Button>
          </div>
          <div className="mt-10 grid w-full gap-4 md:grid-cols-3">
            {highlightStats.map((stat) => (
              <StatHighlight key={stat.label} {...stat} />
            ))}
          </div>
        </div>
        <div className="from-primary/15 absolute inset-x-0 top-1/2 -z-10 h-[480px] bg-linear-to-b via-transparent to-transparent blur-3xl" />
      </section>

      <section className="py-16">
        <div className="container grid gap-6 md:grid-cols-3">
          {featureCards.map(({ Icon, title, description }) => (
            <Card key={title} className="h-full">
              <CardHeader className="pb-6">
                <div className="bg-primary/10 text-primary flex h-12 w-12 items-center justify-center rounded-2xl">
                  <Icon className="h-6 w-6" />
                </div>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="py-16">
        <div className="container grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="grid gap-4">
            {workflowCards.map((card) => (
              <Card key={card.title} className="border-border/70 border-dashed">
                <CardHeader className="pb-6">
                  <CardTitle className="text-lg">{card.title}</CardTitle>
                  <CardDescription>{card.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
          <Card className="from-primary/10 via-background to-background bg-linear-to-br">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap className="text-primary h-5 w-5" />
                Klar for å registrere neste runde?
              </CardTitle>
              <CardDescription>
                Gå direkte til rundeoversikten, eller finjuster spillerlisten
                før neste kamp.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 p-6 pt-4 pb-6 sm:flex-row sm:items-center">
              <Button asChild className="w-full sm:flex-1">
                <Link href="/rounds">Registrer en runde</Link>
              </Button>
              <Button variant="outline" asChild className="w-full sm:flex-1">
                <Link href="/players">Administrer spillere</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="border-border/60 bg-muted/40 relative overflow-hidden border-t py-16">
        <div className="container flex flex-col items-center gap-6 text-center">
          <SectionHeader
            badge={
              <Badge
                variant="outline"
                className="border-primary/40 text-primary"
              >
                Skapt for nattlig skryt
              </Badge>
            }
            title="Klar for mørk modus, mobilvennlig og laget for raske seiere."
            description="Enten du logger siste runde for kvelden eller feirer en ny Fettmattis, holder dette grensesnittet tempoet oppe."
            align="center"
            descriptionClassName="max-w-xl"
          />
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button variant="secondary" asChild>
              <Link href="/players">Inviter gjengen</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/leaderboard">
                Utforsk tabellene
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

interface StatHighlightProps {
  readonly label: string;
  readonly value: string;
  readonly description: string;
}

function StatHighlight({ label, value, description }: StatHighlightProps) {
  return (
    <Card className="border-border/60 bg-background/90 shadow-primary/10 flex h-full flex-col justify-between rounded-3xl border shadow-xl">
      <CardHeader className="items-center gap-1 pb-2 text-center sm:pb-4">
        <CardTitle className="text-3xl font-semibold tracking-tight md:text-4xl">
          {value}
        </CardTitle>
        <CardDescription className="text-muted-foreground text-sm font-medium">
          {label}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-muted-foreground text-center text-xs sm:text-sm">
        {description}
      </CardContent>
    </Card>
  );
}
