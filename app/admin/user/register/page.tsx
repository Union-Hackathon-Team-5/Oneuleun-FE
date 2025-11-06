"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/app/components/common/button";
import { authService } from "@/app/lib/api/auth";

export default function UserRegisterPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [birthDate, setBirthDate] = useState("");
    const [gender, setGender] = useState<"MALE" | "FEMALE" | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    // 생년월일 포맷팅 (YYYYMMDD -> YYYY-MM-DD)
    const formatBirthDate = (value: string): string => {
        // 숫자만 허용
        const numbers = value.replace(/\D/g, "");
        
        // 8자리 제한
        if (numbers.length > 8) return numbers.slice(0, 8);
        
        // YYYY-MM-DD 형식으로 변환
        if (numbers.length >= 7) {
            return `${numbers.slice(0, 4)}-${numbers.slice(4, 6)}-${numbers.slice(6, 8)}`;
        } else if (numbers.length >= 5) {
            return `${numbers.slice(0, 4)}-${numbers.slice(4, 6)}`;
        } else if (numbers.length >= 4) {
            return `${numbers.slice(0, 4)}`;
        }
        return numbers;
    };

    const handleBirthDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const formatted = formatBirthDate(value);
        setBirthDate(formatted);
    };

    const isFormValid = name.trim() !== "" && birthDate.length === 10 && gender !== null;

    const handleSubmit = async () => {
        if (!isFormValid) return;

        setIsLoading(true);
        setError("");

        try {
            // 생년월일을 YYYY-MM-DD 형식으로 변환 (이미 포맷되어 있음)
            const formattedBirthDate = birthDate;

            // API 호출
            const response = await authService.registerUser(
                name.trim(),
                formattedBirthDate,
                gender!
            );

            // 등록 성공 - 코드를 다음 페이지로 전달하거나 표시
            // TODO: 다음 페이지로 코드 전달 또는 모달로 표시
            console.log("등록 코드:", response.code);
            
            // 다음 페이지로 이동 (코드 표시 페이지 또는 완료 페이지)
            router.push(`/admin/user/register/success?code=${response.code}`);
        } catch (error: any) {
            console.error("등록 오류:", error);
            setError(error?.message || "등록에 실패했습니다. 다시 시도해주세요.");
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
                    사용자의 정보를 입력해주세요.
                </h1>

                {/* 입력 필드 */}
                <div className="flex flex-col gap-5">
                    {/* 이름 입력 */}
                    <div className="relative">
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="이름을 입력해주세요"
                            className="text-base focus:border-primary focus:ring-primary/20 h-[56px] w-full rounded-xl border border-gray-200 bg-white px-4 text-black shadow-sm transition-all placeholder:text-gray-400 focus:ring-2 focus:outline-none focus:shadow-md"
                        />
                    </div>

                    {/* 생년월일 입력 */}
                    <div className="relative">
                        <input
                            type="text"
                            value={birthDate}
                            onChange={handleBirthDateChange}
                            placeholder="생년월일 8자리를 입력해주세요."
                            maxLength={10}
                            inputMode="numeric"
                            className="text-base focus:border-primary focus:ring-primary/20 h-[56px] w-full rounded-xl border border-gray-200 bg-white px-4 text-black shadow-sm transition-all placeholder:text-gray-400 focus:ring-2 focus:outline-none focus:shadow-md"
                        />
                    </div>

                    {/* 성별 선택 */}
                    <div className="flex gap-4">
                        <button
                            onClick={() => setGender("MALE")}
                            className={`flex-1 h-[52px] rounded-xl border-2 shadow-sm transition-all hover:shadow-md active:scale-95 ${
                                gender === "MALE"
                                    ? "border-primary bg-primary/10 shadow-md"
                                    : "border-gray-200 bg-white hover:border-primary/50"
                            }`}
                        >
                            <span
                                className={`text-lg font-semibold ${
                                    gender === "MALE" ? "text-primary" : "text-gray-700"
                                }`}
                            >
                                남성
                            </span>
                        </button>
                        <button
                            onClick={() => setGender("FEMALE")}
                            className={`flex-1 h-[52px] rounded-xl border-2 shadow-sm transition-all hover:shadow-md active:scale-95 ${
                                gender === "FEMALE"
                                    ? "border-primary bg-primary/10 shadow-md"
                                    : "border-gray-200 bg-white hover:border-primary/50"
                            }`}
                        >
                            <span
                                className={`text-lg font-semibold ${
                                    gender === "FEMALE" ? "text-primary" : "text-gray-700"
                                }`}
                            >
                                여성
                            </span>
                        </button>
                    </div>
                </div>

                {/* 에러 메시지 */}
                {error && (
                    <div className="mt-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 shadow-sm">
                        <p className="text-sm text-red-700">⚠️ {error}</p>
                    </div>
                )}
            </div>

            {/* 하단 버튼 */}
            <div className="px-6 pb-6 safe-area-bottom bg-white">
                <Button
                    className="h-[56px] w-full text-base shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                    isActive={isFormValid && !isLoading}
                    onClick={handleSubmit}
                >
                    {isLoading ? "처리 중..." : "다음"}
                </Button>
            </div>
        </div>
    );
}

