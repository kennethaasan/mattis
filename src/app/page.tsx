import Link from "next/link";
import { ArrowRight, CalendarRange, Trophy, Users2, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Leaderboard } from "@/components/Leaderboard";

const highlightStats = [
  {
    label: "Registrerte runder",
    value: "1.5k+",
    description: "Registrert hvert år med presise detaljer.",
  },
  {
    label: "Fettmattis-øyeblikk",
    value: "320",
    description: "Feirede utmerkelser du kan finne igjen.",
  },
  {
    label: "Aktive spillere",
    value: "48",
    description: "I Mattis-miljøet – og tallet vokser.",
  },
];

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
    title: "Tro mot arven",
    description:
      "Inspirert av klassiske mattis.vanvikil.no, gjenoppbygget med moderne verktøy.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col">
      <section className="relative overflow-hidden">
        <div className="container relative flex flex-col items-center gap-8 pb-20 pt-24 text-center md:pt-28">
          <Badge className="rounded-full bg-primary/10 text-primary shadow-xs shadow-primary/20">
            Ny Mattis-opplevelse
          </Badge>
          <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Et vakkert hjem for hver Mattis-runde, hvert tap og hver Fettmattis-feiring.
          </h1>
          <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
            Registrer spillkveldene på sekunder, få oppdaterte tabeller og gjenopplev Fettmattis-høydepunktene i et moderne grensesnitt inspirert av den klassiske appen.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/leaderboard">
                Se live-tabellene
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/players">Administrer spillere</Link>
            </Button>
          </div>
          <div className="mt-10 grid w-full gap-4 rounded-3xl border border-border/50 bg-background/70 p-6 shadow-xl shadow-primary/10 backdrop-blur-sm md:grid-cols-3">
            {highlightStats.map((stat) => (
              <div key={stat.label} className="flex flex-col items-center gap-1">
                <span className="text-3xl font-semibold tracking-tight md:text-4xl">
                  {stat.value}
                </span>
                <span className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </span>
                <p className="max-w-xs text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute inset-x-0 top-1/2 -z-10 h-[480px] bg-linear-to-b from-primary/15 via-transparent to-transparent blur-3xl" />
      </section>

      <section className="container grid gap-6 pb-16 md:grid-cols-3">
        {featureCards.map(({ Icon, title, description }) => (
          <Card key={title} className="h-full">
            <CardHeader>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon className="h-6 w-6" />
              </div>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>

      <section className="container grid gap-6 pb-16 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl md:text-3xl">
              <Trophy className="h-6 w-6 text-primary" />
              Tabelloversikt
            </CardTitle>
            <CardDescription>
              Bytt mellom vanlig stilling og Fettmattis-utdelinger – begge oppdateres idet en runde lagres.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Leaderboard />
          </CardContent>
        </Card>
        <div className="grid gap-4">
          {workflowCards.map((card) => (
            <Card key={card.title} className="border-dashed border-border/70">
              <CardHeader>
                <CardTitle className="text-lg">{card.title}</CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
          <Card className="bg-linear-to-br from-primary/10 via-background to-background">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap className="h-5 w-5 text-primary" />
                Klar for å registrere neste runde?
              </CardTitle>
              <CardDescription>
                Gå direkte til rundeoversikten, eller besøk den klassiske siden for å hente gamle data.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row">
              <Button asChild className="flex-1">
                <Link href="/rounds">Registrer en runde</Link>
              </Button>
              <Button variant="outline" asChild className="flex-1">
                <Link href="https://mattis.vanvikil.no/" target="_blank" rel="noreferrer">
                  Klassisk tavle
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="relative overflow-hidden border-t border-border/60 bg-muted/40 py-16">
        <div className="container flex flex-col items-center gap-6 text-center">
          <Badge variant="outline" className="border-primary/40 text-primary">
            Skapt for nattlig skryt
          </Badge>
          <h2 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
            Klar for mørk modus, mobilvennlig og laget for raske seiere.
          </h2>
          <p className="max-w-xl text-base text-muted-foreground">
            Enten du logger siste runde for kvelden eller feirer en ny Fettmattis, holder dette grensesnittet tempoet oppe.
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
