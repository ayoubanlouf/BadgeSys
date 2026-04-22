const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api";

function authHeaders(token: string) {
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

export interface AuthResponse {
  token: string;
  username: string;
  message: string;
}

export interface BadgeData {
  badge_id: string;
  image: string; // base64 PNG
  created_at?: string;
}

export interface ValidationResult {
  valid: boolean;
  badge_id?: string;
  username?: string;
  issued_at?: string;
  message?: string;
  error?: string;
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? data.message ?? "Request failed");
  return data as T;
}

export async function register(username: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${BASE}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return handleResponse<AuthResponse>(res);
}

export async function login(username: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return handleResponse<AuthResponse>(res);
}

export async function generateBadge(token: string): Promise<BadgeData> {
  const res = await fetch(`${BASE}/generate_badge`, {
    method: "POST",
    headers: authHeaders(token),
  });
  return handleResponse<BadgeData>(res);
}

export async function fetchMyBadge(token: string): Promise<{ badge: BadgeData | null }> {
  const res = await fetch(`${BASE}/my_badge`, {
    headers: authHeaders(token),
  });
  return handleResponse<{ badge: BadgeData | null }>(res);
}

export async function validateBadgeById(badgeId: string): Promise<ValidationResult> {
  const res = await fetch(`${BASE}/validate_badge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ badge_id: badgeId }),
  });
  return handleResponse<ValidationResult>(res);
}

export async function validateBadgeByImage(file: File): Promise<ValidationResult> {
  const form = new FormData();
  form.append("image", file);
  const res = await fetch(`${BASE}/validate_badge`, {
    method: "POST",
    body: form,
  });
  return handleResponse<ValidationResult>(res);
}
