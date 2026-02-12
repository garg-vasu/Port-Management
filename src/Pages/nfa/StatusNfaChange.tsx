import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiClient } from "@/utils/apiClient";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Separator } from "@/components/ui/separator";
import { FileText, Link2, CheckCircle2 } from "lucide-react";
import type { PendingNfaDetail, Question } from "./ApprovalPending";
import { useNavigate } from "react-router-dom";

const nfaParameterAnswerSchema = z.object({
  label: z.string(),
  type: z.enum(["text", "number", "date"]),
  value: z.string().min(1, "Required"),
  commentValue: z.string().optional(),
  fileName: z.string().optional(),
  question_id: z.number(),
});

const statusNfaChangeSchema = z.object({
  nfa_id: z.number(),
  parameters: z.array(nfaParameterAnswerSchema),
});

type StatusNfaChangeForm = z.infer<typeof statusNfaChangeSchema>;

type StatusNfaChangeProps = {
  nfa: PendingNfaDetail;
  Questions: Question[];
};

export function StatusNfaChange({ nfa, Questions }: StatusNfaChangeProps) {
  const navigate = useNavigate();
  const buildFileUrl = (file?: string) => {
    if (!file) return "";
    if (file.startsWith("http://") || file.startsWith("https://")) {
      return file;
    }
    const baseUrl = import.meta.env.VITE_API_URL;
    if (!baseUrl) return file;
    return `${baseUrl}/get_file?file=${encodeURIComponent(file)}`;
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

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<StatusNfaChangeForm>({
    resolver: zodResolver(statusNfaChangeSchema),
    defaultValues: {
      nfa_id: nfa.id,
      parameters: Questions.map((p) => ({
        question_id: p.id,
        label: p.label,
        type: p.type,
        value: "",
        commentValue: "",
        fileName: "",
      })),
    },
  });

  const onSubmit = async (data: StatusNfaChangeForm) => {
    try {
      const res = await apiClient.post(`/nfa/${nfa.id}/complete`, data);
      if (res.status === 200 || res.status === 201) {
        toast.success("NFA status updated successfully");
        navigate("/");
      }
    } catch (err) {
      console.error("API error on status change:", err);
      toast.error("Failed to update NFA status");
      navigate("/");
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 ">
      <div className="flex items-center justify-between">
        <PageHeader title="Status NFA Change" />
      </div>

      <div className=" overflow-hidden">
        {/* Compact NFA header */}
        <div className=" pb-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-semibold truncate">{nfa.name}</h2>
                <StatusBadge status={nfa.status} />
              </div>
              {nfa.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {nfa.description}
                </p>
              )}
              <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-muted-foreground">
                <span>ID: {nfa.id}</span>
                <span>Code: {nfa.nfa_code}</span>
                <span className="font-medium text-foreground">
                  {nfa.current_stage_name}
                </span>
              </div>
            </div>
            {nfa.files && nfa.files.length > 0 && (
              <div className="shrink-0">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  Attachments
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {nfa.files.map((file, index) => {
                    const href = buildFileUrl(file);
                    const label = getFileName(file) || `File ${index + 1}`;
                    return (
                      <a
                        key={`${file}-${index}`}
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded border px-2 py-1 text-[11px] hover:bg-accent hover:text-accent-foreground transition-colors max-w-[140px] truncate"
                      >
                        <Link2 className="h-3 w-3 shrink-0" />
                        <span className="truncate">{label}</span>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <Separator className="mt-4" />

        {/* Parameters – stacked form (mobile-friendly, no overflow) */}
        <div className="mt-4">
          <div className="mb-3">
            <h3 className="text-sm font-semibold">Parameters</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Enter required values and optional comments or documents.
            </p>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit, (errors) => {
              console.error("Form validation failed:", errors);
            })}
            className="space-y-0"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              {Questions.map((param, index) => (
                <div key={param.id} className="space-y-3 min-w-0">
                  <div>
                    <Label className="text-sm font-medium">
                      {param.label}
                      <span className="text-destructive ml-0.5">*</span>
                    </Label>
                    <Input
                      type={
                        param.type === "number"
                          ? "number"
                          : param.type === "date"
                            ? "date"
                            : "text"
                      }
                      placeholder={`Enter ${param.label.toLowerCase()}`}
                      {...register(`parameters.${index}.value` as const)}
                    />
                    {errors.parameters?.[index]?.value?.message && (
                      <p className="text-xs text-destructive mt-1">
                        {errors.parameters[index].value?.message}
                      </p>
                    )}
                  </div>

                  {param.comment === true && (
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Comment
                      </Label>
                      <Input
                        type="text"
                        placeholder="Optional note..."
                        {...register(
                          `parameters.${index}.commentValue` as const,
                        )}
                      />
                    </div>
                  )}

                  {param.fileUpload === true && (
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Attach file
                      </Label>
                      <Controller
                        control={control}
                        name={`parameters.${index}.fileName` as const}
                        render={({ field }) => (
                          <div className="mt-1 space-y-1.5">
                            <Input
                              type="file"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const formData = new FormData();
                                formData.append("file", file);
                                const res = await apiClient.post(
                                  "/upload",
                                  formData,
                                  {
                                    headers: {
                                      "Content-Type": "multipart/form-data",
                                    },
                                  },
                                );
                                field.onChange(
                                  res.data?.files?.[0]?.file_name ?? "",
                                );
                              }}
                            />
                            {field.value && (
                              <a
                                href={buildFileUrl(field.value)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline break-all max-w-full"
                              >
                                <Link2 className="h-3.5 w-3.5 shrink-0" />
                                <span className="break-all">
                                  {getFileName(field.value) || "View file"}
                                </span>
                              </a>
                            )}
                          </div>
                        )}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            <div className="flex justify-end">
              <Button type="submit" size="sm" className="gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                Save status change
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
