import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import axios, { AxiosError } from "axios";
import { apiClient } from "@/utils/apiClient";
import { toast } from "sonner";

import { PendingNfaCard, type PendingNfa } from "./PendingNfaCard";



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

export function PendingCardList() {
  const [data, setData] = useState<PendingNfa[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchPendingNfa = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.get("/nfa/pending", {
          cancelToken: source.token,
        });

        if (response.status === 200) {
          setData(response.data ?? []);
        } else {
          toast.error(response.data?.message || "Failed to fetch pending NFA");
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "pending NFA"));
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchPendingNfa();

    return () => {
      source.cancel();
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="text-muted-foreground">Loading...</span>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        No pending NFA found.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((nfa) => (
        <PendingNfaCard key={nfa.id} nfa={nfa} />
      ))}
    </div>
  );
}
