import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import axios, { AxiosError } from "axios";
import { apiClient } from "@/utils/apiClient";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Upload, X, FileIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import PageHeader from "@/components/ui/PageHeader";
import { useNavigate } from "react-router";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  attachment: z.array(z.string()).optional(),
});
type FormData = z.infer<typeof schema>;

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
    const errorMessage =
      error.response?.data?.error ||
      error.response?.data?.message ||
      `Failed to ${data}.`;
    return errorMessage;
  }
  return "An unexpected error occurred. Please try again later.";
};

type AddNfaProps = {
  refresh: () => void;
  initialData: FormData | null;
  onClose: () => void;
};

export function AddNfa({ refresh, initialData, onClose }: AddNfaProps) {
  const isEditMode = !!initialData;
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);

  // Helper function to build image URL for display
  const buildImageUrl = (fileName: string | undefined): string => {
    if (!fileName) return "";
    const baseUrl = import.meta.env.VITE_API_URL;
    if (!baseUrl) return fileName;
    return `${baseUrl}/get_file?file=${encodeURIComponent(fileName)}`;
  };

  // Fetch phone codes

  // Prepare default values for form
  const getDefaultValues = (): Partial<FormData> => {
    if (!initialData) {
      return {
        name: "",
        description: "",
        attachment: [],
      };
    }

    return {
      name: initialData.name || "",
      description: initialData.description || "",
      attachment: initialData.attachment || [],
    };
  };

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: getDefaultValues(),
  });

  // Prefill form when initialData is available
  useEffect(() => {
    if (initialData) {
      const defaultValues = getDefaultValues();
      reset(defaultValues);

      // Set image preview if profile_picture exists
      if (initialData.attachment && initialData.attachment.length > 0) {
        setAttachments(initialData.attachment);
        setValue("attachment", initialData.attachment);
      }
    }
  }, [initialData, reset, setValue]);

  const uploadSingleFile = async (file: File): Promise<string | null> => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error(`"${file.name}" exceeds 10MB limit`);
      return null;
    }

    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    if (response.status === 200 || response.status === 201) {
      if (response.data?.files[0]?.file_name) {
        return response.data.files[0].file_name;
      }
      throw new Error("Invalid response format: Missing file name.");
    }
    throw new Error("Failed to upload file.");
  };

  const handleFilesUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setIsUploadingAttachment(true);
    setUploadingCount(fileArray.length);

    const uploaded: string[] = [];
    let successCount = 0;

    for (const file of fileArray) {
      try {
        const fileName = await uploadSingleFile(file);
        if (fileName) {
          uploaded.push(fileName);
          successCount++;
          setAttachments((prev) => {
            const next = [...prev, fileName];
            setValue("attachment", next);
            return next;
          });
        }
      } catch (error: unknown) {
        const errorMessage = getErrorMessage(error, "upload file");
        toast.error(`${file.name}: ${errorMessage}`);
      } finally {
        setUploadingCount((c) => Math.max(0, c - 1));
      }
    }

    setIsUploadingAttachment(false);
    if (successCount > 0) {
      toast.success(
        successCount === 1
          ? "File uploaded successfully!"
          : `${successCount} files uploaded successfully!`
      );
    }
  };

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFilesUpload(files);
    }
    e.target.value = ""; // Reset so same file can be selected again
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFilesUpload(files);
    }
  };

  const handleRemoveAttachment = (index: number) => {
    const newAttachments = attachments.filter((_, i) => i !== index);
    setAttachments(newAttachments);
    setValue("attachment", newAttachments);
    toast.success("File removed");
  };

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const payload: any = {
        ...data,
      };

      if (isEditMode && initialData) {
        // Update existing end client
        const endClientId = (initialData as any)?.id || 0;
        if (!endClientId) {
          toast.error("NFA ID is missing");
          setIsLoading(false);
          return;
        }
        const response = await apiClient.put(
          `/end_clients/${endClientId}`,
          payload,
        );
        if (response.status === 200 || response.status === 201) {
          toast.success("NFA updated successfully!");
          refresh();
          if (onClose) {
            onClose();
          }
          navigate("/");
        }
      } else {
        // Create new end client
        const response = await apiClient.post("/createnfa", payload);
        if (response.status === 200 || response.status === 201) {
          toast.success("NFA created successfully!");
          refresh();
          if (onClose) {
            onClose();
          }
          navigate("/");
        }
      }
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(
        error,
        isEditMode ? "update nfa" : "create nfa",
      );
      toast.error(errorMessage);
      // Refresh even on error to ensure data is up to date
      refresh();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 py-4 px-4">
      <div className="flex items-center justify-between">
        <PageHeader title={isEditMode ? "Edit NFA" : "Add NFA"} />
      </div>
      <Separator />
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {/* Name */}
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="name">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Name"
              {...register("name")}
              aria-invalid={!!errors.name}
            />
            <p className="text-sm text-red-600 min-h-[20px]">
              {errors.name?.message || "\u00A0"}
            </p>
          </div>

          {/* Organization Name */}
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="description">
              Description <span className="text-red-500">*</span>
            </Label>
            <Input
              id="description"
              placeholder="Description"
              {...register("description")}
              aria-invalid={!!errors.description}
            />
            <p className="text-sm text-red-600 min-h-[20px]">
              {errors.description?.message || "\u00A0"}
            </p>
          </div>
        </div>

        {/* Attachments Section */}
        <div className="mt-6 pt-6 border-t">
          <Label className="text-base font-semibold mb-4 block">
            Attachments <span className="text-red-500">*</span>
          </Label>
          <div className="space-y-4">
            {/* Drag & Drop Zone */}
            <label
              htmlFor="attachment-upload"
              className={cn(
                "flex flex-col items-center justify-center gap-3 min-h-[140px] rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer",
                "bg-muted/30 hover:bg-muted/50",
                isDragging && "border-primary bg-primary/5 scale-[1.01]",
                isUploadingAttachment && "opacity-60 cursor-not-allowed pointer-events-none",
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                id="attachment-upload"
                type="file"
                multiple
                className="hidden"
                onChange={handleAttachmentChange}
                disabled={isUploadingAttachment}
              />
              {isUploadingAttachment ? (
                <>
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                  <div className="text-center">
                    <p className="text-sm font-medium">Uploading files...</p>
                    {uploadingCount > 0 && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {uploadingCount} file{uploadingCount !== 1 ? "s" : ""} remaining
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div
                    className={cn(
                      "rounded-full p-3 transition-colors",
                      isDragging ? "bg-primary/20" : "bg-muted",
                    )}
                  >
                    <Upload className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div className="text-center px-4">
                    <p className="text-sm font-medium">
                      {isDragging ? "Drop files here" : "Drag & drop files here"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      or{" "}
                      <span className="text-primary font-medium underline">
                        browse
                      </span>{" "}
                      to upload
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Max 10MB per file · Hold <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">Shift</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">Ctrl</kbd> to select multiple files
                    </p>
                  </div>
                </>
              )}
            </label>

            {/* Attachments List */}
            {attachments.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {attachments.length} file{attachments.length !== 1 ? "s" : ""} added
                </p>
                <div className="grid gap-2 max-h-[200px] overflow-y-auto pr-1">
                  {attachments.map((attachment, index) => (
                    <div
                      key={`${attachment}-${index}`}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors group"
                    >
                      <div className="flex items-center justify-center w-9 h-9 rounded-md bg-muted shrink-0">
                        <FileIcon className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <span className="text-sm truncate flex-1 min-w-0">
                        {attachment.split("/").pop() || `File ${index + 1}`}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="h-8 w-8 shrink-0 opacity-70 hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => handleRemoveAttachment(index)}
                        aria-label="Remove file"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {errors.attachment && (
              <p className="text-sm text-red-600">{errors.attachment.message}</p>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-4 pt-6 border-t mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (onClose) {
                onClose();
              }
            }}
            disabled={isSubmitting || isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="min-w-[120px]"
          >
            {isSubmitting || isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditMode ? "Updating..." : "Creating..."}
              </>
            ) : isEditMode ? (
              "Update NFA"
            ) : (
              "Create NFA"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
