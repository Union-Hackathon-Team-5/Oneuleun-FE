import { apiClient } from "./client";
import type { 
    SignupRequest, 
    SignupResponse, 
    LoginRequest, 
    LoginResponse,
    UserRegisterRequest,
    UserRegisterResponse,
    SeniorLoginRequest,
    SeniorLoginResponse,
    CaregiverSeniorsResponse
} from "@/app/types/api";

export class AuthService {
    /**
     * 보호자 회원가입
     * @param accountId 사용자 계정 ID
     * @param password 비밀번호
     * @returns 액세스 토큰과 만료 시간
     */
    async signup(accountId: string, password: string): Promise<SignupResponse> {
        const payload: SignupRequest = {
            account_id: accountId,
            password: password,
        };

        return apiClient.post<SignupResponse>("/auth/signup", payload);
    }

    /**
     * 보호자 로그인
     * @param accountId 사용자 계정 ID
     * @param password 비밀번호
     * @returns 액세스 토큰과 만료 시간
     */
    async login(accountId: string, password: string): Promise<LoginResponse> {
        const payload: LoginRequest = {
            account_id: accountId,
            password: password,
        };

        return apiClient.post<LoginResponse>("/auth/login/caregiver", payload);
    }

    /**
     * 노인 등록
     * @param name 이름
     * @param birthDate 생년월일 (YYYY-MM-DD)
     * @param gender 성별 (MALE | FEMALE)
     * @returns 등록 코드 (6자리)
     */
    async registerUser(
        name: string,
        birthDate: string,
        gender: "MALE" | "FEMALE"
    ): Promise<UserRegisterResponse> {
        const payload: UserRegisterRequest = {
            name: name,
            birth_date: birthDate,
            gender: gender,
        };

        return apiClient.post<UserRegisterResponse>("/auth/register", payload);
    }

    /**
     * 노인 로그인
     * @param code 6자리 등록 코드
     * @returns 액세스 토큰과 만료 시간
     */
    async seniorLogin(code: string): Promise<SeniorLoginResponse> {
        const payload: SeniorLoginRequest = {
            code: code,
        };

        return apiClient.post<SeniorLoginResponse>("/auth/login/senior", payload);
    }

    /**
     * 보호자가 관리하는 노인 목록 조회
     * @returns 관리 중인 노인 목록
     * @requires Authorization Bearer 토큰 필요
     */
    async getCaregiverSeniors(): Promise<CaregiverSeniorsResponse> {
        return apiClient.get<CaregiverSeniorsResponse>("/caregiver", undefined, true);
    }

    /**
     * 액세스 토큰 저장
     */
    saveToken(token: string, expiresAt: string): void {
        if (typeof window !== "undefined") {
            localStorage.setItem("access_token", token);
            localStorage.setItem("token_expires_at", expiresAt);
        }
    }

    /**
     * 액세스 토큰 가져오기
     */
    getToken(): string | null {
        if (typeof window !== "undefined") {
            return localStorage.getItem("access_token");
        }
        return null;
    }

    /**
     * 토큰 제거 (로그아웃)
     */
    removeToken(): void {
        if (typeof window !== "undefined") {
            localStorage.removeItem("access_token");
            localStorage.removeItem("token_expires_at");
        }
    }

    /**
     * 토큰 만료 확인
     */
    isTokenExpired(): boolean {
        if (typeof window !== "undefined") {
            const expiresAt = localStorage.getItem("token_expires_at");
            if (!expiresAt) return true;

            const expirationDate = new Date(expiresAt);
            return expirationDate < new Date();
        }
        return true;
    }
}

export const authService = new AuthService();

