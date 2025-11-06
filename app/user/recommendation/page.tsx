"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function RecommendationPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const emotion = searchParams.get("emotion") || "기쁨";

    const [currentIndex, setCurrentIndex] = useState(0);
    const touchStartX = useRef(0);
    const touchEndX = useRef(0);

    // 활동 추천 데이터
    const activities = [
        {
            id: "walking",
            title: "걷기",
            image: "/images/activities/walking.png",
        },
        {
            id: "meditation",
            title: "명상",
            image: "/images/activities/meditation.png",
        },
        {
            id: "music",
            title: "음악듣기",
            image: "/images/activities/music.png",
        },
    ];

    const handlePrev = () => {
        setCurrentIndex((prev) =>
            prev > 0 ? prev - 1 : activities.length - 1
        );
    };

    const handleNext = () => {
        setCurrentIndex((prev) =>
            prev < activities.length - 1 ? prev + 1 : 0
        );
    };

    const handleActivitySelect = () => {
        // 활동 선택 후 처리
        router.push("/user/dashboard");
    };

    // 스와이프 핸들러
    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        touchEndX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
        const swipeThreshold = 50; // 최소 스와이프 거리 (px)
        const diff = touchStartX.current - touchEndX.current;

        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                // 왼쪽 스와이프 -> 다음
                handleNext();
            } else {
                // 오른쪽 스와이프 -> 이전
                handlePrev();
            }
        }

        // 초기화
        touchStartX.current = 0;
        touchEndX.current = 0;
    };

    return (
        <div className="flex min-h-screen flex-col bg-white">
            {/* 단계 인디케이터 (3/3) */}
            <div className="flex items-center justify-center gap-3 border-b border-gray-100 py-4 px-4 bg-white">
                <div className="bg-primary h-2.5 w-2.5 rounded-full shadow-sm" />
                <div className="bg-primary h-2.5 w-2.5 rounded-full shadow-sm" />
                <div className="bg-primary h-2.5 w-2.5 rounded-full shadow-sm" />
            </div>

            {/* 메인 컨텐츠 */}
            <div className="flex flex-1 flex-col px-4 pt-8 pb-6">
                {/* 제목 */}
                <div className="mb-8">
                    <div className="mb-2 flex flex-wrap items-baseline gap-1">
                        <span className="text-primary text-xl font-semibold">
                            {emotion}
                        </span>
                        <span className="text-base font-semibold text-black">
                            의 감정일때는
                        </span>
                    </div>
                    <h1 className="text-base font-semibold text-black leading-tight">
                        이런 활동을 해보시는건 어떠세요?
                    </h1>
                </div>

                {/* 활동 카드 캐러셀 */}
                <div
                    className="relative flex flex-1 items-center justify-center pb-20"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    {/* 이전 버튼 */}
                    <button
                        onClick={handlePrev}
                        className="bg-primary/90 absolute left-0 z-10 flex h-10 w-10 items-center justify-center rounded-full shadow-lg transition-all hover:bg-primary hover:scale-110 active:scale-95"
                    >
                        <ChevronLeft className="h-5 w-5 text-white" />
                    </button>

                    {/* 활동 카드 */}
                    <div className="relative mx-10 w-full max-w-[280px]">
                        {/* 이미지 카드 */}
                        <div className="relative h-[320px] w-full overflow-hidden rounded-2xl shadow-xl sm:h-[405px]">
                            {/* 활동 이미지 */}
                            <Image
                                src={activities[currentIndex].image}
                                alt={activities[currentIndex].title}
                                fill
                                className="object-cover"
                            />
                        </div>

                        {/* 활동 버튼 */}
                        <button
                            onClick={handleActivitySelect}
                            className="absolute -bottom-14 left-1/2 flex h-[90px] w-[90px] -translate-x-1/2 items-center justify-center rounded-full shadow-lg transition-all hover:scale-110 active:scale-95"
                        >
                            <div className="bg-primary/40 absolute inset-0 rounded-full blur-[100px]" />
                            <span className="text-primary relative z-10 text-xl font-semibold">
                                {activities[currentIndex].title}
                            </span>
                        </button>
                    </div>

                    {/* 다음 버튼 */}
                    <button
                        onClick={handleNext}
                        className="bg-primary/90 absolute right-0 z-10 flex h-10 w-10 items-center justify-center rounded-full shadow-lg transition-all hover:bg-primary hover:scale-110 active:scale-95"
                    >
                        <ChevronRight className="h-5 w-5 text-white" />
                    </button>
                </div>
            </div>
        </div>
    );
}
