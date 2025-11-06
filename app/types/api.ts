// Context Upload API
export interface ContextUploadRequest {
    session_id: string;
    user_id: string;
    image_file: File | Blob;
}

export interface ContextUploadResponse {
    success: boolean;
    message?: string;
    data?: {
        url?: string;
        file_id?: string;
    };
}

// Common API Response
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

// Auth API
export interface SignupRequest {
    account_id: string;
    password: string;
}

export interface SignupResponse {
    access_token: string;
    expires_at: string;
}

export interface LoginRequest {
    account_id: string;
    password: string;
}

export interface LoginResponse {
    access_token: string;
    expires_at: string;
}

// User Registration API
export interface UserRegisterRequest {
    name: string;
    birth_date: string;
    gender: "MALE" | "FEMALE";
}

export interface UserRegisterResponse {
    code: string;
}

// Senior Login API
export interface SeniorLoginRequest {
    code: string;
}

export interface SeniorLoginResponse {
    access_token: string;
    expires_at: string;
}

// Caregiver Seniors List API
export interface Senior {
    id: number;
    name: string;
}

export type CaregiverSeniorsResponse = Senior[];

// Log API
export interface LogRequestData {
    user_id: number;
    session_id: string;
    emotion: string;
    warning_signs: string;
    summary: string;
}

export interface LogRequest {
    file?: File | Blob;
    request?: LogRequestData;
}

export interface LogResponse {
    // 빈 객체
}

