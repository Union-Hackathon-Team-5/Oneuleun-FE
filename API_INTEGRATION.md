# API 통합 가이드

## 📁 파일 구조

```
app/
├── lib/
│   └── api/
│       ├── index.ts          # API 진입점
│       ├── client.ts         # API 클라이언트
│       ├── recording.ts      # 녹화 API 서비스
│       ├── auth.ts           # 인증 API 서비스
│       └── log.ts            # 로그 API 서비스
├── types/
│   └── api.ts               # API 타입 정의
└── hooks/
    └── useAuth.ts           # 사용자 인증 훅
```

## 🔧 설정

### 환경 변수

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
# AI 서버 (녹화/이미지 업로드용)
NEXT_PUBLIC_AI_SERVER_URL=https://unto-dover-wayne-beds.trycloudflare.com

# 메인 서버 (인증 및 기타 API용)
NEXT_PUBLIC_SERVER_URL=http://localhost:8000
```

**참고:**
- `NEXT_PUBLIC_AI_SERVER_URL`: AI 서버, `/context/upload` 엔드포인트 제공
- `NEXT_PUBLIC_SERVER_URL`: 메인 서버, 인증 API(`/auth/*`) 제공

**⚠️ 중요:** 환경 변수 변경 후 반드시 개발 서버를 재시작하세요!
```bash
# 개발 서버 중지 (Ctrl+C)
# 개발 서버 재시작
npm run dev
```

## 📚 사용법

### 1. API 클라이언트

두 개의 API 클라이언트가 `app/lib/api/client.ts`에 정의되어 있습니다.

```typescript
import { apiClient, aiApiClient } from "@/app/lib/api/client";

// 메인 서버용 클라이언트 (인증 API 등)
const authData = await apiClient.post("/auth/login", { 
    account_id: "test", 
    password: "1234" 
});

// 인증이 필요한 API 호출 (마지막 파라미터에 true)
const seniorsList = await apiClient.get("/caregiver", undefined, true);

// AI 서버용 클라이언트 (이미지 업로드 등)
const formData = new FormData();
formData.append("image_file", blob);
const uploadResult = await aiApiClient.postFormData("/context/upload", formData);
```

### 2. 인증 서비스

인증 관련 API는 `app/lib/api/auth.ts`에 정의되어 있습니다.

```typescript
import { authService } from "@/app/lib/api/auth";

// 회원가입
const signupResponse = await authService.signup("accountId", "password");
authService.saveToken(signupResponse.access_token, signupResponse.expires_at);

// 로그인
const loginResponse = await authService.login("accountId", "password");
authService.saveToken(loginResponse.access_token, loginResponse.expires_at);

// 토큰 확인
const token = authService.getToken();
const isExpired = authService.isTokenExpired();

// 로그아웃
authService.removeToken();
```

### 3. 녹화 서비스

녹화 관련 API는 `app/lib/api/recording.ts`에 정의되어 있습니다.

```typescript
import { recordingService } from "@/app/lib/api/recording";

// 컨텍스트 업로드
const sessionId = recordingService.generateSessionId();
const result = await recordingService.uploadContext(
    sessionId,
    "user-id",
    imageBlob
);
```

### 4. 사용자 인증

`useAuth` 훅을 사용하여 사용자 정보를 관리합니다.

```typescript
import { useAuth } from "@/app/hooks/useAuth";

function MyComponent() {
    const { user, login, logout, isAuthenticated } = useAuth();

    // 로그인
    login({
        id: "user-123",
        name: "홍길동",
        type: "user"
    });

    // 사용자 ID 사용
    const userId = user?.id;

    return <div>{user?.name}</div>;
}
```

## 🔌 API 엔드포인트

### POST /context/upload

녹화 컨텍스트(이미지) 업로드

**요청:**
- Content-Type: `multipart/form-data`
- Body:
  - `session_id` (string, required): 세션 ID
  - `user_id` (string, required): 사용자 ID
  - `image_file` (binary, required): 이미지 파일

**응답:**
```typescript
{
    success: boolean;
    message?: string;
    data?: {
        url?: string;
        file_id?: string;
    };
}
```

### POST /auth/signup

보호자 회원가입

**요청:**
- Content-Type: `application/json`
- Body:
```json
{
    "account_id": "testtest",
    "password": "test1234"
}
```

**응답:**
```json
{
    "access_token": "eyJ0eXBlIjoiYWNjZXNzIiwiYWxnIjoiSFMyNTYifQ...",
    "expires_at": "2025-11-06T07:04:47.467783"
}
```

### POST /auth/login

보호자 로그인

**요청:**
- Content-Type: `application/json`
- Body:
```json
{
    "account_id": "testtest",
    "password": "test1234"
}
```

**응답:**
```json
{
    "access_token": "eyJ0eXBlIjoiYWNjZXNzIiwiYWxnIjoiSFMyNTYifQ.eyJzdWIiOiJ0ZXN0dGVzdCIsImlhdCI6MTc2MjM2MTM4MCwiZXhwIjoxNzYyMzc5MzgwfQ.2rX0gn2X0O6KUMkhPrwrpFKzuI1KCgHOWJ8861scXhg",
    "expires_at": "2025-11-06T06:49:40.873363"
}
```

### POST /auth/register

노인 등록 (보호자가 노인 사용자를 등록)

**요청:**
- Content-Type: `application/json`
- Body:
```json
{
    "name": "테스트",
    "birth_date": "1950-12-12",
    "gender": "MALE"
}
```

**응답:**
```json
{
    "code": "470425"
}
```

**참고:** 반환된 6자리 코드는 노인이 사용자 로그인 시 사용합니다.

### POST /auth/login/senior

노인 로그인 (6자리 코드로 로그인)

**요청:**
- Content-Type: `application/json`
- Body:
```json
{
    "code": "680777"
}
```

**응답:**
```json
{
    "access_token": "eyJ0eXBlIjoiYWNjZXNzIiwiYWxnIjoiSFMyNTYifQ.eyJzdWIiOiJ0ZXN0dGVzdCIsImlhdCI6MTc2MjM2MTM4MCwiZXhwIjoxNzYyMzc5MzgwfQ.2rX0gn2X0O6KUMkhPrwrpFKzuI1KCgHOWJ8861scXhg",
    "expires_at": "2025-11-06T06:49:40.873363"
}
```

### GET /caregiver

보호자가 관리하는 노인 목록 조회

**요청:**
- Authorization: `Bearer {access_token}` (필수)
- 헤더에 Bearer 토큰 포함 필요

**응답:**
```json
[
    {
        "id": 1,
        "name": "테스트"
    },
    {
        "id": 2,
        "name": "테스트"
    }
]
```

### POST /log

노인 기록 저장

**요청:**
- Content-Type: `multipart/form-data`
- Body:
  - `file` (optional): 파일
  - `request` (optional): JSON 문자열
    ```json
    {
        "user_id": 1,
        "session_id": "skdjlkjfk",
        "emotion": "기쁨",
        "warning_signs": "jkfwejkflewjf",
        "summary": "dklfweljkjfkle"
    }
    ```

**응답:**
```json
{}
```

## 🎯 실제 사용 예시

### 녹화 페이지에서 이미지 업로드

녹화 페이지 (`app/user/record/page.tsx`)에서 API가 어떻게 사용되는지 확인할 수 있습니다:

```typescript
import { recordingService } from "@/app/lib/api/recording";
import { useAuth } from "@/app/hooks/useAuth";

export default function UserRecordPage() {
    const { user } = useAuth();

    const uploadToServer = async (blob: Blob) => {
        const sessionId = recordingService.generateSessionId();
        const userId = user?.id || `temp-user-${Date.now()}`;

        const result = await recordingService.uploadContext(
            sessionId,
            userId,
            blob
        );

        console.log("업로드 성공:", result);
    };
}
```

### 보호자 회원가입/로그인

보호자 로그인 페이지 (`app/admin/login/page.tsx`)에서 사용:

```typescript
import { authService } from "@/app/lib/api";
import { useAuth } from "@/app/hooks/useAuth";

export default function AdminLoginPage() {
    const { login } = useAuth();

    const handleLogin = async () => {
        try {
            // POST /auth/login
            const response = await authService.login(username, password);
            authService.saveToken(response.access_token, response.expires_at);
            login({ id: username, name: username, type: "admin" });
            router.push("/admin/dashboard");
        } catch (error) {
            console.error("로그인 실패:", error);
        }
    };
}
```

### 노인 등록

보호자가 노인을 등록하는 예시:

```typescript
import { authService } from "@/app/lib/api";

const handleRegisterUser = async () => {
    try {
        const response = await authService.registerUser(
            "홍길동",
            "1950-12-12",
            "MALE"
        );
        
        console.log("등록 코드:", response.code); // 예: "470425"
        // 이 코드를 노인에게 전달하여 사용자 로그인 시 사용
    } catch (error) {
        console.error("등록 실패:", error);
    }
};
```

### 노인 로그인

사용자 로그인 페이지 (`app/user/login/page.tsx`)에서 사용:

```typescript
import { authService } from "@/app/lib/api";
import { useAuth } from "@/app/hooks/useAuth";

export default function UserLoginPage() {
    const { login } = useAuth();

    const handleSubmit = async () => {
        const fullCode = "680777"; // 6자리 코드
        
        try {
            const response = await authService.seniorLogin(fullCode);
            
            // 토큰 저장
            authService.saveToken(response.access_token, response.expires_at);
            
            // 사용자 정보 저장
            login({ id: fullCode, name: `사용자-${fullCode}` });
            
            // 녹화 페이지로 이동
            router.push("/user/record");
        } catch (error) {
            console.error("로그인 실패:", error);
        }
    };
}
```

### 관리 노인 목록 조회

보호자 대시보드에서 관리 중인 노인 목록 조회:

```typescript
import { authService } from "@/app/lib/api";
import { useEffect, useState } from "react";

export default function AdminDashboard() {
    const [seniors, setSeniors] = useState([]);

    useEffect(() => {
        const fetchSeniors = async () => {
            try {
                // Authorization 헤더가 자동으로 추가됨
                const seniorsList = await authService.getCaregiverSeniors();
                setSeniors(seniorsList);
            } catch (error) {
                console.error("노인 목록 조회 실패:", error);
            }
        };

        fetchSeniors();
    }, []);

    return (
        <div>
            <h2>관리 중인 노인</h2>
            <ul>
                {seniors.map((senior) => (
                    <li key={senior.id}>{senior.name}</li>
                ))}
            </ul>
        </div>
    );
}
```

### 노인 기록 저장

추천 페이지에서 활동 완료 후 기록 저장:

```typescript
import { logService } from "@/app/lib/api";

export default function RecommendationPage() {
    const handleSaveLog = async (videoBlob: Blob) => {
        try {
            const logData = {
                user_id: 1,
                session_id: "session-123456",
                emotion: "기쁨",
                warning_signs: "특이사항 없음",
                summary: "산책 활동을 즐겁게 완료했습니다."
            };

            // 파일과 함께 기록 저장
            await logService.createLog(logData, videoBlob);
            
            console.log("기록이 저장되었습니다.");
        } catch (error) {
            console.error("기록 저장 실패:", error);
        }
    };

    // 파일 없이 기록만 저장
    const handleSaveLogOnly = async () => {
        try {
            const logData = {
                user_id: 1,
                session_id: "session-123456",
                emotion: "기쁨",
                warning_signs: "특이사항 없음",
                summary: "활동을 완료했습니다."
            };

            await logService.createLog(logData);
            
            console.log("기록이 저장되었습니다.");
        } catch (error) {
            console.error("기록 저장 실패:", error);
        }
    };
}
```

## 🔍 타입 정의

API 요청 및 응답 타입은 `app/types/api.ts`에 정의되어 있습니다.

```typescript
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
```

## 🛠️ 확장하기

새로운 API 서비스를 추가하려면:

1. `app/lib/api/` 폴더에 새 서비스 파일 생성
2. `app/types/api.ts`에 타입 정의 추가
3. `app/lib/api/index.ts`에서 export

예시:
```typescript
// app/lib/api/emotion.ts
import { apiClient } from "./client";

export class EmotionService {
    async getEmotions() {
        return apiClient.get("/emotions");
    }
}

export const emotionService = new EmotionService();
```

## 📝 참고사항

- API 요청은 두 개의 서버 URL을 사용합니다:
  - **AI 서버** (`NEXT_PUBLIC_AI_SERVER_URL`): 녹화/이미지 업로드용
    - `POST /context/upload` - 녹화 컨텍스트 업로드
  - **메인 서버** (`NEXT_PUBLIC_SERVER_URL`): 인증 및 기타 API용
    - `POST /auth/signup` - 보호자 회원가입
    - `POST /auth/login` - 보호자 로그인
    - `POST /auth/register` - 노인 등록 (보호자가 사용, 6자리 코드 발급)
    - `POST /auth/login/senior` - 노인 로그인 (6자리 코드로 인증)
    - `GET /caregiver` - 관리 노인 목록 조회 (Bearer 토큰 필요)
    - `POST /log` - 노인 기록 저장
- 액세스 토큰은 로컬 스토리지에 `access_token` 키로 저장됩니다
- 토큰 만료 시간은 `token_expires_at` 키로 저장됩니다
- 사용자 인증 정보는 로컬 스토리지에 `user` 키로 저장됩니다
- 세션 ID는 타임스탬프와 랜덤 문자열을 조합하여 생성됩니다
- **인증이 필요한 API**: API 메서드의 마지막 파라미터에 `useAuth: true`를 전달하면 자동으로 `Authorization: Bearer {token}` 헤더가 추가됩니다

## 🌐 AI 서버 상태

AI 서버는 [https://unto-dover-wayne-beds.trycloudflare.com](https://unto-dover-wayne-beds.trycloudflare.com)에서 실행 중입니다.

**서버 응답:**
```json
{
    "service": "Oneuleun AI API",
    "status": "running"
}
```

## 🔧 문제 해결

### "Failed to fetch" 에러

이 에러는 서버에 연결할 수 없을 때 발생합니다.

**해결 방법:**

1. **환경 변수 확인**
   - `.env.local` 파일이 존재하는지 확인
   - `NEXT_PUBLIC_SERVER_URL`이 올바르게 설정되어 있는지 확인
   - 환경 변수 변경 후 개발 서버를 재시작했는지 확인

2. **서버 상태 확인**
   - 백엔드 서버가 실행 중인지 확인
   - 브라우저 콘솔에서 연결하려는 URL 확인 (`[API] POST http://...`)

3. **CORS 문제**
   - 백엔드 서버에서 CORS가 허용되어 있는지 확인
   - 개발 환경에서는 `Access-Control-Allow-Origin: *`가 필요할 수 있음

4. **네트워크 문제**
   - 방화벽이나 보안 소프트웨어가 연결을 차단하는지 확인
   - 로컬 서버는 `http://localhost:PORT` 또는 `http://127.0.0.1:PORT` 사용

**디버깅:**

브라우저 콘솔을 열면 다음과 같은 로그를 확인할 수 있습니다:
```
[API] POST http://localhost:8000/auth/login
[API] Response status: 200
```

또는 에러 메시지:
```
[API] Request failed: TypeError: Failed to fetch
서버에 연결할 수 없습니다. 서버 URL을 확인해주세요: http://localhost:8000/auth/login
```

### 환경 변수가 적용되지 않음

**원인:**
- Next.js는 빌드 시점에 환경 변수를 읽습니다
- 런타임에 환경 변수를 변경해도 적용되지 않습니다

**해결:**
1. `.env.local` 파일을 수정한 후
2. 개발 서버를 재시작하세요 (Ctrl+C → `npm run dev`)

### API 응답이 JSON이 아닌 경우

**에러:**
```
SyntaxError: Unexpected token < in JSON at position 0
```

**원인:**
- 서버가 HTML 에러 페이지를 반환
- 서버가 JSON 대신 다른 형식을 반환

**해결:**
- 브라우저 콘솔에서 `[API] Error response:` 로그 확인
- 서버 엔드포인트와 응답 형식 확인

