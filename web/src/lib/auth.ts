/**
 * Minimal auth client functions (register / login / me) for future UI.
 * The backend remains the authority; this only wires the transport + token.
 */
import { apiRequest, setAccessToken } from "./api";

export type UserRole = "citizen" | "panchayat" | "csr" | "panchayat_employee";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export function register(
  name: string,
  email: string,
  password: string,
  role: UserRole,
): Promise<User> {
  return apiRequest<User>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password, role }),
  });
}

export async function login(email: string, password: string): Promise<TokenResponse> {
  const result = await apiRequest<TokenResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setAccessToken(result.access_token);
  return result;
}

export function me(): Promise<User> {
  return apiRequest<User>("/auth/me");
}

export function logout(): void {
  setAccessToken(null);
}