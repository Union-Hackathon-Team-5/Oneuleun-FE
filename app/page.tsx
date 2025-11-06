"use client";

import { useRouter } from "next/navigation";
import Button from "@/app/components/common/button";

export default function Home() {
    const router = useRouter();

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-white">
            {/* 메인 타이틀 */}
            <h1
                className="mt-32 mb-auto text-center text-[50px] leading-[26px] font-normal"
                style={{
                    fontFamily: "Cafe24 Dangdanghae OTF, sans-serif",
                    color: "#f5daa7",
                }}
            >
                오늘은?
            </h1>

            {/* 버튼 그룹 */}
            <div className="mb-20 flex w-full max-w-[327px] flex-col gap-4">
                <Button
                    className="h-[52px] w-full"
                    onClick={() => router.push("/admin/login")}
                >
                    보호자로 시작하기
                </Button>
                <Button
                    variant="secondary"
                    className="h-[52px] w-full"
                    onClick={() => router.push("/user/login")}
                >
                    사용자로 시작하기
                </Button>
            </div>
        </div>
    );
}
