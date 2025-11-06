"use client";

import { useRouter } from "next/navigation";
import Button from "@/app/components/common/button";

export default function AdminSignupSuccessPage() {
    const router = useRouter();

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6">
            {/* 중앙 메시지 */}
            <div className="mt-auto mb-auto flex flex-col items-center gap-3">
                <h1
                    className="text-center text-2xl font-normal"
                    style={{
                        fontFamily: "Cafe24 Dangdanghae, sans-serif",
                        color: "#b6771d",
                    }}
                >
                    오늘은?
                </h1>
                <p className="text-body1 text-center text-black">
                    가입이 완료되었습니다
                </p>
            </div>

            {/* 하단 버튼 */}
            <div className="mb-8 w-full max-w-[327px]">
                <Button
                    className="h-[52px] w-full"
                    onClick={() => router.push("/admin/login")}
                >
                    로그인하러 가기
                </Button>
            </div>
        </div>
    );
}
