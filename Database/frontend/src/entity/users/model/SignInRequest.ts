export interface SignInRequest {
  email: string;
  password: string;
  cloudflareTurnstileToken?: string;
}
