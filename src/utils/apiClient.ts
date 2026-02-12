import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL;

const validateTokenEndpoint = "/validate-session";

export const apiClient = axios.create({
  baseURL,
});

const clearTokensAndRedirect = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("token");
  window.location.replace("/login");
};

const validateToken = async (token: string): Promise<boolean> => {
  try {
    const response = await axios.post(`${baseURL}${validateTokenEndpoint}`, {
      SessionData: token,
    });
    return response.status === 200;
  } catch {
    return false;
  }
};

const shouldSkipValidation = (url?: string): boolean => {
  if (!url) return false;
  const path = url.split("?")[0].replace(/\/$/, "");
  return path.endsWith(validateTokenEndpoint);
};

apiClient.interceptors.request.use(
  async (config) => {
    const token =
      localStorage.getItem("accessToken") ?? localStorage.getItem("token");

    if (!token) {
      clearTokensAndRedirect();
      return Promise.reject(new Error("No token - redirecting to login"));
    }

    if (shouldSkipValidation(config.url)) {
      config.data = { ...config.data, token };
      return config;
    }

    const isValid = await validateToken(token);
    if (!isValid) {
      clearTokensAndRedirect();
      return Promise.reject(
        new Error("Token validation failed - redirecting to login"),
      );
    }

    config.headers.Authorization = token;
    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      clearTokensAndRedirect();
    }
    return Promise.reject(error);
  },
);
