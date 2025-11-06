"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Button from "@/app/components/common/button";

export default function UserRegisterSuccessPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [code, setCode] = useState<string | null>(null);

    useEffect(() => {
        const codeParam = searchParams.get("code");
        if (codeParam) {
            setCode(codeParam);
        }
    }, [searchParams]);

    return (
        <div className="flex min-h-screen flex-col bg-white">
            {/* 헤더 */}
            <div className="flex h-[56px] items-center border-b border-gray-100 px-4 pt-2 bg-white">
                <button
                    onClick={() => router.push("/admin/dashboard")}
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
            <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-white to-gray-10 px-6">
                <div className="flex flex-col items-center gap-6 w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {/* "오늘은?" 타이틀 */}
                    <h1
                        className="text-center text-2xl font-normal drop-shadow-sm"
                        style={{
                            fontFamily: "Cafe24 Dangdanghae, sans-serif",
                            color: "#b6771d",
                        }}
                    >
                        오늘은?
                    </h1>

                    {/* 등록 코드 */}
                    {code && (
                        <div className="rounded-2xl bg-primary/10 border-2 border-primary/30 px-8 py-6 shadow-lg">
                            <p className="text-center text-[36px] font-bold text-primary leading-tight tracking-wider">
                                {code}
                            </p>
                        </div>
                    )}

                    {/* 완료 메시지 */}
                    <p className="text-center text-lg font-semibold text-black leading-tight">
                        초대코드 생성이 완료되었습니다
                    </p>
                </div>
            </div>

            {/* 하단 버튼 */}
            <div className="px-6 pb-6 safe-area-bottom bg-white">
                <Button
                    className="h-[56px] w-full text-base shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                    onClick={() => router.push("/admin/dashboard")}
                >
                    메인화면으로 돌아가기
                </Button>
            </div>
        </div>
    );
}

