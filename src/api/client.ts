import type { ApiResponse, PaginatedApiResponse, ApiError } from "./types";
import { ACCESS_TOKEN_KEY, clearAuthSession } from "@/auth/session";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

function normalizePaginatedResponse<T>(
  response: PaginatedApiResponse<T>,
): PaginatedApiResponse<T> {
  const pagination = response.pagination;

  if (!pagination) {
    return response;
  }

  return {
    ...response,
    pagination: {
      ...pagination,
      pageNumber: pagination.pageNumber ?? pagination.currentPage ?? 1,
    },
  };
}

function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

async function parseResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  const body = text ? (JSON.parse(text) as T | ApiError) : null;

  if (!res.ok) {
    if (res.status === 401) {
      clearAuthSession();
    }

    throw body as ApiError;
  }

  return body as T;
}

async function requestWithRetry<T>(
  path: string,
  init: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
  });

  return parseResponse<T>(res);
}

async function requestByUrlWithRetry<T>(
  url: string,
  init: RequestInit,
): Promise<T> {
  const res = await fetch(url, {
    ...init,
    credentials: "include",
  });

  return parseResponse<T>(res);
}

export const apiClient = {
  async get<T>(path: string): Promise<ApiResponse<T>> {
    return requestWithRetry<ApiResponse<T>>(path, {
      method: "GET",
      headers: buildHeaders(),
    });
  },

  async getPaginated<T>(
    path: string,
    params?: Record<string, string | number | null | undefined>,
  ): Promise<PaginatedApiResponse<T>> {
    const url = new URL(`${API_BASE_URL}${path}`);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v === null || v === undefined || v === "") {
          return;
        }

        url.searchParams.set(k, String(v));
      });
    }

    const response = await requestByUrlWithRetry<PaginatedApiResponse<T>>(
      url.toString(),
      {
        method: "GET",
        headers: buildHeaders(),
      },
    );

    return normalizePaginatedResponse(response);
  },

  async post<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
    return requestWithRetry<ApiResponse<T>>(path, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify(body),
    });
  },

  async put<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
    return requestWithRetry<ApiResponse<T>>(path, {
      method: "PUT",
      headers: buildHeaders(),
      body: JSON.stringify(body),
    });
  },

  async patch<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
    return requestWithRetry<ApiResponse<T>>(path, {
      method: "PATCH",
      headers: buildHeaders(),
      body: JSON.stringify(body),
    });
  },

  async delete<T>(path: string): Promise<ApiResponse<T>> {
    return requestWithRetry<ApiResponse<T>>(path, {
      method: "DELETE",
      headers: buildHeaders(),
    });
  },

  async postForm<T>(path: string, body: FormData): Promise<ApiResponse<T>> {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    const headers: Record<string, string> = {};

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return requestWithRetry<ApiResponse<T>>(path, {
      method: "POST",
      headers,
      body,
    });
  },

  async putForm<T>(path: string, body: FormData): Promise<ApiResponse<T>> {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    const headers: Record<string, string> = {};

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return requestWithRetry<ApiResponse<T>>(path, {
      method: "PUT",
      headers,
      body,
    });
  },

  async download(
    path: string,
    params?: Record<string, string | number | null | undefined>,
  ): Promise<{ blob: Blob; fileName: string | null }> {
    const url = new URL(`${API_BASE_URL}${path}`);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v === null || v === undefined || v === "") {
          return;
        }

        url.searchParams.set(k, String(v));
      });
    }

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: buildHeaders(),
      credentials: "include",
    });

    if (!res.ok) {
      if (res.status === 401) {
        clearAuthSession();
      }

      const text = await res.text();
      const body = text ? (JSON.parse(text) as ApiError) : null;
      throw body;
    }

    const contentDisposition = res.headers.get("Content-Disposition");
    const fileNameMatch = contentDisposition?.match(
      /filename\*?=(?:UTF-8''|")?([^";]+)/i,
    );
    const fileName = fileNameMatch?.[1]?.replace(/"/g, "") ?? null;

    return {
      blob: await res.blob(),
      fileName,
    };
  },
};
