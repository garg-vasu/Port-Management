import axios, { AxiosError } from "axios";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import PageHeader from "@/components/ui/PageHeader";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Upload, X, ImageIcon } from "lucide-react";
import { apiClient } from "@/utils/apiClient";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

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

// Schema - password is optional (will be validated in onSubmit)
const schema = z.object({
  email: z.string().email().min(1, "Email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, " name is required"),

  address: z.string().min(1, "Address is required"),

  employee_id: z.string().min(1, "Employee ID is required"),

  phone_no: z.string().min(10, "Phone number must be at least 10 digits"),

  profile_picture: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export interface EditTenant {
  id: number;
  email: string;
  password?: string;
  name: string;
  employee_id: string;

  address: string;

  phone_no: string;

  profile_picture?: string;
}

type TenantFormProps = {
  user?: EditTenant;
};

export default function AddTenants({ user }: TenantFormProps) {
  const navigate = useNavigate();
  const isEditMode = !!user;

  const [isLoading, setIsLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Helper function to build image URL for display
  const buildImageUrl = (fileName: string | undefined): string => {
    if (!fileName) return "";
    const baseUrl = import.meta.env.VITE_API_URL;
    if (!baseUrl) return fileName;
    console.log(
      "fileName",
      `${baseUrl}/get_file?file=${encodeURIComponent(fileName)}`,
    );
    return `${baseUrl}/get_file?file=${encodeURIComponent(fileName)}`;
  };

  const handleImageUpload = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    setIsUploadingImage(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await apiClient.post("/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === 200 || response.status === 201) {
        if (response.data?.files[0]?.file_name) {
          const imageUrlValue = response.data.files[0].file_name;
          setImageUrl(imageUrlValue);
          setValue("profile_picture", imageUrlValue);
          toast.success("Image uploaded successfully!");
        } else {
          throw new Error("Invalid response format: Missing image URL.");
        }
      } else {
        throw new Error("Failed to upload image.");
      }
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error, "upload image");
      toast.error(errorMessage);
      console.error("Image upload failed:", error);
      setImagePreview("");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleRemoveImage = () => {
    setImageUrl("");
    setImagePreview("");
    setValue("profile_picture", "");
    toast.success("Image removed");
  };

  // Prepare default values for form
  const getDefaultValues = (): Partial<FormData> => {
    if (!user) {
      return {
        email: "",
        password: "",
        name: "",
        address: "",
        employee_id: "",
        phone_no: "",
        profile_picture: "",
      };
    }

    return {
      email: user.email || "",
      password: user.password || "",
      name: user.name || "",
      address: user.address || "",
      employee_id: user.employee_id || "",
      phone_no: user.phone_no || "",
      profile_picture: user.profile_picture || "",
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

  // Prefill form when user data is available
  useEffect(() => {
    if (user) {
      const defaultValues = getDefaultValues();
      reset(defaultValues);

      // Set image preview if profile_picture exists
      if (user.profile_picture) {
        setImageUrl(user.profile_picture);
        setImagePreview(buildImageUrl(user.profile_picture));
      }
    }
  }, [user, reset, setValue]);

  const onSubmit = async (data: FormData) => {
    // Validate password for create mode
    if (!isEditMode && (!data.password || data.password.trim().length < 8)) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);
    try {
      const payload: any = {
        ...data,
        role_id: 2,
      };
      // update the payload in editmode
      if (isEditMode && user) {
        delete payload.password;
        delete payload.role_id;
      }

      // Always set client_id in edit mode (before password check)
      if (isEditMode && user?.id) {
        payload.client_id = user.id;
      } else if (isEditMode && !user?.id) {
        console.error("User ID is missing in edit mode", { user, isEditMode });
        toast.error("Unable to update: Missing tenant ID");
        setIsLoading(false);
        return;
      }

      // Remove password from payload if it's empty in edit mode
      if (isEditMode && (!data.password || data.password.trim() === "")) {
        delete payload.password;
      } else if (data.password) {
        // Ensure password meets requirements if provided
        if (data.password.trim().length < 8) {
          toast.error("Password must be at least 8 characters");
          setIsLoading(false);
          return;
        }
      }

      if (isEditMode && user) {
        // Debug: Log the payload before sending

        // Update existing tenant
        const response = await apiClient.put(
          `/user_update/${user.id}`,
          payload,
        );
        if (response.status === 200 || response.status === 201) {
          toast.success("User updated successfully!");
          navigate("/users");
        }
      } else {
        // Create new tenant
        const response = await apiClient.post("/user_create", payload);
        if (response.status === 200 || response.status === 201) {
          toast.success("User created successfully!");
          navigate("/users");
        }
      }
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(
        error,
        isEditMode ? "update user" : "create user",
      );
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 py-4 px-4">
      <div className="flex items-center justify-between">
        <PageHeader title={isEditMode ? "Edit User" : "Add User"} />
      </div>
      <Separator />
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Profile Picture Picker */}
        <div className="flex flex-col items-center gap-4 py-6 border-b">
          <Label className="text-base font-semibold">Profile Picture</Label>
          <div className="relative group">
            <div className="relative">
              <Avatar className="w-32 h-32 border-4 border-background shadow-lg ring-2 ring-ring ring-offset-2">
                {imagePreview || (imageUrl && buildImageUrl(imageUrl)) ? (
                  <AvatarImage
                    src={imagePreview || buildImageUrl(imageUrl)}
                    alt="Profile picture"
                    className="object-cover"
                  />
                ) : (
                  <AvatarFallback className="bg-muted text-muted-foreground text-2xl">
                    <ImageIcon className="w-12 h-12" />
                  </AvatarFallback>
                )}
              </Avatar>
              {isUploadingImage && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              )}
            </div>
            {(imagePreview || imageUrl) && (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 rounded-full w-8 h-8 shadow-lg"
                onClick={handleRemoveImage}
                disabled={isUploadingImage}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
          <div className="flex flex-col items-center gap-2">
            <label
              htmlFor="profile-upload"
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors",
                isUploadingImage && "opacity-50 cursor-not-allowed",
              )}
            >
              {isUploadingImage ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm font-medium">Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {imageUrl || imagePreview
                      ? "Change Picture"
                      : "Upload Picture"}
                  </span>
                </>
              )}
              <input
                id="profile-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                disabled={isUploadingImage}
              />
            </label>
            <p className="text-xs text-muted-foreground text-center max-w-xs">
              Recommended: Square image, max 5MB. JPG, PNG, or GIF.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {/* Email */}
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="email">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Email"
              {...register("email")}
              aria-invalid={!!errors.email}
            />
            <p className="text-sm text-red-600 min-h-[20px]">
              {errors.email?.message || "\u00A0"}
            </p>
          </div>

          {/* Password */}
          {!isEditMode && (
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="password">
                Password{" "}
                {!isEditMode && <span className="text-red-500">*</span>}
                {isEditMode && (
                  <span className="text-xs text-muted-foreground ml-1">
                    (leave blank to keep current)
                  </span>
                )}
              </Label>
              <Input
                id="password"
                type="password"
                placeholder={
                  isEditMode ? "Leave blank to keep current" : "Password"
                }
                {...register("password")}
                aria-invalid={!!errors.password}
              />
              <p className="text-sm text-red-600 min-h-[20px]">
                {errors.password?.message || "\u00A0"}
              </p>
            </div>
          )}

          {/* First Name */}
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="name">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Name"
              {...register("name")}
              aria-invalid={!!errors.name}
            />
            <p className="text-sm text-red-600 min-h-[20px]">
              {errors.name?.message || "\u00A0"}
            </p>
          </div>

          {/* Employee ID    */}
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="employee_id">
              Employee ID <span className="text-red-500">*</span>
            </Label>
            <Input
              id="employee_id"
              placeholder="Employee ID"
              {...register("employee_id")}
              aria-invalid={!!errors.employee_id}
            />
            <p className="text-sm text-red-600 min-h-[20px]">
              {errors.employee_id?.message || "\u00A0"}
            </p>
          </div>

          {/* Phone Number */}
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="phone_no">
              Phone Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="phone_no"
              type="tel"
              placeholder="Phone Number"
              {...register("phone_no")}
              aria-invalid={!!errors.phone_no}
            />
            <p className="text-sm text-red-600 min-h-[20px]">
              {errors.phone_no?.message || "\u00A0"}
            </p>
          </div>

          {/* Address */}
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="address">
              Address <span className="text-red-500">*</span>
            </Label>
            <Input
              id="address"
              placeholder="Address"
              {...register("address")}
              aria-invalid={!!errors.address}
            />
            <p className="text-sm text-red-600 min-h-[20px]">
              {errors.address?.message || "\u00A0"}
            </p>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-4 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/tenants")}
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
              "Update Client"
            ) : (
              "Create Client"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
