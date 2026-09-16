import { isAxiosError } from "axios";

/**
 * The backend has no @ControllerAdvice in any service, so almost every
 * business-logic failure surfaces as a bare RuntimeException -> Spring
 * Boot's default error handler, which returns { timestamp, status, error,
 * path } with NO "message" field (server.error.include-message defaults
 * to "never"). Validation failures (@Valid) are the one case that comes
 * back with structured field errors. We normalize both into ApiError so
 * the UI never shows a raw stack trace or Java exception string.
 */
export interface ApiError {
  status: number | null;
  message: string;
  fieldErrors?: Record<string, string>;
}

interface SpringErrorBody {
  message?: string;
  error?: string;
  errors?: Array<{
    field?: string;
    defaultMessage?: string;
    message?: string;
  }>;
}

const DEFAULT_MESSAGES: Record<number, string> = {
  400: "That request couldn't be processed. Please check the details and try again.",
  401: "You need to sign in to do that.",
  403: "You don't have permission to do that.",
  404: "We couldn't find what you were looking for.",
  409: "This couldn't be completed because it conflicts with existing data.",
  422: "Please check the highlighted fields and try again.",
  429: "Too many requests. Please wait a moment and try again.",
  500: "Something went wrong on our end. Please try again in a moment.",
  502: "The service is temporarily unavailable. Please try again shortly.",
  503: "The service is temporarily unavailable. Please try again shortly.",
  504: "The request took too long to respond. Please try again.",
};

export function toApiError(
  error: unknown,
  fallbackByStatus?: Partial<Record<number, string>>,
): ApiError {
  if (isAxiosError(error)) {
    if (!error.response) {
      if (error.code === "ECONNABORTED") {
        return {
          status: null,
          message: "The request timed out. Please try again.",
        };
      }
      return {
        status: null,
        message:
          "Unable to reach the server. Please check your connection and try again.",
      };
    }

    const status = error.response.status;
    const body = error.response.data as SpringErrorBody | undefined;

    const fieldErrors: Record<string, string> = {};
    if (Array.isArray(body?.errors)) {
      for (const e of body.errors) {
        if (e.field) {
          fieldErrors[e.field] = e.defaultMessage ?? e.message ?? "Invalid value";
        }
      }
    }

    if (Object.keys(fieldErrors).length > 0) {
      return {
        status,
        message: "Please check the highlighted fields and try again.",
        fieldErrors,
      };
    }

    const overrideMessage = fallbackByStatus?.[status];
    const message =
      overrideMessage ??
      (typeof body?.message === "string" && body.message.length > 0
        ? body.message
        : DEFAULT_MESSAGES[status]) ??
      "Something went wrong. Please try again.";

    return { status, message };
  }

  return {
    status: null,
    message: "Something unexpected happened. Please try again.",
  };
}
