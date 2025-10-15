import { ArrowRight, CalendarRange, Trophy, Users2, Zap } from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";
import { Leaderboard } from "@/components/Leaderboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getOverviewStats } from "@/lib/db-client";

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

  const { totalRounds, fettMattisMoments, activePlayers } =
    await getOverviewStats();
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
      <section className="border-border/60 bg-muted/40 border-b py-12">
        <div className="container space-y-8 pb-16">
          <div className="flex flex-col gap-2 text-left">
            <Badge
              variant="outline"
              className="border-primary/40 text-primary w-fit"
            >
              Se tapsprosent
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Hold oversikt over sesongen
            </h1>
            <p className="text-muted-foreground max-w-3xl text-sm">
              Vanlig stilling og Fettmattis-utdelinger vises side om side og
              oppdateres straks en runde registreres.
            </p>
          </div>
          <Leaderboard />
        </div>
      </section>

      <section className="relative overflow-hidden">
        <div className="relative container flex flex-col items-center gap-8 pt-24 pb-20 text-center md:pt-28">
          <Badge className="bg-primary/10 text-primary shadow-primary/20 rounded-full shadow-xs">
            Ny Mattis-opplevelse
          </Badge>
          <h2 className="text-foreground max-w-4xl text-2xl font-bold tracking-tight sm:text-5xl md:text-4xl">
            Et vakkert hjem for hver Mattis-runde, hvert tap og hver
            Fettmattis-feiring.
          </h2>
          <p className="text-muted-foreground max-w-2xl text-base sm:text-lg">
            Registrer spillkveldene på sekunder, få oppdaterte tabeller og
            gjenopplev Fettmattis-høydepunktene i et moderne grensesnitt laget
            for Mattis-gjengen.
          </p>
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
          <div className="border-border/50 bg-background/70 shadow-primary/10 mt-10 grid w-full gap-4 rounded-3xl border p-6 shadow-xl backdrop-blur-sm md:grid-cols-3">
            {highlightStats.map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col items-center gap-1"
              >
                <span className="text-3xl font-semibold tracking-tight md:text-4xl">
                  {stat.value}
                </span>
                <span className="text-muted-foreground text-sm font-medium">
                  {stat.label}
                </span>
                <p className="text-muted-foreground max-w-xs text-xs">
                  {stat.description}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="from-primary/15 absolute inset-x-0 top-1/2 -z-10 h-[480px] bg-linear-to-b via-transparent to-transparent blur-3xl" />
      </section>

      <section className="container grid gap-6 pb-16 md:grid-cols-3">
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
      </section>

      <section className="container grid gap-6 pb-16 lg:grid-cols-[1.1fr_0.9fr]">
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
              Gå direkte til rundeoversikten, eller finjuster spillerlisten før
              neste kamp.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 p-6 pt-4 pb-6 sm:flex-row">
            <Button asChild className="flex-1">
              <Link href="/rounds">Registrer en runde</Link>
            </Button>
            <Button variant="outline" asChild className="flex-1">
              <Link href="/players">Administrer spillere</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="border-border/60 bg-muted/40 relative overflow-hidden border-t py-16">
        <div className="container flex flex-col items-center gap-6 text-center">
          <Badge variant="outline" className="border-primary/40 text-primary">
            Skapt for nattlig skryt
          </Badge>
          <h2 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
            Klar for mørk modus, mobilvennlig og laget for raske seiere.
          </h2>
          <p className="text-muted-foreground max-w-xl text-base">
            Enten du logger siste runde for kvelden eller feirer en ny
            Fettmattis, holder dette grensesnittet tempoet oppe.
          </p>
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
