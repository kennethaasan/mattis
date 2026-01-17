"use client";

import { Fragment, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import type { Fettmattis } from "@/lib/api/fettmattis-client";

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
  readonly fettmattis: Fettmattis[];
  readonly className?: string;
  readonly isLoading?: boolean;
  readonly onDelete?: (fettmattisId: string) => void | Promise<void>;
  readonly deletingIds?: ReadonlySet<string>;
  readonly emptyMessage?: string;
}

export function FettmattisTable({
  fettmattis,
  className,
  isLoading = false,
  onDelete,
  deletingIds,
  emptyMessage = "Ingen Fettmattis-utdelinger registrert ennå.",
}: FettmattisTableProps) {
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [idToDelete, setIdToDelete] = useState<string | null>(null);

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

  const hasEntries = fettmattis.length > 0;

  return (
    <Table className={className}>
      <TableHeader>
        <TableRow>
          <TableHead>Tildelt</TableHead>
          <TableHead className="hidden sm:table-cell">Spiller</TableHead>
          <TableHead className="text-left sm:text-right">Handling</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? renderSkeletonRows() : null}
        {!isLoading && hasEntries
          ? fettmattis.map((entry) => {
              const createdAt = new Date(entry.created_at);
              const formattedDate = DATETIME_FORMATTER.format(createdAt);
              const detailDate = DETAIL_DATETIME_FORMATTER.format(createdAt);
              const isExpanded = expanded.has(entry.id);
              const deleting = deletingIds?.has(entry.id) ?? false;
              const canDelete =
                Boolean(onDelete) &&
                Date.now() - createdAt.getTime() <= EDIT_WINDOW_MS;
              const editWindowDeadline = new Date(
                createdAt.getTime() + EDIT_WINDOW_MS,
              );
              const editWindowExpired =
                Date.now() > editWindowDeadline.getTime();

              return (
                <Fragment key={entry.id}>
                  <TableRow>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{formattedDate}</span>
                        <div className="flex flex-wrap items-center gap-2 sm:hidden">
                          <Badge>{entry.player.display_name}</Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge className="w-fit">
                        {entry.player.display_name}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-left sm:text-right">
                      <div className="flex flex-wrap justify-start gap-2 sm:justify-end">
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
                            onClick={() => setIdToDelete(entry.id)}
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
                                Endringsvindu
                              </p>
                              <p className="font-medium">
                                {editWindowExpired
                                  ? "Låst for endringer"
                                  : `Kan endres til ${DETAIL_DATETIME_FORMATTER.format(
                                      editWindowDeadline,
                                    )}`}
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
      <AlertDialog
        open={idToDelete !== null}
        onOpenChange={(open) => !open && setIdToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Fjerne Fettmattis?</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på at du vil fjerne denne Fettmattis-utdelingen?
              Denne handlingen kan ikke angres.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (idToDelete && onDelete) {
                  void onDelete(idToDelete);
                  setIdToDelete(null);
                }
              }}
            >
              Bekreft fjerning
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Table>
  );
}
