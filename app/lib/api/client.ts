// AI 서버 URL (녹화/이미지 업로드용)
const AI_SERVER_URL =
    process.env.NEXT_PUBLIC_AI_SERVER_URL ||
    "https://unto-dover-wayne-beds.trycloudflare.com";

// 메인 서버 URL (인증 등 기타 API용)
const MAIN_SERVER_URL =
    process.env.NEXT_PUBLIC_SERVER_URL ||
    "http://localhost:8000";

export class ApiClient {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {},
        useAuth: boolean = false
    ): Promise<T> {
        // baseUrl과 endpoint 사이의 슬래시 정규화
        const normalizedBaseUrl = this.baseUrl.endsWith('/') ? this.baseUrl.slice(0, -1) : this.baseUrl;
        const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        const url = `${normalizedBaseUrl}${normalizedEndpoint}`;

        const headers: Record<string, string> = {
            ...(options.headers as Record<string, string>),
        };

        // Authorization 헤더 추가 (useAuth가 true일 때)
        if (useAuth && typeof window !== "undefined") {
            const token = localStorage.getItem("access_token");
            if (token) {
                headers["Authorization"] = `Bearer ${token}`;
                console.log(`[API] Authorization 헤더 추가됨: Bearer ${token.substring(0, 20)}...`);
            } else {
                console.warn(`[API] useAuth가 true이지만 토큰이 없습니다. endpoint: ${endpoint}`);
            }
        }

        try {
            console.log(`[API] ${options.method || 'GET'} ${url}`);
            
            const response = await fetch(url, {
                ...options,
                headers,
            });

            console.log(`[API] Response status: ${response.status}`);

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[API] Error response:`, errorText);
                throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
            }

            // 응답 본문이 비어있는지 확인
            const contentType = response.headers.get("content-type");
            const text = await response.text();
            
            // 빈 응답인 경우 빈 객체 반환
            if (!text || text.trim().length === 0) {
                console.warn(`[API] 빈 응답 받음: ${url}`);
                return {} as T;
            }

            // JSON이 아닌 경우 처리
            if (!contentType || !contentType.includes("application/json")) {
                console.warn(`[API] JSON이 아닌 응답: ${contentType}, 본문: ${text.substring(0, 100)}`);
                // JSON이 아니어도 파싱 시도 (일부 서버가 Content-Type을 잘못 설정할 수 있음)
            }

            try {
                return JSON.parse(text) as T;
            } catch (parseError) {
                console.error(`[API] JSON 파싱 실패:`, parseError);
                console.error(`[API] 응답 본문:`, text);
                throw new Error(`JSON 파싱 실패: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
            }
        } catch (error) {
            console.error(`[API] Request failed:`, error);
            if (error instanceof TypeError && error.message === 'Failed to fetch') {
                const errorMessage = `서버에 연결할 수 없습니다.\n\n` +
                    `URL: ${url}\n\n` +
                    `가능한 원인:\n` +
                    `1. 백엔드 서버가 실행되지 않았습니다\n` +
                    `2. Cloudflare tunnel URL이 만료되었습니다\n` +
                    `3. 환경 변수 설정이 잘못되었습니다\n\n` +
                    `해결 방법:\n` +
                    `1. .env.local 파일에서 NEXT_PUBLIC_SERVER_URL 확인\n` +
                    `2. 백엔드 서버가 실행 중인지 확인\n` +
                    `3. 로컬 서버 사용 시: http://localhost:8000\n` +
                    `4. 개발 서버 재시작: npm run dev`;
                throw new Error(errorMessage);
            }
            throw error;
        }
    }

    async get<T>(endpoint: string, options?: RequestInit, useAuth: boolean = false): Promise<T> {
        return this.request<T>(endpoint, { ...options, method: "GET" }, useAuth);
    }

    async post<T>(
        endpoint: string,
        body?: any,
        options?: RequestInit,
        useAuth: boolean = false
    ): Promise<T> {
        return this.request<T>(endpoint, {
            ...options,
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...options?.headers,
            },
            body: body ? JSON.stringify(body) : undefined,
        }, useAuth);
    }

    async postFormData<T>(
        endpoint: string,
        formData: FormData,
        options?: RequestInit,
        useAuth: boolean = false
    ): Promise<T> {
        return this.request<T>(endpoint, {
            ...options,
            method: "POST",
            body: formData,
        }, useAuth);
    }

    async put<T>(
        endpoint: string,
        body?: any,
        options?: RequestInit,
        useAuth: boolean = false
    ): Promise<T> {
        return this.request<T>(endpoint, {
            ...options,
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                ...options?.headers,
            },
            body: body ? JSON.stringify(body) : undefined,
        }, useAuth);
    }

    async delete<T>(endpoint: string, options?: RequestInit, useAuth: boolean = false): Promise<T> {
        return this.request<T>(endpoint, { ...options, method: "DELETE" }, useAuth);
    }
}

// AI 서버용 클라이언트 (/context/upload 등)
export const aiApiClient = new ApiClient(AI_SERVER_URL);

// 메인 서버용 클라이언트 (/auth/* 등)
export const apiClient = new ApiClient(MAIN_SERVER_URL);

