"use client";

import { useRouter } from "next/navigation";
import Button from "@/app/components/common/button";

export default function Home() {
    const router = useRouter();

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-linear-to-b from-white to-gray-10 px-4">
            {/* 메인 타이틀 */}
            <div className="mb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <h1
                    className="text-center text-[42px] leading-tight font-normal sm:text-[50px] drop-shadow-sm"
                    style={{
                        fontFamily: "Cafe24 Dangdanghae OTF, sans-serif",
                        color: "#f5daa7",
                    }}
                >
                    오늘은?
                </h1>
            </div>

            {/* 버튼 그룹 */}
            <div className="mb-8 flex w-full max-w-[327px] flex-col gap-4 px-4 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-300">
                <Button
                    className="h-[56px] w-full text-base shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                    onClick={() => router.push("/admin/login")}
                >
                    보호자로 시작하기
                </Button>
                <Button
                    variant="secondary"
                    className="h-[56px] w-full text-base shadow-md transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                    onClick={() => router.push("/user/login")}
                >
                    사용자로 시작하기
                </Button>
            </div>
        </div>
    );
}
