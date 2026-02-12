import { Loader2 } from "lucide-react";
import { type PropsWithChildren, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { apiClient } from "@/utils/apiClient";

const clearTokensAndRedirect = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("token");
};

export default function PrivateRoute({ children }: PropsWithChildren) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const location = useLocation();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token =
        localStorage.getItem("accessToken") ?? localStorage.getItem("token");

      if (!token) {
        clearTokensAndRedirect();
        navigate("/login", { replace: true });
        return;
      }

      try {
        const response = await apiClient.post("/validate-session", {
          SessionData: token,
        });
        setUserRole(response.data?.role_name ?? null);
        setIsLoading(false);
      } catch (error) {
        console.error("Session validation failed:", error);
        clearTokensAndRedirect();
        navigate("/login", { replace: true });
      }
    };

    checkAuth();
  }, [navigate]);

  useEffect(() => {
    if (
      !isLoading &&
      location.pathname === "/tenant" &&
      userRole !== "superadmin"
    ) {
      navigate("/", { replace: true });
    }
  }, [isLoading, location.pathname, userRole, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-full h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
