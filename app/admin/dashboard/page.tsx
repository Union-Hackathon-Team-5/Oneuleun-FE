"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/app/lib/api";
import type { Senior } from "@/app/types/api";

export default function AdminDashboardPage() {
    const router = useRouter();
    const [seniors, setSeniors] = useState<Senior[]>([]);
    const [selectedSenior, setSelectedSenior] = useState<Senior | null>(null);
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState("2025년 11월");
    const [showAlarmModal, setShowAlarmModal] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const touchStartY = useRef(0);
    const touchEndY = useRef(0);

    // 관리하는 노인 목록 불러오기
    useEffect(() => {
        const fetchSeniors = async () => {
            try {
                const seniorsList = await authService.getCaregiverSeniors();
                setSeniors(seniorsList);
                if (seniorsList.length > 0) {
                    setSelectedSenior(seniorsList[0]);
                }
            } catch (error) {
                console.error("노인 목록 조회 실패:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSeniors();
    }, []);

    // 주간 감정 데이터
    const weeklyEmotions = [
        { day: "월", emoji: "😁", date: 1 },
        { day: "화", emoji: "🙂", date: 2 },
        { day: "수", emoji: "😮‍💨", date: 3 },
        { day: "목", emoji: "😡", date: 4 },
        { day: "금", emoji: "😥", date: 5 },
        { day: "토", emoji: "😐", date: 6 },
        { day: "일", emoji: "😁", date: 7 },
    ];

    // 스와이프 핸들러
    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        touchEndY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = () => {
        const swipeThreshold = 50; // 최소 스와이프 거리 (px)
        const diff = touchStartY.current - touchEndY.current;

        // 위로 스와이프 (diff > 0)
        if (diff > swipeThreshold) {
            setShowAlarmModal(true);
        }

        // 초기화
        touchStartY.current = 0;
        touchEndY.current = 0;
    };

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-white">
                <p className="text-gray-400">로딩 중...</p>
            </div>
        );
    }

    return (
        <div 
            className="flex min-h-screen flex-col bg-white"
            onClick={() => {
                if (showUserDropdown) setShowUserDropdown(false);
            }}
        >
            {/* 헤더 */}
            <div className="relative flex items-center justify-between px-6 py-4">
                <h1 className="font-dangdang text-base text-primary">오늘은?</h1>

                <div className="relative">
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowUserDropdown(!showUserDropdown);
                        }}
                        className="flex items-center gap-2"
                    >
                        <span className="text-lg font-semibold text-black">
                            {selectedSenior?.name || "선택"} 님
                        </span>
                        <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M6 9L12 15L18 9"
                                stroke="black"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </button>

                    {/* 드롭다운 메뉴 */}
                    {showUserDropdown && seniors.length > 0 && (
                        <div 
                            className="absolute right-0 top-full z-10 mt-2 w-48 rounded-lg border border-gray-200 bg-white shadow-lg"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {seniors.map((senior) => (
                                <button
                                    key={senior.id}
                                    onClick={() => {
                                        setSelectedSenior(senior);
                                        setShowUserDropdown(false);
                                    }}
                                    className={`w-full px-4 py-3 text-left transition-colors first:rounded-t-lg last:rounded-b-lg hover:bg-gray-50 ${
                                        selectedSenior?.id === senior.id
                                            ? "bg-primary/10 font-semibold text-primary"
                                            : "text-black"
                                    }`}
                                >
                                    {senior.name} 님
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <button>
                    <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z"
                            stroke="black"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        <path
                            d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21"
                            stroke="black"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </button>
            </div>

            {/* 레이더 차트 영역 */}
            <div className="px-6 py-6">
                <div className="flex h-[375px] items-center justify-center rounded-lg bg-gray-50">
                    <p className="text-sm text-gray-400">레이더 차트 영역</p>
                </div>
            </div>

            {/* 하단 캘린더 섹션 */}
            <div 
                className="flex-1 bg-primary px-6 pb-8 pt-4"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {/* 월 네비게이션 */}
                <div className="mb-6 flex items-center justify-between">
                    <span className="text-base font-semibold text-black">{selectedMonth}</span>
                    <div className="flex gap-5">
                        <button>
                            <svg
                                width="12"
                                height="24"
                                viewBox="0 0 12 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M10 18L4 12L10 6"
                                    stroke="black"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </button>
                        <button>
                            <svg
                                width="12"
                                height="24"
                                viewBox="0 0 12 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M2 6L8 12L2 18"
                                    stroke="black"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* 진행 바 */}
                <div className="mb-8 h-[5px] w-full rounded-full bg-white">
                    <div className="h-full w-[37%] rounded-full bg-primary" />
                </div>

                {/* 주간 감정 캘린더 */}
                <div className="mb-6 flex items-start justify-between">
                    {weeklyEmotions.map((item, index) => (
                        <div key={index} className="flex flex-col items-center gap-3">
                            <span className="text-sm font-normal text-black">{item.day}</span>
                            <span className="text-lg">{item.emoji}</span>
                            <span className="text-sm font-normal text-black">{item.date}</span>
                        </div>
                    ))}
                </div>

                {/* 구분선 */}
                <div className="mb-4 h-px w-full bg-primary" />

                {/* 알림 설정 */}
                <button 
                    onClick={() => setShowAlarmModal(true)}
                    className="mb-4 w-full text-left"
                >
                    <p className="text-sm font-semibold text-black">{selectedSenior?.name || "선택"}님 알림 설정 시간</p>
                </button>

                {/* 드롭다운 */}
                <div className="mb-6 flex gap-2">
                    <button className="flex h-[54px] flex-1 items-center justify-between rounded-lg bg-white px-5">
                        <span className="text-base font-normal text-primary">요일</span>
                        <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M6 9L12 15L18 9"
                                stroke="black"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </button>
                    <button className="flex h-[54px] flex-1 items-center justify-between rounded-lg bg-white px-5">
                        <span className="text-base font-normal text-primary">시간</span>
                        <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M6 9L12 15L18 9"
                                stroke="black"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </button>
                </div>

                {/* 편지 보러가기 버튼 */}
                <button
                    onClick={() => router.push("/admin/letters")}
                    className="h-[52px] w-full rounded-lg bg-primary text-lg font-semibold text-white"
                >
                    편지보러가기
                </button>
            </div>

            {/* 알림 설정 모달 */}
            {showAlarmModal && (
                <div className="fixed inset-0 z-50 bg-black/60" onClick={() => setShowAlarmModal(false)}>
                    <div 
                        className="absolute bottom-0 left-0 right-0 rounded-t-3xl bg-primary px-6 pb-8 pt-14"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* 월 네비게이션 */}
                        <div className="mb-6 flex items-center justify-between">
                            <span className="text-base font-semibold text-black">{selectedMonth}</span>
                            <div className="flex gap-5">
                                <button>
                                    <svg
                                        width="12"
                                        height="24"
                                        viewBox="0 0 12 24"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            d="M10 18L4 12L10 6"
                                            stroke="black"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </button>
                                <button>
                                    <svg
                                        width="12"
                                        height="24"
                                        viewBox="0 0 12 24"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            d="M2 6L8 12L2 18"
                                            stroke="black"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* 진행 바 */}
                        <div className="mb-8 h-[5px] w-full rounded-full bg-white">
                            <div className="h-full w-[37%] rounded-full bg-primary" />
                        </div>

                        {/* 주간 감정 캘린더 */}
                        <div className="mb-6 flex items-start justify-between">
                            {weeklyEmotions.map((item, index) => (
                                <div key={index} className="flex flex-col items-center gap-3">
                                    <span className="text-sm font-normal text-black">{item.day}</span>
                                    <span className="text-lg">{item.emoji}</span>
                                    <span className="text-sm font-normal text-black">{item.date}</span>
                                </div>
                            ))}
                        </div>

                        {/* 구분선 */}
                        <div className="mb-4 h-px w-full bg-primary" />

                        {/* 알림 설정 */}
                        <div className="mb-4">
                            <p className="text-sm font-semibold text-black">{selectedSenior?.name || "선택"}님 알림 설정 시간</p>
                        </div>

                        {/* 시간/분 드롭다운 */}
                        <div className="flex gap-2">
                            <button className="flex h-[54px] flex-1 items-center justify-between rounded-lg bg-white px-5">
                                <span className="text-base font-normal text-primary">시간</span>
                                <svg
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M6 9L12 15L18 9"
                                        stroke="black"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </button>
                            <button className="flex h-[54px] flex-1 items-center justify-between rounded-lg bg-white px-5">
                                <span className="text-base font-normal text-primary">분</span>
                                <svg
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M6 9L12 15L18 9"
                                        stroke="black"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

