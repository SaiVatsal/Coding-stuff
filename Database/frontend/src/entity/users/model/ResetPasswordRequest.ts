export interface ResetPasswordRequest {
  email: string;
  code: string;
  newPassword: string;
}
