import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { StatusNfaChange } from "./StatusNfaChange";
import { toast } from "sonner";
import axios, { AxiosError } from "axios";
import { apiClient } from "@/utils/apiClient";
import { Loader2 } from "lucide-react";

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

export type PendingNfaDetail = {
  current_stage_id: number;
  current_stage_name: string;
  description: string;
  files: string[];
  id: number;
  name: string;
  nfa_code: string;
  status: string;
  Questions: Question[];
};

export type Question = {
  id: number;
  label: string;
  comment: boolean;
  fileUpload: boolean;
  type: "text" | "number" | "date";
};

export function ApprovalPending() {
  const { nfa_id, stage_id } = useParams<{
    nfa_id: string;
    stage_id: string;
  }>();
  const [pendingNfa, setPendingNfa] = useState<PendingNfaDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    if (!nfa_id) {
      toast.error("NFA ID is required");
      setIsLoading(false);
      return;
    }
    const source = axios.CancelToken.source();

    const fetchNfaDetail = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.get(`/get_nfa/${nfa_id}`, {
          cancelToken: source.token,
        });

        if (response.status === 200) {
          setPendingNfa(response.data.nfa ?? null);
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

    return () => {
      source.cancel();
    };
  }, []);

  useEffect(() => {
    if (!nfa_id || !stage_id) {
      toast.error("NFA ID and stage ID are required");
      setIsLoading(false);
      return;
    }
    const source = axios.CancelToken.source();

    const fetchStageQuestions = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.get(`/stage_questions/${stage_id}`, {
          cancelToken: source.token,
        });

        if (response.status === 200) {
          setQuestions(response.data.questions ?? []);
        } else {
          toast.error(
            response.data?.message || "Failed to fetch stage questions",
          );
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "stage questions"));
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchStageQuestions();

    return () => {
      source.cancel();
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading user data...</p>
        </div>
      </div>
    );
  }

  if (!pendingNfa) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-sm text-muted-foreground">NFA not found</p>
      </div>
    );
  }
  if (!questions) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-sm text-muted-foreground">Questions not found</p>
      </div>
    );
  }

  return <StatusNfaChange nfa={pendingNfa} Questions={questions} />;
}
