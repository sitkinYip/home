import { ElMessage } from "element-plus";

interface RequestOptions extends RequestInit {
  retries?: number;
  retryDelay?: number;
  timeout?: number;
  showError?: boolean; // Control whether to show default error toast
}

const DEFAULT_RETRIES = 3;
const DEFAULT_RETRY_DELAY = 1000;
const DEFAULT_TIMEOUT = 10000;

/**
 * A wrapper around fetch with retry logic, timeout, and standardized error handling.
 */
export async function request<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const {
    retries = DEFAULT_RETRIES,
    retryDelay = DEFAULT_RETRY_DELAY,
    timeout = DEFAULT_TIMEOUT,
    showError = true,
    ...fetchOptions
  } = options;

  let attempt = 0;

  const executeFetch = async (): Promise<T> => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });
      clearTimeout(id);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return (await response.json()) as T;
    } catch (error: any) {
      clearTimeout(id);

      // Don't retry on abort (timeout) if we want that specifically,
      // but usually timeout is a good reason to retry if idempotent.
      // Here we treat timeout as a retryable error.

      attempt++;
      if (attempt <= retries) {
        if (import.meta.env.DEV) {
          console.warn(`Request failed to ${url}. Retrying (${attempt}/${retries})...`, error);
        }
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        return executeFetch();
      } else {
        throw error;
      }
    }
  };

  try {
    return await executeFetch();
  } catch (error: any) {
    if (showError) {
      const msg =
        error.name === "AbortError" ? "请求超时，请检查网络" : error.message || "网络请求失败";
      ElMessage.error(msg);
    }
    console.error(`Final request failed to ${url} after ${retries} retries:`, error);
    throw error;
  }
}
