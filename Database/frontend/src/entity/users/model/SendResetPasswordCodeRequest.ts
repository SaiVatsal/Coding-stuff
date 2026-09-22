export interface SendResetPasswordCodeRequest {
  email: string;
  cloudflareTurnstileToken?: string;
}
