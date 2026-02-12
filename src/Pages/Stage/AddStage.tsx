import axios, { AxiosError } from "axios";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { apiClient } from "@/utils/apiClient";
import { toast } from "sonner";
import PageHeader from "@/components/ui/PageHeader";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ImageIcon, Loader2, TrashIcon, Upload, X } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

export type User = {
  id: number;
  email: string;
  name: string;
  employee_id: string;
  address: string;
  password: string;
  created_at: string;
  updated_at: string;
  profile_pic: string;
  phone_no: string;
  stage_name: string;
  stage_id: number;
  role_name: string;
  role_id: number;
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

const parameterSchema = z.object({
  label: z.string().min(1, { message: "Label is required" }),
  comment: z.boolean(),
  fileUpload: z.boolean(),
  type: z.enum(["text", "number", "date"]),
});

type UserParameter = z.infer<typeof parameterSchema>;

const schema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  description: z.string().min(1, { message: "Description is required" }),
  user_id: z.number().min(1, { message: "User is required" }),
  // Question acts as the dynamic parameters array
  question: z.array(parameterSchema),
});

type SchemaType = z.infer<typeof schema>;

export interface StageView {
  id: number;
  name: string;
  user_id: number;
  description: string;
  question: UserParameter[];
  created_at: string;
  updated_at: string;
}

interface StageFormProps {
  stage?: StageView;
}

export default function StageCreationTable({ stage }: StageFormProps) {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const isEditMode = !!stage;

  // fetch users
  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.get("/allusers", {
          cancelToken: source.token,
        });

        if (response.status === 200) {
          setUsers(response.data ?? []);
        } else {
          toast.error(response.data?.message || "Failed to fetch users");
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "users data"));
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();

    return () => {
      source.cancel();
    };
  }, []);

  //   PREPARE FORM
  const getDefaultValues = (stage?: StageView) => {
    if (!stage) {
      return {
        name: "",
        description: "",
        user_id: 0,
        question: [],
      };
    }
    return {
      name: stage.name || "",
      description: stage.description || "",
      question: stage.question || [],
      user_id: stage.user_id || 0,
    };
  };

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<SchemaType>({
    resolver: zodResolver(schema),
    defaultValues: getDefaultValues(stage),
  });

  //   prefill the form with the user data
  // Prefill form when user data is available
  useEffect(() => {
    if (stage) {
      const defaultValues = getDefaultValues(stage);
      reset(defaultValues);

      // Set image preview if profile_picture exists
      //   if (user.profile_picture) {
      //     setImageUrl(user.profile_picture);
      //     setImagePreview(buildImageUrl(user.profile_picture));
      //   }
    }
  }, [stage, reset, setValue]);

  const onSubmit: SubmitHandler<SchemaType> = async (data) => {
    // Validate password for create mode

    setIsLoading(true);
    try {
      const payload: any = {
        ...data,
      };

      // Always set client_id in edit mode (before password check)
      if (isEditMode && stage?.id) {
        payload.id = stage.id;
      } else if (isEditMode && !stage?.id) {
        console.error("Stage ID is missing in edit mode", {
          stage,
          isEditMode,
        });
        toast.error("Unable to update: Missing stage ID");
        setIsLoading(false);
        return;
      }

      if (isEditMode && stage) {
        // Debug: Log the payload before sending
        console.log("Edit mode payload:", payload);

        // Update existing tenant
        const response = await apiClient.put(`/stage_update`, payload);
        if (response.status === 200 || response.status === 201) {
          toast.success("Stage updated successfully!");
          navigate("/stages");
        }
      } else {
        // Create new tenant
        const response = await apiClient.post("/stage_create", payload);
        if (response.status === 200 || response.status === 201) {
          toast.success("Stage created successfully!");
          navigate("/stages");
        }
      }
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(
        error,
        isEditMode ? "update stage" : "create stage",
      );
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const {
    fields: parameterFields,
    append: appendParameter,
    remove: removeParameter,
  } = useFieldArray({
    control,
    name: "question",
  });

  return (
    <div className="py-4 px-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <PageHeader title={isEditMode ? "Edit Stage" : "Add Stage"} />
      </div>
      <Separator />

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-6">
          {/* Top grid: user info + avatar */}
          <div className="grid grid-cols-1 md:grid-cols-3  gap-4 mt-4">
            {/* name field */}
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Enter stage name"
                {...register(`name`)}
                aria-invalid={!!errors.name}
              />
              <p className="text-sm text-red-600 min-h-[20px]">
                {errors.name?.message || "\u00A0"}
              </p>
            </div>
            {/* description  */}
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="description">
                Description <span className="text-red-500">*</span>
              </Label>
              <Input
                id="description"
                placeholder="Enter stage description"
                {...register(`description`)}
                aria-invalid={!!errors.description}
              />
              <p className="text-sm text-red-600 min-h-[20px]">
                {errors.description?.message || "\u00A0"}
              </p>
            </div>
            {/* user id selection */}
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="user_id">
                Assigned To <span className="text-red-500">*</span>
              </Label>
              <Controller
                control={control}
                name="user_id"
                render={({ field }) => (
                  <Select
                    value={field.value ? field.value.toString() : ""}
                    onValueChange={(val) => {
                      field.onChange(Number(val));
                      const selectedUser = users.find(
                        (user) => user.id === Number(val),
                      );
                      if (selectedUser) {
                        setValue("user_id", selectedUser.id);
                      }
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Store/Warehouse" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Users</SelectLabel>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
              />
              <p className="text-sm text-red-600 min-h-[18px]">
                {errors.user_id?.message || "\u00A0"}
              </p>
            </div>
          </div>

          {/* Dynamic Parameters */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <Label className="text-sm font-semibold">Parameters</Label>
                <p className="text-xs text-muted-foreground">
                  Add custom fields for this user. Each parameter must have a
                  label and a type.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  appendParameter({
                    label: "",
                    comment: false,
                    fileUpload: false,
                    type: "text",
                  })
                }
              >
                + Add parameter
              </Button>
            </div>

            {parameterFields.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No parameters added yet.
              </p>
            )}

            {parameterFields.map((field, index) => (
              <Card key={field.id} className="relative overflow-hidden">
                <CardContent className="">
                  <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:gap-4">
                    {/* Label - Grows to fill space */}
                    <div className="flex-1 space-y-1.5 min-w-[200px]">
                      <Label htmlFor={`question-${index}-label`}>
                        Label <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id={`question-${index}-label`}
                        placeholder="e.g. Due Date"
                        {...register(`question.${index}.label` as const)}
                        aria-invalid={!!errors.question?.[index]?.label}
                      />
                      <p className="text-sm text-red-600 min-h-[20px]">
                        {errors.question?.[index]?.label?.message || "\u00A0"}
                      </p>
                    </div>

                    {/* Type - Fixed width on desktop */}
                    <div className="w-full lg:w-[180px] space-y-1.5">
                      <Label htmlFor={`question-${index}-type`}>
                        Field Type
                      </Label>
                      <Controller
                        control={control}
                        name={`question.${index}.type` as const}
                        defaultValue={field.type ?? "text"}
                        render={({ field }) => (
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger className="h-9 w-full">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Text</SelectItem>
                              <SelectItem value="number">Number</SelectItem>
                              <SelectItem value="date">Date</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                      <p className="text-sm text-red-600 min-h-[20px]">
                        {(errors.question?.[index]?.type?.message as string) ||
                          "\u00A0"}
                      </p>
                    </div>

                    {/* Toggles - Horizontal layout */}
                    <div className="flex flex-wrap items-center gap-4 pt-1 lg:pt-8 w-full lg:w-auto">
                      <Controller
                        control={control}
                        name={`question.${index}.comment` as const}
                        defaultValue={field.comment ?? false}
                        render={({ field }) => (
                          <div className="flex items-center space-x-2">
                            {/* @ts-ignore - Switch checked prop specific issue with RHF sometimes */}
                            <Switch
                              id={`question-${index}-comment`}
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                            <Label
                              htmlFor={`question-${index}-comment`}
                              className="text-sm cursor-pointer"
                            >
                              Comments
                            </Label>
                          </div>
                        )}
                      />

                      <Controller
                        control={control}
                        name={`question.${index}.fileUpload` as const}
                        defaultValue={field.fileUpload ?? false}
                        render={({ field }) => (
                          <div className="flex items-center space-x-2">
                            {/* @ts-ignore */}
                            <Switch
                              id={`question-${index}-file`}
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                            <Label
                              htmlFor={`question-${index}-file`}
                              className="text-sm  cursor-pointer"
                            >
                              Upload
                            </Label>
                          </div>
                        )}
                      />
                    </div>

                    {/* Delete Button */}
                    <div className="absolute top-2 right-2 lg:relative lg:top-auto lg:right-auto lg:pt-7">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => removeParameter(index)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditMode ? "Saving..." : "Creating..."}
              </>
            ) : (
              <>{isEditMode ? "Save changes" : "Create Stage"}</>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
