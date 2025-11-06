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
            <div className="flex h-[32px] items-center py-10">
                <button
                    onClick={() => router.back()}
                    className="flex h-8 w-8 items-center justify-center"
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
            <div className="flex-1 pt-6">
                <h1 className="text-body1 mb-12 text-black">
                    사용자 등록 코드를 입력해주세요
                </h1>

                {/* 에러 메시지 */}
                {error && (
                    <div className="text-body5 mb-4 rounded-lg bg-red-100 p-3 text-red-700">
                        ⚠️ {error}
                    </div>
                )}

                {/* 코드 입력 박스 */}
                <div className="flex justify-between px-4">
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
                            className="text-primary focus:ring-primary h-[54px] w-[42px] rounded-lg bg-[#ebebec] text-center text-2xl font-semibold outline-none focus:bg-gray-200 focus:ring-2"
                        />
                    ))}
                </div>
            </div>

            {/* 하단 버튼 */}
            <div className="pb-8">
                <Button
                    className="h-[52px] w-full"
                    isActive={isCodeComplete && !isLoading}
                    onClick={handleSubmit}
                >
                    {isLoading ? "로그인 중..." : "시작하기"}
                </Button>
            </div>
        </div>
    );
}
