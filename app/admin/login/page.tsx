"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/app/components/common/button";
import { authService } from "@/app/lib/api/auth";
import { useAuth } from "@/app/hooks/useAuth";

export default function AdminLoginPage() {
    const router = useRouter();
    const { login } = useAuth();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const isFormValid = username.trim() !== "" && password.trim() !== "";

    const handleLogin = async () => {
        if (!isFormValid) return;

        setIsLoading(true);
        setError("");

        try {
            // 로그인 API 호출
            const response = await authService.login(username, password);

            // 토큰 저장
            authService.saveToken(response.access_token, response.expires_at);

            // 사용자 정보 저장
            login({
                id: username,
                name: username,
                type: "admin",
            });

            // 로그인 성공 후 대시보드로 이동
            router.push("/admin/dashboard");
        } catch (error) {
            console.error("로그인 오류:", error);
            setError("로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.");
        } finally {
            setIsLoading(false);
        }
    };

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
            <div className="flex-1 px-6 pt-11">
                <h1 className="text-body1 mb-12 text-black">
                    로그인 정보를 입력해주세요
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
                            className="text-body4 focus:border-primary focus:ring-primary h-[56px] w-full rounded-xl border border-[#dbdcde] px-4 text-black placeholder:text-gray-300 focus:ring-1 focus:outline-none"
                        />
                    </div>

                    {/* 비밀번호 입력 */}
                    <div className="relative">
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="비밀번호를 입력해주세요"
                            className="text-body4 focus:border-primary focus:ring-primary h-[56px] w-full rounded-xl border border-[#dbdcde] px-4 text-black placeholder:text-gray-300 focus:ring-1 focus:outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* 하단 버튼 */}
            <div className="flex flex-col gap-3 px-6 pb-8">
                {error && (
                    <p className="text-error mb-2 text-center text-sm">{error}</p>
                )}
                <Button
                    className="h-[52px] w-full"
                    isActive={isFormValid && !isLoading}
                    onClick={handleLogin}
                >
                    {isLoading ? "로그인 중..." : "로그인"}
                </Button>
                <Button
                    variant="secondary"
                    className="h-[52px] w-full"
                    onClick={() => router.push("/admin/signup")}
                >
                    회원가입
                </Button>
            </div>
        </div>
    );
}
