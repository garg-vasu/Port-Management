import { apiClient } from "@/utils/apiClient";
import { formatDisplayDate } from "@/utils/formatdate";
import axios, { AxiosError } from "axios";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Separator } from "@/components/ui/separator";
import PageHeader from "@/components/ui/PageHeader";

import {
  ArrowLeft,
  FileText,
  Link2,
  CheckCircle2,
  Clock,
  Loader2,
  CircleDot,
  Circle,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type NfaDetail = {
  nfa: Nfa;
  progress_percent: number;
  pipeline: Pipeline[];
};

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

const isNfaCompleted = (status: string) => {
  const s = (status ?? "").toLowerCase().replace(/\s+/g, "_");
  return s === "completed" || s === "complete";
};

/** Returns tailwind classes for the stage circle + label based on status */
const getStageCircleStyles = (status: string, isCurrent: boolean) => {
  if (isStageCompleted(status))
    return {
      ring: "border-emerald-500",
      bg: "bg-emerald-500",
      icon: "text-white",
      label: "text-emerald-700 dark:text-emerald-300 font-medium",
      line: "border-emerald-500",
    };
  if (isCurrent)
    return {
      ring: "border-amber-500 ring-4 ring-amber-400/20",
      bg: "bg-amber-500",
      icon: "text-white",
      label: "text-amber-700 dark:text-amber-300 font-semibold",
      line: "border-amber-400",
    };
  return {
    ring: "border-muted-foreground/30",
    bg: "bg-muted",
    icon: "text-muted-foreground",
    label: "text-muted-foreground",
    line: "border-muted-foreground/20",
  };
};

/* ------------------------------------------------------------------ */
/*  Pipeline Row Sub-component                                         */
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
            {/* Circle + details column */}
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

              {/* Stage status label */}
              {/* Stage status label + Date */}
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

                {/* Date Display */}
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

            {/* Dotted connector line */}
            {!isLast && (
              <div className="flex items-center self-[20px] sm:self-[22px] mt-4 sm:mt-[18px] shrink-0 w-full max-w-[60px] sm:max-w-none flex-1">
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
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export function NfaDetailPage() {
  const { nfa_id } = useParams<{ nfa_id: string }>();
  const navigate = useNavigate();
  const [nfa, setNfa] = useState<Nfa | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pipeline, setPipeline] = useState<Pipeline[]>([]);
  const [progressPercent, setProgressPercent] = useState(0);

  useEffect(() => {
    if (!nfa_id) return;
    const source = axios.CancelToken.source();

    const fetchNfaDetail = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.get(`/get_nfa/${nfa_id}`, {
          cancelToken: source.token,
        });
        if (response.status === 200) {
          setNfa(response.data.nfa ?? null);
          setPipeline(response.data.pipeline ?? []);
          setProgressPercent(response.data.progress_percent ?? 0);
        } else {
          toast.error(response.data?.message || "Failed to fetch NFA detail");
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "NFA detail"));
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchNfaDetail();
    return () => source.cancel();
  }, [nfa_id]);

  /* Split pipeline into 2 rows */
  const midpoint = Math.ceil(pipeline.length / 2);
  const row1 = pipeline.slice(0, midpoint);
  const row2 = pipeline.slice(midpoint);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] w-full gap-3">
        <Loader2 className="h-9 w-9 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          Loading Consignment details...
        </p>
      </div>
    );
  }

  if (!nfa) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] w-full gap-4 p-6">
        <p className="text-sm text-muted-foreground">Consignment not found</p>
        <Button variant="outline" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Button>
      </div>
    );
  }

  const nfaDone = isNfaCompleted(nfa.status);

  return (
    <div className="w-full p-4">
      {/* ── Page heading ──────────────────────────────────────────── */}
      <div className="  flex items-center gap-3">
        {/* <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => navigate("/")}
          className="shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button> */}
        <PageHeader title={`Consignment Code : ${nfa.nfa_code}`} />
      </div>

      <div className=" space-y-3 mt-2">
        {/* ── Section 1 : Basic Details (compact) ────────────────── */}
        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
              {/* Left: info */}
              <div className="flex-1 min-w-0 space-y-3">
                {/* Name + Status */}
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base sm:text-lg font-semibold truncate">
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

                {/* Current stage ID – prominent when not completed */}
                {!nfaDone && nfa.current_stage_id && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">
                      Active Stage
                    </span>
                    <span className="inline-flex items-center justify-center rounded-md bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 text-lg font-bold px-3 py-0.5 tabular-nums">
                      #{nfa.current_stage_id}
                    </span>
                    {/* <Button
                      size="sm"
                      onClick={() =>
                        navigate(
                          `/working-nfa/${nfa_id}/${nfa.current_stage_id}`,
                        )
                      }
                    >
                      Work on stage
                    </Button> */}
                  </div>
                )}

                {/* Description */}
                {nfa.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                    {nfa.description}
                  </p>
                )}

                {/* File links */}
                {nfa.files && nfa.files.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    {nfa.files.map((file, i) => {
                      const href = buildFileUrl(file);
                      const label = getFileName(file) || `File ${i + 1}`;
                      return (
                        <a
                          key={`${file}-${i}`}
                          href={href}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded border px-2 py-1 text-xs hover:bg-accent hover:text-accent-foreground transition-colors max-w-[160px] truncate"
                        >
                          <Link2 className="h-3 w-3 shrink-0" />
                          <span className="truncate">{label}</span>
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right: progress bar (narrow column) */}
              <div className="lg:w-48 xl:w-56 shrink-0">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground text-xs uppercase tracking-wider">
                    Progress
                  </span>
                  <span className="font-bold tabular-nums text-base">
                    {progressPercent}%
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getProgressBarColor(progressPercent)}`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
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

        {/* ── Section 2 : Pipeline (~70% space) ──────────────────── */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <h3 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wider">
              Pipeline Stages
            </h3>

            {pipeline.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No pipeline data available.
              </p>
            ) : (
              <div className="space-y-6">
                {/* Row 1 */}
                <PipelineRow stages={row1} />

                {row2.length > 0 && (
                  <>
                    <Separator />
                    {/* Row 2 */}
                    <PipelineRow stages={row2} />
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
