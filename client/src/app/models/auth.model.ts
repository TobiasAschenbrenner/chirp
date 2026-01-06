export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  id: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}
