import { formatDisplayDate, formatDateTime } from "@/utils/formatdate";
import axios, { AxiosError } from "axios";

const baseURL = import.meta.env.VITE_API_URL;
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Separator } from "@/components/ui/separator";

import {
  Search,
  FileText,
  Link2,
  CheckCircle2,
  Clock,
  Loader2,
  CircleDot,
  Circle,
  PackageSearch,
  AlertCircle,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type Nfa = {
  id: number;
  nfa_code: string;
  name: string;
  description: string;
  files: string[];
  status: string;
  current_stage_id: number;
  current_stage_name: string;
};

export type Pipeline = {
  stage_id: number;
  stage_name: string;
  status: string;
  is_current: boolean;
  created_at?: string;
  completed_at?: string;
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const getErrorMessage = (error: AxiosError | unknown, data: string): string => {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401) return "Unauthorized. Please log in.";
    if (error.response?.status === 403)
      return "Access denied. Please contact your administrator.";
    if (error.code === "ECONNABORTED")
      return "Request timed out. Please try again later.";
    return error.response?.data?.message || `Failed to fetch ${data}.`;
  }
  return "An unexpected error occurred. Please try again later.";
};

const buildFileUrl = (file?: string) => {
  if (!file) return "";
  if (file.startsWith("http://") || file.startsWith("https://")) return file;
  const baseUrl = import.meta.env.VITE_API_URL;
  return baseUrl
    ? `${baseUrl}/get_file?file=${encodeURIComponent(file)}`
    : file;
};

const getFileName = (file?: string) => {
  if (!file) return "";
  try {
    const url = new URL(file);
    return url.pathname.split("/").filter(Boolean).pop() ?? file;
  } catch {
    return file.split("/").filter(Boolean).pop() ?? file;
  }
};

const getProgressBarColor = (percent: number) => {
  if (percent >= 67) return "bg-emerald-500";
  if (percent >= 34) return "bg-amber-500";
  return "bg-rose-500";
};

const isStageCompleted = (status: string) => {
  const s = (status ?? "").toLowerCase().replace(/\s+/g, "_");
  return s === "completed" || s === "complete";
};

const getStageCircleStyles = (status: string, isCurrent: boolean) => {
  if (isStageCompleted(status))
    return {
      ring: "border-emerald-500",
      bg: "bg-emerald-500",
      icon: "text-white",
      label: "text-emerald-700 dark:text-emerald-300 font-medium",
    };
  if (isCurrent)
    return {
      ring: "border-amber-500 ring-4 ring-amber-400/20",
      bg: "bg-amber-500",
      icon: "text-white",
      label: "text-amber-700 dark:text-amber-300 font-semibold",
    };
  return {
    ring: "border-muted-foreground/30",
    bg: "bg-muted",
    icon: "text-muted-foreground",
    label: "text-muted-foreground",
  };
};

/* ------------------------------------------------------------------ */
/*  Pipeline Row                                                       */
/* ------------------------------------------------------------------ */

function PipelineRow({ stages }: { stages: Pipeline[] }) {
  return (
    <div className="flex items-start w-full">
      {stages.map((stage, idx) => {
        const styles = getStageCircleStyles(stage.status, stage.is_current);
        const completed = isStageCompleted(stage.status);
        const isLast = idx === stages.length - 1;

        return (
          <div key={stage.stage_id} className="flex items-start flex-1 min-w-0">
            <div className="flex flex-col items-center min-w-0 w-full">
              {/* Circle */}
              <div
                className={`shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 flex items-center justify-center ${styles.ring} ${styles.bg}`}
              >
                {completed ? (
                  <CheckCircle2 className={`w-5 h-5 ${styles.icon}`} />
                ) : stage.is_current ? (
                  <CircleDot className={`w-5 h-5 ${styles.icon}`} />
                ) : (
                  <Circle className={`w-4 h-4 ${styles.icon}`} />
                )}
              </div>

              {/* Stage name */}
              <p
                className={`text-xs sm:text-sm mt-1.5 text-center truncate w-full px-1 ${styles.label}`}
                title={stage.stage_name}
              >
                {stage.stage_name}
              </p>

              {/* Status + date */}
              <div className="flex flex-col items-center mt-0.5 space-y-0.5">
                <span
                  className={`text-[10px] font-medium leading-tight ${
                    completed
                      ? "text-emerald-600 dark:text-emerald-400"
                      : stage.is_current
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-muted-foreground/60"
                  }`}
                >
                  {completed
                    ? "Completed"
                    : stage.is_current
                      ? "In Progress"
                      : "Pending"}
                </span>

                {completed && stage.completed_at && (
                  <span className="text-[10px] text-muted-foreground/80 leading-tight">
                    {formatDisplayDate(stage.completed_at)}
                  </span>
                )}
                {stage.is_current && stage.created_at && (
                  <span className="text-[10px] text-muted-foreground/80 leading-tight">
                    Started: {formatDisplayDate(stage.created_at)}
                  </span>
                )}
              </div>
            </div>

            {/* Connector line */}
            {!isLast && (
              <div className="flex items-center mt-4 sm:mt-[18px] shrink-0 w-full max-w-[60px] sm:max-w-none flex-1">
                <div
                  className={`w-full border-t-2 border-dashed ${
                    completed && isStageCompleted(stages[idx + 1]?.status ?? "")
                      ? "border-emerald-500"
                      : completed
                        ? "border-emerald-400/60"
                        : "border-muted-foreground/20"
                  }`}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Search Page                                                        */
/* ------------------------------------------------------------------ */

type SearchState = "idle" | "loading" | "found" | "not_found" | "error";

export function NfaSearchPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [searchState, setSearchState] = useState<SearchState>("idle");
  const [searchedCode, setSearchedCode] = useState("");
  const [nfa, setNfa] = useState<Nfa | null>(null);
  const [pipeline, setPipeline] = useState<Pipeline[]>([]);
  const [progressPercent, setProgressPercent] = useState(0);

  const handleSearch = async () => {
    const code = inputRef.current?.value.trim() ?? "";
    if (!code) {
      toast.error("Please enter a consignment code.");
      inputRef.current?.focus();
      return;
    }

    setSearchedCode(code);
    setSearchState("loading");
    setNfa(null);
    setPipeline([]);
    setProgressPercent(0);

    try {
      const response = await axios.post(`${baseURL}/nfaprogress`, {
        nfa_code: code,
      });

      if (response.status === 200 && response.data?.nfa) {
        setNfa(response.data.nfa);
        setPipeline(response.data.pipeline ?? []);
        setProgressPercent(response.data.progress_percent ?? 0);
        setSearchState("found");
      } else {
        setSearchState("not_found");
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        setSearchState("not_found");
      } else {
        toast.error(getErrorMessage(err, "consignment detail"));
        setSearchState("error");
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleReset = () => {
    setSearchState("idle");
    setSearchedCode("");
    setNfa(null);
    setPipeline([]);
    setProgressPercent(0);
    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.focus();
    }
  };

  /* Split pipeline into 2 rows */
  const midpoint = Math.ceil(pipeline.length / 2);
  const row1 = pipeline.slice(0, midpoint);
  const row2 = pipeline.slice(midpoint);

  return (
    <div className="h-dvh w-full overflow-y-auto bg-background">
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="w-full space-y-1 text-center">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Track Your Consignment
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your consignment code below to view its current status and
          progress.
        </p>
      </div>

      {/* ── Search Bar ────────────────────────────────────────────── */}
      <Card className="mt-6 w-full">
        <CardContent className="p-4 sm:p-6">
          <Label htmlFor="nfa-code" className="mb-2 block text-sm font-medium">
            Consignment Code
          </Label>
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              id="nfa-code"
              placeholder="e.g.#NZRJ8IF260213001"
              onKeyDown={handleKeyDown}
              disabled={searchState === "loading"}
            />
            <Button
              onClick={handleSearch}
              disabled={searchState === "loading"}
              className="shrink-0"
            >
              {searchState === "loading" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">
                {searchState === "loading" ? "Searching…" : "Apply"}
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Results Area ──────────────────────────────────────────── */}
      <div className="mt-6 w-full">
        {/* Idle — show nothing or a gentle prompt */}
        {searchState === "idle" && (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 p-10">
              <PackageSearch className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground text-center">
                Your consignment details will appear here once you search.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Loading */}
        {searchState === "loading" && (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 p-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Searching for{" "}
                <span className="font-medium text-foreground">
                  {searchedCode}
                </span>
                …
              </p>
            </CardContent>
          </Card>
        )}

        {/* Not Found */}
        {searchState === "not_found" && (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 p-10">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <div className="space-y-1 text-center">
                <p className="text-sm font-medium">No consignment found</p>
                <p className="text-sm text-muted-foreground">
                  We couldn't find any consignment matching{" "}
                  <span className="font-medium text-foreground">
                    {searchedCode}
                  </span>
                  . Please double-check the code and try again.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleReset}>
                Search again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Error */}
        {searchState === "error" && (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 p-10">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <div className="space-y-1 text-center">
                <p className="text-sm font-medium">Something went wrong</p>
                <p className="text-sm text-muted-foreground">
                  An error occurred while fetching the consignment. Please try
                  again later.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleReset}>
                Try again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Found — Detail View */}
        {searchState === "found" && nfa && (
          <div className="space-y-3">
            {/* Basic Details */}
            <Card>
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
                  {/* Left: info */}
                  <div className="min-w-0 flex-1 space-y-3">
                    {/* Name + Status */}
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-base font-semibold sm:text-lg">
                        {nfa.name}
                      </h2>
                      <StatusBadge status={nfa.status} />
                    </div>

                    {/* Meta row */}
                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
                      <span>
                        Code:{" "}
                        <span className="font-medium text-foreground">
                          {nfa.nfa_code}
                        </span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        Stage:{" "}
                        <span className="font-medium text-foreground">
                          {nfa.current_stage_name}
                        </span>
                      </span>
                    </div>

                    {/* Description */}
                    {nfa.description && (
                      <p className="text-sm leading-relaxed text-muted-foreground line-clamp-3">
                        {nfa.description}
                      </p>
                    )}

                    {/* File links */}
                    {nfa.files && nfa.files.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        {nfa.files.map((file, i) => {
                          const href = buildFileUrl(file);
                          const label = getFileName(file) || `File ${i + 1}`;
                          return (
                            <a
                              key={`${file}-${i}`}
                              href={href}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex max-w-[160px] items-center gap-1.5 truncate rounded border px-2 py-1 text-xs transition-colors hover:bg-accent hover:text-accent-foreground"
                            >
                              <Link2 className="h-3 w-3 shrink-0" />
                              <span className="truncate">{label}</span>
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Right: progress bar */}
                  <div className="shrink-0 lg:w-48 xl:w-56">
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-xs uppercase tracking-wider text-muted-foreground">
                        Progress
                      </span>
                      <span className="text-base font-bold tabular-nums">
                        {progressPercent}%
                      </span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${getProgressBarColor(progressPercent)}`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {progressPercent < 34
                        ? "Just getting started"
                        : progressPercent < 67
                          ? "Making progress"
                          : progressPercent < 100
                            ? "Almost there"
                            : "All done"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pipeline */}
            {pipeline.length > 0 && (
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Pipeline Stages
                  </h3>
                  <div className="space-y-6">
                    <PipelineRow stages={row1} />
                    {row2.length > 0 && (
                      <>
                        <Separator />
                        <PipelineRow stages={row2} />
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Last updated + Search again */}
            <div className="flex flex-col items-center gap-2 pt-2">
              {(() => {
                const lastCompleted = [...pipeline]
                  .filter(
                    (s) => isStageCompleted(s.status) && s.completed_at,
                  )
                  .sort(
                    (a, b) =>
                      new Date(b.completed_at!).getTime() -
                      new Date(a.completed_at!).getTime(),
                  )[0];

                return lastCompleted?.completed_at ? (
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    Last updated: {formatDateTime(lastCompleted.completed_at)}
                  </p>
                ) : null;
              })()}
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <Search className="h-4 w-4" />
                Search another consignment
              </Button>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
