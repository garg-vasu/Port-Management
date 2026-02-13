import { apiClient } from "@/utils/apiClient";
import axios, { AxiosError } from "axios";
import { Activity, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// active ->> total_nfa
// under custom ->> completed_nfa
// pending document ->> in_progress_nfa

interface NfaDetail {
  total_nfa: number;
  completed_nfa: number;
  in_progress_nfa: number;
}

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ElementType;
  accentClass: string;
}

function StatCard({ label, value, icon: Icon, accentClass }: StatCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 shadow-sm transition-shadow hover:shadow-md">
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${accentClass}`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-muted-foreground">
          {label}
        </p>
        <p className="text-lg font-semibold leading-tight tracking-tight">
          {value}
        </p>
      </div>
    </div>
  );
}

const getErrorMessage = (error: AxiosError | unknown, data: string): string => {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401) {
      return "Unauthorized. Please log in.";
    }
    if (error.response?.status === 403) {
      return "Access denied. Please contact your administrator.";
    }
    if (error.code === "ECONNABORTED") {
      return "Request timed out. Please try again later.";
    }
    return error.response?.data?.message || `Failed to fetch ${data}.`;
  }
  return "An unexpected error occurred. Please try again later.";
};

export function CountingNfa() {
  const [loading, setLoading] = useState<boolean>(false);
  const [nfaDetail, setNfaDetail] = useState<NfaDetail | null>(null);

  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchNfaDetail = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get("/nfa/stats", {
          cancelToken: source.token,
        });

        if (response.status === 200) {
          setNfaDetail(response.data ?? null);
        } else {
          toast.error(
            response.data?.message || "Failed to fetch completed NFA",
          );
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "completed NFA data"));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchNfaDetail();

    return () => {
      source.cancel();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading stats…</p>
        </div>
      </div>
    );
  }

  if (!nfaDetail) {
    return (
      <div className="flex items-center justify-center py-6">
        <p className="text-sm text-muted-foreground">
          Stats not available
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <StatCard
        label="Active"
        value={nfaDetail.total_nfa}
        icon={Activity}
        accentClass="bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400"
      />
      <StatCard
        label="Under Custom"
        value={nfaDetail.completed_nfa}
        icon={CheckCircle2}
        accentClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400"
      />
      <StatCard
        label="Pending Document"
        value={nfaDetail.in_progress_nfa}
        icon={Clock}
        accentClass="bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400"
      />
    </div>
  );
}
