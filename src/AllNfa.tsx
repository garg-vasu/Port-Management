import {
  Card,
  CardTitle,
  CardHeader,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import PageHeader from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";

import { Link } from "react-router-dom";

export type NFA = {
  id: number;
  status: "Pending" | "Completed" | "Cancelled";
  created_at: string;
  updated_at: string;
  name: string;
  description: string;
  files: string[];
  // user id
  pending_on: number;
  // pending user details
  pending_name: string;
  pending_phone: string;
  pending_email: string;
  pending_profile_pic: string;
  progress: number;
};

type StatusFilter = "All" | "Pending" | "Completed" | "Cancelled";

export function AllNfa() {
  const [nfas] = useState<NFA[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");

  const filteredNfas = useMemo(() => {
    if (statusFilter === "All") return nfas;
    return nfas.filter((nfa) => nfa.status === statusFilter);
  }, [nfas, statusFilter]);

  return (
    <div className="w-full p-4 flex flex-col gap-2">
      {/* header section */}
      <div className="flex items-center justify-between">
        <PageHeader title="All NFA" />
      </div>

      {/* list section */}
      <div className="mt-4 space-y-3">
        {/* status filter */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-xs sm:text-sm font-medium text-muted-foreground">
            Showing{" "}
            <span className="font-semibold text-foreground">
              {filteredNfas.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-foreground">{nfas.length}</span>{" "}
            NFA(s)
          </span>

          <div className="inline-flex flex-wrap gap-1.5">
            {(
              ["All", "Pending", "Completed", "Cancelled"] as StatusFilter[]
            ).map((status) => (
              <Button
                key={status}
                type="button"
                size="sm"
                variant={statusFilter === status ? "default" : "outline"}
                className="h-7 px-2 text-[11px] sm:text-xs"
                onClick={() => setStatusFilter(status)}
              >
                {status}
              </Button>
            ))}
          </div>
        </div>

        {filteredNfas.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredNfas.map((nfa) => (
              <NfaCard key={nfa.id} nfa={nfa} />
            ))}
          </div>
        ) : (
          <Card className="mt-2 border-dashed text-center">
            <CardHeader>
              <CardTitle className="text-base">No NFA found</CardTitle>
              <CardDescription>
                Once NFAs are created, they will appear here.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </div>
  );
}

function NfaCard({ nfa }: { nfa: NFA }) {
  const statusStyles =
    nfa.status === "Completed"
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
      : nfa.status === "Cancelled"
        ? "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200"
        : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200";

  const cardAccent =
    nfa.status === "Completed"
      ? "border-emerald-400 dark:border-emerald-500"
      : nfa.status === "Cancelled"
        ? "border-rose-400 dark:border-rose-500"
        : "border-amber-400 dark:border-amber-500";

  const progress = Math.min(Math.max(nfa.progress ?? 0, 0), 100);

  return (
    <Card
      className={cn(
        "h-full flex flex-col gap-3 border-l-4 text-[11px] sm:text-xs",
        cardAccent,
      )}
    >
      <CardHeader className="px-3 py-2 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 space-y-1">
            <CardTitle className="truncate text-base font-semibold">
              {nfa.name}
            </CardTitle>
            {nfa.description && (
              <CardDescription className="line-clamp-2 text-xs">
                {nfa.description}
              </CardDescription>
            )}
          </div>
          <Badge
            variant="outline"
            className={`shrink-0 text-[10px] px-2 py-0.5 font-semibold uppercase tracking-wide border-0 ${statusStyles}`}
          >
            {nfa.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="px-3 pt-0 pb-2 space-y-2 text-xs">
        <div className="grid grid-cols-1 gap-3">
          <div className="space-y-1">
            <p className="text-[11px] font-medium text-muted-foreground">
              Pending on
            </p>
            <p className="font-medium truncate">{nfa.pending_name}</p>
            <p className="flex flex-col gap-0.5 text-[11px] text-muted-foreground">
              <span className="truncate">{nfa.pending_email}</span>
              <span className="truncate">{nfa.pending_phone}</span>
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-[11px] font-medium text-muted-foreground">
              Progress
            </p>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">Overall</span>
              <span className="font-semibold">{progress}%</span>
            </div>
            <div className="mt-1 h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {nfa.files && nfa.files.length > 0 && (
          <div className="space-y-1">
            <p className="text-[11px] font-medium text-muted-foreground">
              Files
            </p>
            <p className="text-[11px] text-muted-foreground">
              {nfa.files.length} file(s) attached
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="border-t px-3 pt-2 pb-2 flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
        <div className="flex flex-col">
          <span>
            Created: <span className="font-medium">{nfa.created_at}</span>
          </span>
          <span>
            Updated: <span className="font-medium">{nfa.updated_at}</span>
          </span>
        </div>

        {nfa.status === "Pending" && (
          <Button
            asChild
            size="xs"
            variant="outline"
            className="shrink-0 whitespace-nowrap"
          >
            <Link to={`/working-nfa/${nfa.id}/${nfa.pending_on}`}>
              Work on NFA
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
