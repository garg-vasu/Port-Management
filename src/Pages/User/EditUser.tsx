import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios, { AxiosError } from "axios";
import { apiClient } from "@/utils/apiClient";
import { toast } from "sonner";

import { Loader2 } from "lucide-react";
import UserCreationtable from "./UserCreationtable";

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

export type User = {
  id: number;
  email: string;
  name: string;
  employee_id: string;
  address: string;
  password: string;
  created_at: string;
  updated_at: string;
  profile_picture: string;
  phone_no: string;
  stage_name: string;
  stage_id: number;
  role_name: string;
  role_id: number;
};

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

export default function EditUser() {
  const { user_id } = useParams<{ user_id: string }>();
  const [data, setData] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch tenant data
  useEffect(() => {
    if (!user_id) {
      toast.error("User ID is required");
      setIsLoading(false);
      return;
    }

    const source = axios.CancelToken.source();

    const fetchTenantData = async () => {
      try {
        const response = await apiClient.get(`/user/${user_id}`, {
          cancelToken: source.token,
        });

        if (response.status === 200) {
          console.log("API Response:", response.data);
          setData(response.data);
        } else {
          toast.error(response.data?.message || "Failed to fetch user data");
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "user data"));
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchTenantData();

    return () => {
      source.cancel();
    };
  }, [user_id]);

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

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-sm text-muted-foreground">User not found</p>
      </div>
    );
  }

  // Transform API response to EditTenant format
  // Use client_id as the id (since that's what we send in the payload)
  const userId = data.id || Number(user_id);

  const editUserData: EditTenant = {
    id: Number(userId),
    email: data.email || "",
    password: data.password || "",
    name: data.name || "",
    employee_id: data.employee_id || "",
    address: data.address || "",
    phone_no: data.phone_no || "",
    profile_picture: data.profile_picture || "",
  };

  // Debug: Log the transformed data
  console.log("EditUserData data:", editUserData);

  return <UserCreationtable user={editUserData} />;
}
