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
    label: "Rounds captured",
    value: "1.5k+",
    description: "Recorded annually with precision and context.",
  },
  {
    label: "Fettmattis moments",
    value: "320",
    description: "Celebrated recognitions tracked and revisitable.",
  },
  {
    label: "Active players",
    value: "48",
    description: "Across the Mattis community and growing.",
  },
];

const featureCards = [
  {
    Icon: Trophy,
    title: "Dual leaderboards",
    description:
      "Track competitive loss ratios alongside the iconic Fettmattis awards in one cohesive experience.",
  },
  {
    Icon: Users2,
    title: "Effortless player management",
    description:
      "Invite, rename or deactivate players with confidence knowing that history stays intact.",
  },
  {
    Icon: CalendarRange,
    title: "Season-aware insights",
    description:
      "Every stat resets cleanly every UTC year with archives preserved for nostalgia and audits.",
  },
];

const workflowCards = [
  {
    title: "Fast recording",
    description:
      "Drop in the round participants, tap the loser and you're done – no spreadsheets required.",
  },
  {
    title: "Accessible everywhere",
    description:
      "Responsive layouts and dark mode support mean the scoreboard looks great on any device.",
  },
  {
    title: "Legacy friendly",
    description:
      "Inspired by the classic mattis.vanvikil.no experience, rebuilt with modern tooling.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col">
      <section className="relative overflow-hidden">
        <div className="container relative flex flex-col items-center gap-8 pb-20 pt-24 text-center md:pt-28">
          <Badge className="rounded-full bg-primary/10 text-primary shadow-sm shadow-primary/20">
            New Mattis experience
          </Badge>
          <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            A beautiful home for every Mattis round, loss and Fettmattis celebration.
          </h1>
          <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
            Capture game nights in seconds, surface rich leaderboards and relive Fettmattis highlights with a modern interface inspired by the beloved legacy app.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/leaderboard">
                View live leaderboards
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/players">Manage players</Link>
            </Button>
          </div>
          <div className="mt-10 grid w-full gap-4 rounded-3xl border border-border/50 bg-background/70 p-6 shadow-xl shadow-primary/10 backdrop-blur md:grid-cols-3">
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
        <div className="absolute inset-x-0 top-1/2 -z-10 h-[480px] bg-gradient-to-b from-primary/15 via-transparent to-transparent blur-3xl" />
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

      <section className="container grid gap-6 pb-16 lg:grid-cols-[1.2fr,0.8fr]">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl md:text-3xl">
              <Trophy className="h-6 w-6 text-primary" />
              Leaderboards at a glance
            </CardTitle>
            <CardDescription>
              Toggle between regular standings and Fettmattis accolades – both update the moment a round is submitted.
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
          <Card className="bg-gradient-to-br from-primary/10 via-background to-background">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap className="h-5 w-5 text-primary" />
                Ready to capture your next session?
              </CardTitle>
              <CardDescription>
                Head straight to the rounds dashboard or revisit the legacy site if you need to export archived data.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row">
              <Button asChild className="flex-1">
                <Link href="/rounds">Record a round</Link>
              </Button>
              <Button variant="outline" asChild className="flex-1">
                <Link href="https://mattis.vanvikil.no/" target="_blank" rel="noreferrer">
                  Legacy scoreboard
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="relative overflow-hidden border-t border-border/60 bg-muted/40 py-16">
        <div className="container flex flex-col items-center gap-6 text-center">
          <Badge variant="outline" className="border-primary/40 text-primary">
            Built for late-night bragging rights
          </Badge>
          <h2 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
            Dark-mode ready, mobile-friendly and tuned for quick victories.
          </h2>
          <p className="max-w-xl text-base text-muted-foreground">
            Whether you are logging the last game of the evening or celebrating another Fettmattis, this interface keeps the flow moving fast.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button variant="secondary" asChild>
              <Link href="/players">Invite the crew</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/leaderboard">
                Explore the standings
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
