import { createClient } from "@/lib/supabase/client";
import type {
  HistoryResponse,
  Profile,
  StatusResponse,
  VerificationMode,
  VerificationResult,
} from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8123";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function authHeaders(): Promise<HeadersInit> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch {
      // response wasn't JSON — keep statusText
    }
    throw new ApiError(res.status, detail);
  }
  return res.json();
}

export async function transcribeAudio(blob: Blob): Promise<{ text: string }> {
  const form = new FormData();
  form.set("file", blob, "recording.webm");
  const headers = await authHeaders();
  const res = await fetch(`${API_URL}/api/transcribe`, { method: "POST", body: form, headers });
  return handle(res);
}

export async function exportReportPdf(id: string): Promise<Blob> {
  const headers = await authHeaders();
  const res = await fetch(`${API_URL}/api/reports/${id}/export.pdf`, { headers });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      detail = (await res.json()).detail || detail;
    } catch {
      // not JSON
    }
    throw new ApiError(res.status, detail);
  }
  return res.blob();
}

export async function getStatus(): Promise<StatusResponse> {
  const res = await fetch(`${API_URL}/api/status`);
  return handle(res);
}

export interface VerifyPayload {
  mode: VerificationMode;
  text?: string;
  url?: string;
  question?: string;
  files?: File[];
}

export async function submitVerification(payload: VerifyPayload): Promise<VerificationResult> {
  const form = new FormData();
  form.set("mode", payload.mode);
  if (payload.text) form.set("text", payload.text);
  if (payload.url) form.set("url", payload.url);
  if (payload.question) form.set("question", payload.question);
  for (const file of payload.files ?? []) form.append("files", file);

  const headers = await authHeaders();
  const res = await fetch(`${API_URL}/api/verify`, { method: "POST", body: form, headers });
  return handle(res);
}

export async function getVerification(id: string): Promise<VerificationResult> {
  const headers = await authHeaders();
  const res = await fetch(`${API_URL}/api/verify/${id}`, { headers });
  return handle(res);
}

export interface HistoryFilters {
  verdict?: string;
  saved_only?: boolean;
  tag?: string;
  search?: string;
  sort?: string;
  limit?: number;
  offset?: number;
}

export async function getHistory(filters: HistoryFilters = {}): Promise<HistoryResponse> {
  const headers = await authHeaders();
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  const res = await fetch(`${API_URL}/api/history?${params.toString()}`, { headers });
  return handle(res);
}

export async function updateReport(
  id: string,
  update: Partial<{ title: string; notes: string; tags: string[]; saved: boolean }>,
) {
  const headers = { ...(await authHeaders()), "Content-Type": "application/json" };
  const res = await fetch(`${API_URL}/api/reports/${id}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(update),
  });
  return handle(res);
}

export async function deleteReport(id: string) {
  const headers = await authHeaders();
  const res = await fetch(`${API_URL}/api/reports/${id}`, { method: "DELETE", headers });
  if (!res.ok) throw new ApiError(res.status, res.statusText);
}

export interface WatchlistItem {
  id: string;
  label: string;
  verification_id: string | null;
  notes: string | null;
  created_at: string;
}

export async function getWatchlist(): Promise<WatchlistItem[]> {
  const headers = await authHeaders();
  const res = await fetch(`${API_URL}/api/watchlist`, { headers });
  return handle(res);
}

export async function addWatchlistItem(item: {
  label: string;
  verification_id?: string;
  notes?: string;
}): Promise<WatchlistItem> {
  const headers = { ...(await authHeaders()), "Content-Type": "application/json" };
  const res = await fetch(`${API_URL}/api/watchlist`, {
    method: "POST",
    headers,
    body: JSON.stringify(item),
  });
  return handle(res);
}

export async function deleteWatchlistItem(id: string) {
  const headers = await authHeaders();
  const res = await fetch(`${API_URL}/api/watchlist/${id}`, { method: "DELETE", headers });
  if (!res.ok) throw new ApiError(res.status, res.statusText);
}

export async function getProfile(): Promise<Profile> {
  const headers = await authHeaders();
  const res = await fetch(`${API_URL}/api/settings/profile`, { headers });
  return handle(res);
}

export async function updateProfile(update: Partial<Profile>): Promise<Profile> {
  const headers = { ...(await authHeaders()), "Content-Type": "application/json" };
  const res = await fetch(`${API_URL}/api/settings/profile`, {
    method: "PUT",
    headers,
    body: JSON.stringify(update),
  });
  return handle(res);
}

export async function deleteAccount(): Promise<void> {
  const headers = await authHeaders();
  const res = await fetch(`${API_URL}/api/settings/account`, { method: "DELETE", headers });
  if (!res.ok) throw new ApiError(res.status, res.statusText);
}
