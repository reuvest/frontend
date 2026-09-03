import toast from "react-hot-toast";
import type { AxiosError } from "axios";

type ApiErrorBody = {
  message?: string;
  error?: string;
  errors?: Record<string, string | string[]>;
};

export default function handleApiError(
  error: AxiosError<ApiErrorBody> | Error,
  fallback: string = "Something went wrong."
): void {
  const axiosError = error as AxiosError<ApiErrorBody>;

  if (!axiosError.response) {
    throw error;
  }

  const { data, status } = axiosError.response;

  if (status === 401) return;

  if (status === 422 && data?.errors) {
    const firstField = Object.keys(data.errors)[0];
    const firstMsg = Array.isArray(data.errors[firstField])
      ? (data.errors[firstField] as string[])[0]
      : (data.errors[firstField] as string);
    toast.error(firstMsg || fallback);
    return;
  }

  if (status === 403) {
    toast.error(data?.message || "Action not permitted.");
    return;
  }

  if (data?.message) { toast.error(data.message); return; }
  if (data?.error)   { toast.error(data.error);   return; }

  toast.error(fallback);
}