"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import Button from "@/app/components/common/button";
import { codeSchema } from "@/app/lib/validations/form";
import { authService } from "@/app/lib/api";
import { useAuth } from "@/app/hooks/useAuth";

export default function UserLoginPage() {
    const router = useRouter();
    const { login } = useAuth();
    const [code, setCode] = useState<string[]>(["", "", "", "", "", ""]);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const handleInputChange = (index: number, value: string) => {
        // 숫자만 허용
        if (!/^\d*$/.test(value)) {
            setError("숫자만 입력 가능합니다");
            return;
        }

        if (value.length > 1) return;

        setError(""); // 에러 초기화
        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);

        // 자동으로 다음 입력으로 이동
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (
        index: number,
        e: KeyboardEvent<HTMLInputElement>
    ) => {
        if (e.key === "Backspace" && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const validateCode = () => {
        const fullCode = code.join("");
        const result = codeSchema.safeParse(fullCode);

        if (!result.success) {
            setError(result.error.issues[0].message);
            return false;
        }

        setError("");
        return true;
    };

    const handleSubmit = async () => {
        if (!validateCode()) {
            return;
        }

        const fullCode = code.join("");
        setIsLoading(true);
        setError("");

        try {
            const response = await authService.seniorLogin(fullCode);
            
            // 토큰 저장
            authService.saveToken(response.access_token, response.expires_at);
            
            // 사용자 정보 저장 (코드를 ID로 사용)
            login({ id: fullCode, name: `사용자-${fullCode}`, type: "user" });
            
            // 녹화 페이지로 이동
            router.push("/user/record");
        } catch (err) {
            console.error("로그인 실패:", err);
            setError("로그인에 실패했습니다. 코드를 확인해주세요.");
        } finally {
            setIsLoading(false);
        }
    };

    const isCodeComplete = code.every((digit) => digit !== "");

    return (
        <div className="flex min-h-screen flex-col bg-white">
            {/* 헤더 */}
            <div className="flex h-[56px] items-center border-b border-gray-100 px-4 pt-2 bg-white">
                <button
                    onClick={() => router.back()}
                    className="flex h-10 w-10 items-center justify-center -ml-2 rounded-lg transition-colors hover:bg-gray-50 active:bg-gray-100"
                    aria-label="뒤로가기"
                >
                    <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M15 18L9 12L15 6"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </button>
            </div>

            {/* 메인 콘텐츠 */}
            <div className="flex-1 px-6 pt-8">
                <h1 className="text-lg font-semibold mb-10 text-black leading-tight">
                    사용자 등록 코드를 입력해주세요
                </h1>

                {/* 에러 메시지 */}
                {error && (
                    <div className="mb-6 rounded-xl bg-red-50 border border-red-200 px-4 py-3 shadow-sm">
                        <p className="text-sm text-red-700">⚠️ {error}</p>
                    </div>
                )}

                {/* 코드 입력 박스 */}
                <div className="flex justify-between gap-3 px-2">
                    {code.map((digit, index) => (
                        <input
                            key={index}
                            ref={(el) => {
                                inputRefs.current[index] = el;
                            }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) =>
                                handleInputChange(index, e.target.value)
                            }
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            className="text-primary focus:ring-primary/20 h-[56px] flex-1 rounded-xl bg-gray-50 border border-gray-200 text-center text-2xl font-semibold shadow-sm transition-all outline-none focus:bg-white focus:border-primary focus:ring-2 focus:shadow-md"
                        />
                    ))}
                </div>
            </div>

            {/* 하단 버튼 */}
            <div className="px-6 pb-6 safe-area-bottom bg-white">
                <Button
                    className="h-[56px] w-full text-base shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                    isActive={isCodeComplete && !isLoading}
                    onClick={handleSubmit}
                >
                    {isLoading ? "로그인 중..." : "시작하기"}
                </Button>
            </div>
        </div>
    );
}
