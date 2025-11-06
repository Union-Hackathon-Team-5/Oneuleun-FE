"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/app/components/common/button";
import { authService } from "@/app/lib/api/auth";
import { useAuth } from "@/app/hooks/useAuth";

export default function AdminSignupPage() {
    const router = useRouter();
    const { login } = useAuth();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const isFormValid = username.trim() !== "" && password.trim() !== "";

    const handleSignup = async () => {
        if (!isFormValid) return;

        setIsLoading(true);
        setError("");

        try {
            // 회원가입 API 호출
            const response = await authService.signup(username, password);

            // 토큰 저장
            authService.saveToken(response.access_token, response.expires_at);

            // 사용자 정보 저장
            login({
                id: username,
                name: username,
                type: "admin",
            });

            // 회원가입 성공 후 완료 페이지로 이동
            router.push("/admin/signup/success");
        } catch (error) {
            console.error("회원가입 오류:", error);
            setError("회원가입에 실패했습니다. 다시 시도해주세요.");
        } finally {
            setIsLoading(false);
        }
    };

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
                    회원가입 정보를 입력해주세요
                </h1>

                {/* 입력 필드 */}
                <div className="flex flex-col gap-5">
                    {/* 아이디 입력 */}
                    <div className="relative">
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="아이디를 입력해주세요"
                            className="text-base focus:border-primary focus:ring-primary/20 h-[56px] w-full rounded-xl border border-gray-200 bg-white px-4 text-black shadow-sm transition-all placeholder:text-gray-400 focus:ring-2 focus:outline-none focus:shadow-md"
                        />
                    </div>

                    {/* 비밀번호 입력 */}
                    <div className="relative">
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="비밀번호를 입력해주세요"
                            className="text-base focus:border-primary focus:ring-primary/20 h-[56px] w-full rounded-xl border border-gray-200 bg-white px-4 text-black shadow-sm transition-all placeholder:text-gray-400 focus:ring-2 focus:outline-none focus:shadow-md"
                        />
                    </div>
                </div>
            </div>

            {/* 하단 버튼 */}
            <div className="px-6 pb-6 safe-area-bottom bg-white">
                {error && (
                    <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
                        <p className="text-error text-center text-sm">{error}</p>
                    </div>
                )}
                <Button
                    className="h-[56px] w-full text-base shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                    isActive={isFormValid && !isLoading}
                    onClick={handleSignup}
                >
                    {isLoading ? "처리 중..." : "회원가입"}
                </Button>
            </div>
        </div>
    );
}
