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
import type { FettMattis } from "@/lib/api/fettmattis-client";

const DATETIME_FORMATTER = new Intl.DateTimeFormat("nb-NO", {
  dateStyle: "medium",
  timeStyle: "short",
});

const DETAIL_DATETIME_FORMATTER = new Intl.DateTimeFormat("nb-NO", {
  dateStyle: "full",
  timeStyle: "short",
});

const EDIT_WINDOW_MS = 24 * 60 * 60 * 1000;
const FETTMATTIS_TABLE_SKELETON_KEYS = [
  "fettmattis-table-skeleton-1",
  "fettmattis-table-skeleton-2",
  "fettmattis-table-skeleton-3",
] as const;

interface FettmattisTableProps {
  readonly fettMattis: FettMattis[];
  readonly className?: string;
  readonly isLoading?: boolean;
  readonly onDelete?: (fettMattisId: string) => void | Promise<void>;
  readonly deletingIds?: ReadonlySet<string>;
  readonly emptyMessage?: string;
}

export function FettmattisTable({
  fettMattis,
  className,
  isLoading = false,
  onDelete,
  deletingIds,
  emptyMessage = "Ingen FettMattis-utdelinger registrert ennå.",
}: FettmattisTableProps) {
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  const toggle = (id: string) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const renderSkeletonRows = () => {
    return FETTMATTIS_TABLE_SKELETON_KEYS.map((key) => (
      <TableRow key={key}>
        <TableCell colSpan={3}>
          <div className="bg-muted/40 h-11 w-full animate-pulse rounded-2xl" />
        </TableCell>
      </TableRow>
    ));
  };

  const hasEntries = fettMattis.length > 0;

  return (
    <Table className={className}>
      <TableHeader>
        <TableRow>
          <TableHead>Tildelt</TableHead>
          <TableHead>Spiller</TableHead>
          <TableHead className="text-right">Handling</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? renderSkeletonRows() : null}
        {!isLoading && hasEntries
          ? fettMattis.map((entry) => {
              const createdAt = new Date(entry.created_at);
              const formattedDate = DATETIME_FORMATTER.format(createdAt);
              const detailDate = DETAIL_DATETIME_FORMATTER.format(createdAt);
              const isExpanded = expanded.has(entry.id);
              const deleting = deletingIds?.has(entry.id) ?? false;
              const canDelete = Boolean(onDelete) &&
                Date.now() - createdAt.getTime() <= EDIT_WINDOW_MS;

              return (
                <Fragment key={entry.id}>
                  <TableRow>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{formattedDate}</span>
                        <span className="text-muted-foreground text-xs">
                          {entry.player.display_name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="w-fit">{entry.player.display_name}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggle(entry.id)}
                          aria-expanded={isExpanded}
                          aria-controls={`fettmattis-details-${entry.id}`}
                        >
                          {isExpanded ? "Skjul" : "Detaljer"}
                        </Button>
                        {onDelete && canDelete ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDelete(entry.id)}
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
                      <TableCell colSpan={3}>
                        <div
                          id={`fettmattis-details-${entry.id}`}
                          className="bg-muted/30 border-border/60 text-sm rounded-3xl border px-4 py-4"
                        >
                          <div className="flex flex-col gap-3">
                            <div>
                              <p className="text-muted-foreground text-xs uppercase tracking-wide">
                                Tildelt
                              </p>
                              <p className="font-medium">{detailDate}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs uppercase tracking-wide">
                                Spillerstatus
                              </p>
                              <p className="font-medium">
                                {entry.player.active ? "Aktiv" : "Inaktiv"}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs uppercase tracking-wide">
                                Tilknyttet runde
                              </p>
                              <p className="font-medium">
                                {entry.round_id
                                  ? `Runde ${entry.round_id.slice(0, 8)}…`
                                  : "Ingen tilknyttet runde"}
                              </p>
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
        {!isLoading && !hasEntries ? (
          <TableRow>
            <TableCell colSpan={3}>
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
