export interface AuthState {
  phoneNumber: string;
  otp: string;
  otpToken: string;
  customToken: string;
  bearerToken: string;
  isOtpSent: boolean;
  isLoading: boolean;
  error: string;
  isAuthenticated: boolean;
  user?: AuthUser;
}

export interface AuthUser {
  id: string;
  phone: string;
  name?: string;
  email?: string;
}

export interface SendOtpRequest {
  phone: string;
  reason: 'loginOrRegister';
}

export interface SendOtpResponse {
  msg: string;
  model: {
    otpDigits: number;
    token: string;
    id: number;
  };
}

export interface VerifyOtpRequest {
  token: string;
  otp: string;
  phone: string;
  reason: 'loginOrRegister';
  isOtpAutoFilled: boolean;
  isGoogleLogin:false;
  idToken?:string;
}

export interface VerifyOtpResponse {
  msg: string;
  model: {
    customToken: string;
    user?: AuthUser;
  };
}

export interface ExchangeTokenRequest {
  token: string;
  returnSecureToken: boolean;
}

export interface ExchangeTokenResponse {
  kind: string;
  idToken: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
}

export interface AuthContextType extends AuthState {
  sendOtp: (phoneNumber: string) => Promise<void>;
  verifyOtp: (otp: string) => Promise<void>;
  resendOtp: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
  resetAuthFlow: () => void;
  handleAuthError: (error: Error) => Promise<void>;
}