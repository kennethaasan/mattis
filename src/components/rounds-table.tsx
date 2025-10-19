"use client";

import { Fragment, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Round } from "@/lib/api/schemas";
import { cn } from "@/lib/utils";

const DATETIME_FORMATTER = new Intl.DateTimeFormat("nb-NO", {
  dateStyle: "medium",
  timeStyle: "short",
});

const DETAIL_DATETIME_FORMATTER = new Intl.DateTimeFormat("nb-NO", {
  dateStyle: "full",
  timeStyle: "short",
});

const EDIT_WINDOW_MS = 24 * 60 * 60 * 1000;
const ROUND_TABLE_SKELETON_KEYS = [
  "round-table-skeleton-1",
  "round-table-skeleton-2",
  "round-table-skeleton-3",
  "round-table-skeleton-4",
] as const;

interface RoundsTableProps {
  readonly rounds: Round[];
  readonly className?: string;
  readonly isLoading?: boolean;
  readonly onDeleteRound?: (roundId: string) => void | Promise<void>;
  readonly deletingRoundIds?: ReadonlySet<string>;
  readonly emptyMessage?: string;
}

export function RoundsTable({
  rounds,
  className,
  isLoading = false,
  onDeleteRound,
  deletingRoundIds,
  emptyMessage = "Ingen runder registrert ennå.",
}: RoundsTableProps) {
  const [expandedRounds, setExpandedRounds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  const toggleRound = (roundId: string) => {
    setExpandedRounds((current) => {
      const next = new Set(current);
      if (next.has(roundId)) {
        next.delete(roundId);
      } else {
        next.add(roundId);
      }
      return next;
    });
  };

  const renderSkeletonRows = () => {
    return ROUND_TABLE_SKELETON_KEYS.map((key) => (
      <TableRow key={key}>
        <TableCell colSpan={4}>
          <div className="bg-muted/40 h-12 w-full animate-pulse rounded-2xl" />
        </TableCell>
      </TableRow>
    ));
  };

  const hasRounds = rounds.length > 0;

  return (
    <Table className={className}>
      <TableHeader>
        <TableRow>
          <TableHead>Registrert</TableHead>
          <TableHead>Mattis</TableHead>
          <TableHead className="hidden text-right sm:table-cell">
            Deltakere
          </TableHead>
          <TableHead className="text-right">Handling</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? renderSkeletonRows() : null}
        {!isLoading && hasRounds
          ? rounds.map((round) => {
              const createdAt = new Date(round.created_at);
              const formattedDate = DATETIME_FORMATTER.format(createdAt);
              const detailDate = DETAIL_DATETIME_FORMATTER.format(createdAt);
              const isExpanded = expandedRounds.has(round.id);
              const participantCount = round.participants.length;
              const deleting = deletingRoundIds?.has(round.id) ?? false;
              const canDelete = Boolean(onDeleteRound) &&
                Date.now() - createdAt.getTime() <= EDIT_WINDOW_MS;

              return (
                <Fragment key={round.id}>
                  <TableRow>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{formattedDate}</span>
                        <span className="text-muted-foreground text-xs sm:hidden">
                          {participantCount} deltakere
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{round.loser.display_name}</span>
                    </TableCell>
                    <TableCell className="hidden text-right sm:table-cell">
                      {participantCount}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleRound(round.id)}
                          aria-expanded={isExpanded}
                          aria-controls={`round-details-${round.id}`}
                        >
                          {isExpanded ? "Skjul" : "Detaljer"}
                        </Button>
                        {onDeleteRound && canDelete ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDeleteRound(round.id)}
                            disabled={deleting}
                          >
                            {deleting ? "Sletter…" : "Slett"}
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                  {isExpanded ? (
                    <TableRow>
                      <TableCell colSpan={4}>
                        <div
                          id={`round-details-${round.id}`}
                          className="bg-muted/30 border-border/60 text-sm rounded-3xl border px-4 py-4"
                        >
                          <div className="flex flex-col gap-3">
                            <div>
                              <p className="text-muted-foreground text-xs uppercase tracking-wide">
                                Registrert
                              </p>
                              <p className="font-medium">{detailDate}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs uppercase tracking-wide">
                                Taper
                              </p>
                              <Badge variant="danger" className="w-fit">
                                {round.loser.display_name}
                              </Badge>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs uppercase tracking-wide">
                                Deltakere
                              </p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {round.participants.map((participant) => {
                                  const isLoser =
                                    participant.id === round.loser.id;
                                  return (
                                    <Badge
                                      key={participant.id}
                                      variant={isLoser ? "danger" : "outline"}
                                      className={cn(
                                        "text-xs",
                                        isLoser ? "font-semibold" : undefined,
                                      )}
                                    >
                                      {participant.display_name}
                                    </Badge>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : null}
                </Fragment>
              );
            })
          : null}
        {!isLoading && !hasRounds ? (
          <TableRow>
            <TableCell colSpan={4}>
              <div className="text-muted-foreground flex justify-center py-6 text-sm">
                {emptyMessage}
              </div>
            </TableCell>
          </TableRow>
        ) : null}
      </TableBody>
    </Table>
  );
}
