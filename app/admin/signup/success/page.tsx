"use client";

import { useRouter } from "next/navigation";
import Button from "@/app/components/common/button";

export default function AdminSignupSuccessPage() {
    const router = useRouter();

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-white to-gray-10 px-6">
            {/* 중앙 메시지 */}
            <div className="flex flex-col items-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <h1
                    className="text-center text-[42px] font-normal sm:text-[50px] drop-shadow-sm"
                    style={{
                        fontFamily: "Cafe24 Dangdanghae, sans-serif",
                        color: "#b6771d",
                    }}
                >
                    오늘은?
                </h1>
                <div className="rounded-full bg-primary/10 p-4 mb-2">
                    <svg
                        width="48"
                        height="48"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="text-primary"
                    >
                        <path
                            d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z"
                            fill="currentColor"
                        />
                    </svg>
                </div>
                <p className="text-lg text-center text-black font-semibold">
                    가입이 완료되었습니다
                </p>
            </div>

            {/* 하단 버튼 */}
            <div className="mt-16 w-full max-w-[327px] pb-8 safe-area-bottom animate-in fade-in slide-in-from-bottom-2 duration-500 delay-300">
                <Button
                    className="h-[56px] w-full text-base shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                    onClick={() => router.push("/admin/login")}
                >
                    로그인하러 가기
                </Button>
            </div>
        </div>
    );
}
