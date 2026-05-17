import { apiClient } from "@/api/client";
import type {
  ChangePasswordDTO,
  ForgotPasswordDTO,
  LoginResponseDTO,
  RegisterDTO,
  ResendVerificationDTO,
  ResendVerificationStatusDTO,
  ResetPasswordDTO,
} from "@/api/types";

export async function register(payload: RegisterDTO) {
  return apiClient.post<null>("/auth/signup", payload);
}

export async function login(payload: { email: string; password: string }) {
  return apiClient.post<LoginResponseDTO>("/auth/login", payload);
}

export async function logout() {
  return apiClient.post<null>("/auth/logout", {});
}

export async function changePassword(payload: ChangePasswordDTO) {
  return apiClient.post<null>("/auth/change-password", payload);
}

export async function forgotPassword(payload: ForgotPasswordDTO) {
  return apiClient.post<null>("/auth/forgot-password", payload);
}

export async function resetPassword(payload: ResetPasswordDTO) {
  return apiClient.post<null>("/auth/reset-password", payload);
}

export async function verifyEmail(email: string, token: string) {
  return apiClient.get<null>(
    `/auth/verify-email?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`,
  );
}

export async function resendVerification(payload: ResendVerificationDTO) {
  return apiClient.post<ResendVerificationStatusDTO>(
    "/auth/resend-verification",
    payload,
  );
}
