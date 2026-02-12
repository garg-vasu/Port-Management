import PageHeader from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import axios, { AxiosError } from "axios";
import { GripVertical, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { toast } from "sonner";
import { apiClient } from "@/utils/apiClient";
import { cn } from "@/lib/utils";

export type StageQuestion = {
  label: string;
  comment: boolean;
  fileUpload: boolean;
  type: "file" | "text" | "number" | "date";
};

export type Stage = {
  id: number;
  name: string;
  description: string;
  user_id: number;
  question: StageQuestion[];
  order: number;
  user_name: string;
};

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

const buildAvatarSrc = (profilePicture?: string) => {
  if (!profilePicture) return "";
  const baseUrl = import.meta.env.VITE_API_URL;
  if (!baseUrl) return profilePicture;
  return `${baseUrl}/get-file?file=${encodeURIComponent(profilePicture)}`;
};

const getInitials = (name?: string) => {
  if (!name) return "U";
  const [first, second] = name.trim().split(" ");
  const initials =
    `${first?.[0] ?? ""}${second?.[0] ?? ""}` || first?.[0] || "U";
  return initials.toUpperCase();
};

export function OrderSelection() {
  const [users, setUsers] = useState<Stage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const navigate = useNavigate();

  //   useEffect(() => {
  //     const source = axios.CancelToken.source();

  //     const fetchUsers = async () => {
  //       setIsLoading(true);
  //       try {
  //         const response = await apiClient.get("/users", {
  //           cancelToken: source.token,
  //         });

  //         if (response.status === 200) {
  //           const apiUsers: User[] = response.data?.data ?? [];
  //           setUsers(apiUsers);
  //         } else {
  //           toast.error(response.data?.message || "Failed to fetch users");
  //           setUsers(demoUsers);
  //         }
  //       } catch (err: unknown) {
  //         if (!axios.isCancel(err)) {
  //           toast.error(getErrorMessage(err, "users data"));
  //           // fall back to demo data so the UI remains usable
  //           setUsers(demoUsers);
  //         }
  //       } finally {
  //         setIsLoading(false);
  //       }
  //     };

  //     fetchUsers();

  //     return () => {
  //       source.cancel();
  //     };
  //   }, []);

  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchStages = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.get("/get_stage_order", {
          cancelToken: source.token,
        });

        if (response.status === 200) {
          setUsers(response.data ?? []);
        } else {
          toast.error(response.data?.message || "Failed to fetch stages");
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "stages data"));
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchStages();

    return () => {
      source.cancel();
    };
  }, []);

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const term = search.toLowerCase();
    return users.filter((user) => {
      const name = user.name?.toLowerCase() ?? "";
      const description = user.description?.toLowerCase() ?? "";
      return name.includes(term) || description.includes(term);
    });
  }, [search, users]);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (
    event: React.DragEvent<HTMLDivElement>,
    index: number,
  ) => {
    event.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    setUsers((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(draggedIndex, 1);
      updated.splice(index, 0, moved);
      return updated;
    });
    setDraggedIndex(index);
  };

  const handleDrop = () => {
    setDraggedIndex(null);
  };

  const handleSaveOrder = async () => {
    if (!users.length) return;

    setIsSaving(true);
    try {
      const payload = {
        order: users.map((user, index) => ({
          stage_id: user.id,
          order: index + 1,
        })),
      };

      const response = await apiClient.put("/update_stage_order", payload);

      if (response.status === 200 || response.status === 201) {
        toast.success(
          response.data?.message || "User order saved successfully.",
        );
      } else {
        toast.error(response.data?.message || "Failed to save user order.");
      }
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "user order"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full p-4 space-y-4">
      {/* header section */}
      <div className="flex items-center justify-between gap-3">
        <PageHeader title="Order Selection" />
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
            disabled={isLoading || isSaving}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSaveOrder}
            disabled={isSaving || isLoading || users.length === 0}
          >
            {isSaving && (
              <Loader2
                className="mr-2 h-4 w-4 animate-spin"
                aria-hidden="true"
              />
            )}
            Save order
          </Button>
        </div>
      </div>

      <Card className="p-3 sm:p-4 space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs sm:text-sm text-muted-foreground">
            Drag and drop stages to define their order.{" "}
            <span className="font-medium text-foreground">
              Total stages: {users.length}
            </span>
          </div>
          <Input
            placeholder="Search by Stage name"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-8 max-w-xs text-xs sm:text-sm"
          />
        </div>

        <div className="max-h-[420px] overflow-auto rounded-md border">
          {isLoading && users.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-xs sm:text-sm text-muted-foreground">
              <Loader2
                className="mr-2 h-4 w-4 animate-spin"
                aria-hidden="true"
              />
              Loading stages...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-xs sm:text-sm text-muted-foreground">
              No stages found.
            </div>
          ) : (
            filteredUsers.map((user, index) => (
              <div
                key={user.id}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-xs sm:text-sm border-b last:border-b-0 bg-background",
                  draggedIndex === index
                    ? "bg-muted/80"
                    : "hover:bg-muted/60 cursor-grab",
                )}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(event) => handleDragOver(event, index)}
                onDrop={handleDrop}
                onDragEnd={handleDrop}
              >
                <div className="flex items-center justify-center">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                </div>

                <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium capitalize">
                        {user.name}
                      </span>
                      {user.description && (
                        <Badge
                          variant="outline"
                          className="hidden sm:inline-flex max-w-[120px] truncate"
                        >
                          {user.user_name}
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-1 text-[11px] sm:text-xs text-muted-foreground">
                      <span className="truncate max-w-[160px] sm:max-w-[220px]">
                        {user.description || "—"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Badge
                      variant="outline"
                      className="text-[10px] sm:text-xs px-2 py-0.5"
                    >
                      #{users.findIndex((u) => u.id === user.id) + 1}
                    </Badge>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
