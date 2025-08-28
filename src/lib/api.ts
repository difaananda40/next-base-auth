// Base configuration
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// Types for API responses
export interface ApiResponse<T = unknown> {
  data?: T;
  message?: string;
  error?: string;
  status: number;
}

// Backend validation error structure
export interface ValidationError {
  success: boolean;
  message: string;
  errors: {
    formErrors: string[];
    fieldErrors: Record<string, string[]>;
  };
}

export interface RequestConfig extends RequestInit {
  timeout?: number;
  headers?: Record<string, string>;
}

// Custom error class for API errors
export class ApiError extends Error {
  status: number;
  response?: Response;
  validationErrors?: ValidationError["errors"];

  constructor(
    message: string,
    status: number,
    response?: Response,
    validationErrors?: ValidationError["errors"],
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.response = response;
    this.validationErrors = validationErrors;
  }
}

// Default configuration
const DEFAULT_CONFIG: RequestConfig = {
  headers: {
    "Content-Type": "application/json",
  },
  credentials: "include", // Include cookies for httpOnly cookie support
  timeout: 10000, // 10 seconds
};

// Helper function to handle timeout
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error("Request timeout")), timeoutMs);
    }),
  ]);
}

async function getServerCookies() {
  if (typeof window !== "undefined") return "";
  // Dynamic import next/headers only on server-side
  return import("next/headers").then(async ({ cookies }) => {
    try {
      const cookieStore = await cookies();
      return cookieStore.toString();
    } catch (error) {
      console.error("Failed to access cookies:", error);
      return "";
    }
  });
}

// Main fetch wrapper function
async function apiRequest<T = unknown>(
  endpoint: string,
  config: RequestConfig = {},
): Promise<ApiResponse<T>> {
  // Merge default config with provided config
  const { timeout = DEFAULT_CONFIG.timeout, ...fetchConfig } = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  // Merge headers
  const headers = {
    ...DEFAULT_CONFIG.headers,
    ...config.headers,
    cookie: await getServerCookies(),
  };

  // Construct full URL
  const url = endpoint.startsWith("http") ? endpoint : `${BASE_URL}${endpoint}`;

  try {
    // Make the request with timeout
    const response = await withTimeout(
      fetch(url, {
        ...fetchConfig,
        headers,
        credentials: fetchConfig.credentials || DEFAULT_CONFIG.credentials,
      }),
      timeout!,
    );

    // Parse response
    let responseData;
    const contentType = response.headers.get("content-type");

    if (contentType?.includes("application/json")) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    // Handle non-200 status codes
    if (!response.ok) {
      const errorMessage =
        responseData?.message ||
        responseData?.error ||
        `HTTP ${response.status}`;

      // Check if it's a validation error with fieldErrors
      const validationErrors = responseData?.errors
        ? responseData.errors
        : undefined;

      throw new ApiError(
        errorMessage,
        response.status,
        response,
        validationErrors,
      );
    }

    return {
      ...responseData,
      status: response.status,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    // Handle network errors, timeout, etc.
    throw new ApiError(
      error instanceof Error ? error.message : "Network error",
      0,
    );
  }
}

// Convenience methods for different HTTP methods
export const api = {
  // GET request
  get: <T = unknown>(
    endpoint: string,
    config?: RequestConfig,
  ): Promise<ApiResponse<T>> => {
    return apiRequest<T>(endpoint, { ...config, method: "GET" });
  },

  // POST request
  post: <T = unknown>(
    endpoint: string,
    data?: unknown,
    config?: RequestConfig,
  ): Promise<ApiResponse<T>> => {
    return apiRequest<T>(endpoint, {
      ...config,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  // PUT request
  put: <T = unknown>(
    endpoint: string,
    data?: unknown,
    config?: RequestConfig,
  ): Promise<ApiResponse<T>> => {
    return apiRequest<T>(endpoint, {
      ...config,
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  // PATCH request
  patch: <T = unknown>(
    endpoint: string,
    data?: unknown,
    config?: RequestConfig,
  ): Promise<ApiResponse<T>> => {
    return apiRequest<T>(endpoint, {
      ...config,
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  // DELETE request
  delete: <T = unknown>(
    endpoint: string,
    config?: RequestConfig,
  ): Promise<ApiResponse<T>> => {
    return apiRequest<T>(endpoint, { ...config, method: "DELETE" });
  },

  // File upload (multipart/form-data)
  upload: <T = unknown>(
    endpoint: string,
    formData: FormData,
    config?: RequestConfig,
  ): Promise<ApiResponse<T>> => {
    const { headers, ...restConfig } = config || {};
    // Remove Content-Type header for FormData - browser will set it automatically
    const uploadHeaders = Object.fromEntries(
      Object.entries(headers || {}).filter(
        ([key]) => key.toLowerCase() !== "content-type",
      ),
    );

    return apiRequest<T>(endpoint, {
      ...restConfig,
      method: "POST",
      headers: uploadHeaders,
      body: formData,
    });
  },
};

// Utility function to set React Hook Form errors from backend validation
export const setBackendErrors = (
  error: ApiError,
  setError: (name: string, error: { type: string; message: string }) => void,
) => {
  if (error.validationErrors?.fieldErrors) {
    Object.entries(error.validationErrors.fieldErrors).forEach(
      ([field, messages]) => {
        if (messages && messages.length > 0) {
          setError(field, {
            type: "server",
            message: messages[0], // Use the first error message
          });
        }
      },
    );
  }
};

// Export the base URL for cases where you need it
export { BASE_URL };

// Default export
export default api;
