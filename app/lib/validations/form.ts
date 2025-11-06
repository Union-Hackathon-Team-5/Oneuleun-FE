import { z } from "zod";

// ========================
// Auth 관련 스키마
// ========================

// 관리자 회원가입 스키마
export const adminRegisterSchema = z.object({
    account_id: z
        .string()
        .min(4, "아이디는 최소 4자 이상이어야 합니다")
        .max(20, "아이디는 최대 20자까지 가능합니다")
        .regex(
            /^[a-zA-Z0-9_]+$/,
            "영문, 숫자, 언더스코어(_)만 사용 가능합니다"
        ),
    password: z
        .string()
        .min(8, "비밀번호는 최소 8자 이상이어야 합니다")
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
            "영문 대소문자와 숫자를 포함해야 합니다"
        ),
});

// 관리자 로그인 스키마
export const adminLoginSchema = z.object({
    account_id: z.string().min(1, "아이디를 입력해주세요"),
    password: z.string().min(1, "비밀번호를 입력해주세요"),
});

// 사용자 등록 스키마
export const userRegisterSchema = z.object({
    name: z
        .string()
        .min(2, "이름은 최소 2자 이상이어야 합니다")
        .max(20, "이름은 최대 20자까지 가능합니다"),
    birth_date: z.coerce.date(),
    gender: z.enum(["male", "female", "don't want to say", "other"]),
});

// 사용자 로그인 스키마 (코드)
export const userLoginSchema = z.object({
    code: z
        .string()
        .length(6, "코드는 6자리여야 합니다")
        .regex(/^\d+$/, "숫자만 입력 가능합니다"),
});

// ========================
// Log 관련 스키마
// ========================

// 사용자 로그 폼 요청 스키마
export const userLogFormRequestSchema = z.object({
    file: z.instanceof(File, { message: "파일을 선택해주세요" }),
    request: z.object({
        user_id: z.number().positive("유효한 사용자 ID가 아닙니다"),
        session_id: z.string().min(1, "세션 ID를 입력해주세요"),
        emotion: z.string().min(1, "감정을 입력해주세요"),
        warning_signs: z.string().min(1, "위험 징후를 입력해주세요"),
        summary: z.string().min(1, "요약을 입력해주세요"),
    }),
});

// ========================
// 기타 폼 스키마
// ========================

// 이메일 로그인 폼 스키마 (테스트용)
export const loginSchema = z.object({
    email: z
        .string()
        .min(1, "이메일을 입력해주세요")
        .email("올바른 이메일 형식이 아닙니다"),
    password: z
        .string()
        .min(8, "비밀번호는 최소 8자 이상이어야 합니다")
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
            "영문 대소문자와 숫자를 포함해야 합니다"
        ),
});

// 회원가입 폼 스키마 (테스트용)
export const signupSchema = z
    .object({
        name: z
            .string()
            .min(2, "이름은 최소 2자 이상이어야 합니다")
            .max(20, "이름은 최대 20자까지 가능합니다"),
        email: z
            .string()
            .min(1, "이메일을 입력해주세요")
            .email("올바른 이메일 형식이 아닙니다"),
        password: z
            .string()
            .min(8, "비밀번호는 최소 8자 이상이어야 합니다")
            .regex(
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                "영문 대소문자와 숫자를 포함해야 합니다"
            ),
        confirmPassword: z.string(),
        phone: z
            .string()
            .regex(/^01[0-9]-\d{4}-\d{4}$/, "올바른 전화번호 형식이 아닙니다")
            .optional(),
        age: z
            .number()
            .min(14, "14세 이상만 가입 가능합니다")
            .max(120, "올바른 나이를 입력해주세요")
            .optional(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "비밀번호가 일치하지 않습니다",
        path: ["confirmPassword"],
    });

// 코드 검증 스키마 (호환성 유지)
export const codeSchema = z
    .string()
    .length(6, "코드는 6자리여야 합니다")
    .regex(/^\d+$/, "숫자만 입력 가능합니다");

// ========================
// 타입 추론
// ========================

// Auth 관련
export type AdminRegisterRequest = z.infer<typeof adminRegisterSchema>;
export type AdminLoginRequest = z.infer<typeof adminLoginSchema>;
export type UserRegisterRequest = z.infer<typeof userRegisterSchema>;
export type UserLoginRequest = z.infer<typeof userLoginSchema>;

// Log 관련
export type UserLogFormRequest = z.infer<typeof userLogFormRequestSchema>;

// 기타
export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type CodeData = z.infer<typeof codeSchema>;
