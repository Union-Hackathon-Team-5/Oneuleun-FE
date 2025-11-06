"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authService, logService } from "@/app/lib/api";
import type { Senior, SeniorLogResponse, Period } from "@/app/types/api";
import { Period as PeriodEnum } from "@/app/types/api";
import { usePushNotification } from "@/app/hooks/usePushNotification";
import {
    Chart as ChartJS,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
} from "chart.js";
import { Radar } from "react-chartjs-2";

// Chart.js 등록
ChartJS.register(
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend
);

interface AlarmTime {
    hour: number;
    minute: number;
}

export default function AdminDashboardPage() {
    const router = useRouter();
    const { requestPermission, sendServerPush, isSubscribed } = usePushNotification();
    const [seniors, setSeniors] = useState<Senior[]>([]);
    const [selectedSenior, setSelectedSenior] = useState<Senior | null>(null);
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState("2025년 11월");
    const [showAlarmModal, setShowAlarmModal] = useState(false);
    const [showUserManagementModal, setShowUserManagementModal] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [seniorLog, setSeniorLog] = useState<SeniorLogResponse | null>(null);
    const [isLoadingLog, setIsLoadingLog] = useState(false);
    const [emotionCounts, setEmotionCounts] = useState<number[]>([0, 0, 0, 0, 0, 0]);
    const [isLoadingEmotion, setIsLoadingEmotion] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState<Period>(PeriodEnum.WEEK);
    const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
    
    // 알림 시간 설정
    const [showHourDropdown, setShowHourDropdown] = useState(false);
    const [showMinuteDropdown, setShowMinuteDropdown] = useState(false);
    const [alarmTime, setAlarmTime] = useState<AlarmTime>(() => {
        // 로컬 스토리지에서 저장된 알림 시간 불러오기
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("alarmTime");
            if (saved) {
                return JSON.parse(saved);
            }
        }
        return { hour: 9, minute: 0 };
    });
    
    const touchStartY = useRef(0);
    const touchEndY = useRef(0);

    // 감정별 수치 계산 (6각형 레이더 차트용)
    // API에서 받은 카운트를 0-5점 척도로 정규화
    const getEmotionValues = (): number[] => {
        if (emotionCounts.length !== 6) {
            return [0, 0, 0, 0, 0, 0];
        }

        // 최대 카운트를 찾아서 정규화 (0-5점 척도)
        const maxCount = Math.max(...emotionCounts, 1); // 최소 1로 나누기 방지
        
        return emotionCounts.map((count) => {
            // 카운트를 0-5점으로 정규화
            return Math.round((count / maxCount) * 5);
        });
    };

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

    // 선택한 노인의 기록 불러오기
    useEffect(() => {
        const fetchSeniorLog = async () => {
            if (!selectedSenior) {
                setSeniorLog(null);
                return;
            }

            setIsLoadingLog(true);
            try {
                const log = await logService.getSeniorLog(selectedSenior.id);
                setSeniorLog(log);
            } catch (error) {
                console.error("노인 기록 조회 실패:", error);
                setSeniorLog(null);
            } finally {
                setIsLoadingLog(false);
            }
        };

        fetchSeniorLog();
    }, [selectedSenior]);

    // 선택한 노인의 감정 카운트 불러오기
    useEffect(() => {
        const fetchEmotionCount = async () => {
            if (!selectedSenior) {
                setEmotionCounts([0, 0, 0, 0, 0, 0]);
                return;
            }

            setIsLoadingEmotion(true);
            try {
                const response = await logService.getEmotionCount(selectedSenior.id, [selectedPeriod]);
                setEmotionCounts(response.count);
            } catch (error) {
                console.error("감정 카운트 조회 실패:", error);
                setEmotionCounts([0, 0, 0, 0, 0, 0]);
            } finally {
                setIsLoadingEmotion(false);
            }
        };

        fetchEmotionCount();
    }, [selectedSenior, selectedPeriod]);

    // 알림 시간 저장
    useEffect(() => {
        if (typeof window !== "undefined") {
            localStorage.setItem("alarmTime", JSON.stringify(alarmTime));
        }
    }, [alarmTime]);

    // 정기적 알림 체크 및 전송
    useEffect(() => {
        if (!isSubscribed || !selectedSenior) return;

        const checkAndSendNotification = () => {
            const now = new Date();
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();

            // 설정한 알림 시간과 일치하는지 확인
            if (currentHour === alarmTime.hour && currentMinute === alarmTime.minute) {
                const title = `${selectedSenior.name}님의 일일 체크`;
                const body = "오늘 하루는 어떠셨나요? 기록을 남겨보세요.";

                sendServerPush(title, body, "/user/record", selectedSenior.name).catch((error) => {
                    console.error("정기 알림 전송 실패:", error);
                });
            }
        };

        // 매 분마다 체크
        const interval = setInterval(checkAndSendNotification, 60000); // 1분 = 60000ms

        // 초기 체크
        checkAndSendNotification();

        return () => clearInterval(interval);
    }, [alarmTime, selectedSenior, isSubscribed, sendServerPush]);

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
                if (showPeriodDropdown) setShowPeriodDropdown(false);
            }}
        >
            {/* 헤더 */}
            <div className="relative flex items-center justify-between border-b border-gray-100 px-4 py-4 bg-white">
                <h1 className="font-dangdang text-lg text-primary">오늘은?</h1>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowUserDropdown(!showUserDropdown);
                            }}
                            className="flex items-center gap-2 rounded-lg px-3 py-1.5 transition-colors hover:bg-gray-50 active:bg-gray-100"
                        >
                            <span className="text-base font-semibold text-black">
                                {selectedSenior?.name || "선택"} 님
                            </span>
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                className={`transition-transform ${showUserDropdown ? "rotate-180" : ""}`}
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
                        {showUserDropdown && (
                            <div 
                                className="absolute right-0 top-full z-20 mt-2 w-52 rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {seniors.length > 0 && seniors.map((senior) => (
                                    <button
                                        key={senior.id}
                                        onClick={() => {
                                            setSelectedSenior(senior);
                                            setShowUserDropdown(false);
                                        }}
                                        className={`w-full px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
                                            selectedSenior?.id === senior.id
                                                ? "bg-primary/10 font-semibold text-primary"
                                                : "text-black"
                                        }`}
                                    >
                                        {senior.name} 님
                                    </button>
                                ))}
                                <div className="h-px bg-gray-100" />
                                <button
                                    onClick={() => {
                                        setShowUserDropdown(false);
                                        setShowUserManagementModal(true);
                                    }}
                                    className="w-full px-4 py-3 text-left transition-colors hover:bg-gray-50 text-black font-medium"
                                >
                                    사용자 관리
                                </button>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            router.push("/admin/notifications");
                        }}
                        className="relative z-30 rounded-full p-2 transition-all hover:bg-gray-100 active:scale-95"
                    >
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
            </div>

            {/* 레이더 차트 영역 */}
            <div className="px-4 py-6 bg-gray-10">
                {/* 기간 필터 드롭다운 */}
                <div className="relative mb-6">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowPeriodDropdown(!showPeriodDropdown);
                        }}
                        className="flex h-[52px] w-full items-center justify-between rounded-xl bg-white px-4 border border-gray-200 shadow-sm transition-all hover:border-primary/30 hover:shadow-md active:scale-[0.98]"
                    >
                        <span className="text-base font-normal text-primary">
                            {selectedPeriod === PeriodEnum.WEEK
                                ? "이번 주"
                                : selectedPeriod === PeriodEnum.MONTH
                                ? "이번 달"
                                : selectedPeriod === PeriodEnum.YEAR
                                ? "올해"
                                : "기간 선택"}
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
                    {showPeriodDropdown && (
                        <div
                            className="absolute left-0 right-0 top-full z-10 mt-2 rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <label className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50 cursor-pointer">
                                <input
                                    type="radio"
                                    name="period"
                                    checked={selectedPeriod === PeriodEnum.WEEK}
                                    onChange={() => {
                                        setSelectedPeriod(PeriodEnum.WEEK);
                                        setShowPeriodDropdown(false);
                                    }}
                                    className="h-4 w-4 border-gray-300 text-primary focus:ring-2 focus:ring-primary/20"
                                />
                                <span className="text-base text-black">이번 주</span>
                            </label>
                            <label className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50 cursor-pointer">
                                <input
                                    type="radio"
                                    name="period"
                                    checked={selectedPeriod === PeriodEnum.MONTH}
                                    onChange={() => {
                                        setSelectedPeriod(PeriodEnum.MONTH);
                                        setShowPeriodDropdown(false);
                                    }}
                                    className="h-4 w-4 border-gray-300 text-primary focus:ring-2 focus:ring-primary/20"
                                />
                                <span className="text-base text-black">이번 달</span>
                            </label>
                            <label className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50 cursor-pointer">
                                <input
                                    type="radio"
                                    name="period"
                                    checked={selectedPeriod === PeriodEnum.YEAR}
                                    onChange={() => {
                                        setSelectedPeriod(PeriodEnum.YEAR);
                                        setShowPeriodDropdown(false);
                                    }}
                                    className="h-4 w-4 border-gray-300 text-primary focus:ring-2 focus:ring-primary/20"
                                />
                                <span className="text-base text-black">올해</span>
                            </label>
                        </div>
                    )}
                </div>
                <div className="flex h-[300px] sm:h-[375px] items-center justify-center rounded-xl bg-white p-4 shadow-sm">
                    {isLoadingEmotion ? (
                        <p className="text-sm text-gray-400">로딩 중...</p>
                    ) : (
                        <div className="w-full h-full">
                            <Radar
                                data={{
                                    labels: ["기쁨", "분노", "슬픔", "외로움", "무기력함", "행복"],
                                    datasets: [
                                        {
                                            label: "감정 수치",
                                            data: getEmotionValues(),
                                            backgroundColor: "rgba(245, 218, 167, 0.2)",
                                            borderColor: "rgba(245, 218, 167, 1)",
                                            borderWidth: 2,
                                            pointBackgroundColor: "rgba(245, 218, 167, 1)",
                                            pointBorderColor: "#fff",
                                            pointHoverBackgroundColor: "#fff",
                                            pointHoverBorderColor: "rgba(245, 218, 167, 1)",
                                            pointRadius: 4,
                                            pointHoverRadius: 6,
                                        },
                                    ],
                                }}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    scales: {
                                        r: {
                                            beginAtZero: true,
                                            max: 5,
                                            min: 0,
                                            ticks: {
                                                stepSize: 1,
                                                display: true,
                                                font: {
                                                    size: 12,
                                                },
                                                color: "#666",
                                            },
                                            grid: {
                                                color: "rgba(0, 0, 0, 0.1)",
                                            },
                                            pointLabels: {
                                                font: {
                                                    size: 14,
                                                    weight: "bold",
                                                },
                                                color: "#333",
                                            },
                                        },
                                    },
                                    plugins: {
                                        legend: {
                                            display: false,
                                        },
                                        tooltip: {
                                            backgroundColor: "rgba(0, 0, 0, 0.8)",
                                            padding: 12,
                                            cornerRadius: 8,
                                            callbacks: {
                                                label: (context) => {
                                                    const value = context.parsed.r;
                                                    const label = context.label || "";
                                                    const index = context.dataIndex;
                                                    const count = emotionCounts[index] || 0;
                                                    return `${label}: ${value}점 (${count}회)`;
                                                },
                                            },
                                        },
                                    },
                                }}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* 하단 캘린더 섹션 */}
            <div 
                className="flex-1 bg-primary px-4 pb-6 pt-6 safe-area-bottom rounded-t-3xl shadow-lg"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {/* 월 네비게이션 */}
                <div className="mb-6 flex items-center justify-between">
                    <span className="text-base font-semibold text-black">{selectedMonth}</span>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => {
                                const [year, month] = selectedMonth.match(/(\d{4})년 (\d{1,2})월/)?.slice(1) || ["2025", "11"];
                                const prevMonth = parseInt(month) - 1;
                                if (prevMonth < 1) {
                                    setSelectedMonth(`${parseInt(year) - 1}년 12월`);
                                } else {
                                    setSelectedMonth(`${year}년 ${prevMonth}월`);
                                }
                            }}
                            className="rounded-full p-2 transition-all hover:bg-white/20 active:scale-95"
                        >
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
                        <button 
                            onClick={() => {
                                const [year, month] = selectedMonth.match(/(\d{4})년 (\d{1,2})월/)?.slice(1) || ["2025", "11"];
                                const nextMonth = parseInt(month) + 1;
                                if (nextMonth > 12) {
                                    setSelectedMonth(`${parseInt(year) + 1}년 1월`);
                                } else {
                                    setSelectedMonth(`${year}년 ${nextMonth}월`);
                                }
                            }}
                            className="rounded-full p-2 transition-all hover:bg-white/20 active:scale-95"
                        >
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
                <div className="mb-6 h-[5px] w-full rounded-full bg-white/30 shadow-inner">
                    <div className="h-full w-[37%] rounded-full bg-white shadow-sm transition-all duration-300" />
                </div>

                {/* 주간 감정 캘린더 */}
                <div className="mb-6 flex items-start justify-between">
                    {weeklyEmotions.map((item, index) => (
                        <div key={index} className="flex flex-col items-center gap-2">
                            <span className="text-xs font-medium text-black/70">{item.day}</span>
                            <div className="rounded-full bg-white/20 p-2">
                                <span className="text-xl">{item.emoji}</span>
                            </div>
                            <span className="text-xs font-medium text-black/70">{item.date}</span>
                        </div>
                    ))}
                </div>

                {/* 구분선 */}
                <div className="mb-5 h-px w-full bg-white/30" />

                {/* 알림 설정 */}
                <button 
                    onClick={() => setShowAlarmModal(true)}
                    className="mb-5 w-full rounded-xl bg-white/20 px-4 py-3 text-left transition-all hover:bg-white/30 active:scale-[0.98]"
                >
                    <p className="text-sm font-semibold text-black">{selectedSenior?.name || "선택"}님 알림 설정 시간</p>
                </button>

                {/* 드롭다운 */}
                <div className="mb-5 flex gap-3">
                    <button className="flex h-[52px] flex-1 items-center justify-between rounded-xl bg-white px-4 shadow-sm transition-all hover:shadow-md active:scale-[0.98]">
                        <span className="text-sm font-medium text-primary">요일</span>
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M6 9L12 15L18 9"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </button>
                    <button className="flex h-[52px] flex-1 items-center justify-between rounded-xl bg-white px-4 shadow-sm transition-all hover:shadow-md active:scale-[0.98]">
                        <span className="text-sm font-medium text-primary">시간</span>
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M6 9L12 15L18 9"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </button>
                </div>
            </div>

            {/* 편지 보러가기 버튼 */}
            <div className="px-4 pb-6 safe-area-bottom bg-primary">
                <button
                    onClick={async () => {
                        // 선택된 노인이 없으면 알림 목록으로 이동
                        if (!selectedSenior) {
                            router.push("/admin/notifications");
                            return;
                        }

                        // 선택된 노인의 ID를 사용하여 상세 페이지로 이동
                        // 상세 페이지에서 /log/{senior-id} API를 호출하여 최근 로그를 가져옴
                        router.push(`/admin/notifications/${selectedSenior.id}`);
                    }}
                    className="relative z-10 h-[56px] w-full rounded-xl bg-white text-base font-semibold text-primary shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                >
                    편지보러가기
                </button>
            </div>

            {/* 알림 설정 모달 */}
            {showAlarmModal && (
                <div 
                    className="fixed inset-0 z-50 bg-black/60" 
                    onClick={() => {
                        setShowAlarmModal(false);
                        setShowHourDropdown(false);
                        setShowMinuteDropdown(false);
                    }}
                >
                    <div 
                        className="absolute bottom-0 left-0 right-0 rounded-t-3xl bg-primary px-4 pb-6 pt-12 safe-area-bottom"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* 월 네비게이션 */}
                        <div className="mb-4 flex items-center justify-between">
                            <span className="text-sm font-semibold text-black">{selectedMonth}</span>
                            <div className="flex gap-4">
                                <button 
                                    onClick={() => {
                                        const [year, month] = selectedMonth.match(/(\d{4})년 (\d{1,2})월/)?.slice(1) || ["2025", "11"];
                                        const prevMonth = parseInt(month) - 1;
                                        if (prevMonth < 1) {
                                            setSelectedMonth(`${parseInt(year) - 1}년 12월`);
                                        } else {
                                            setSelectedMonth(`${year}년 ${prevMonth}월`);
                                        }
                                    }}
                                    className="p-2 -mr-2 active:opacity-70"
                                >
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
                                <button 
                                    onClick={() => {
                                        const [year, month] = selectedMonth.match(/(\d{4})년 (\d{1,2})월/)?.slice(1) || ["2025", "11"];
                                        const nextMonth = parseInt(month) + 1;
                                        if (nextMonth > 12) {
                                            setSelectedMonth(`${parseInt(year) + 1}년 1월`);
                                        } else {
                                            setSelectedMonth(`${year}년 ${nextMonth}월`);
                                        }
                                    }}
                                    className="p-2 -mr-2 active:opacity-70"
                                >
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
                        <div className="mb-6 h-[4px] w-full rounded-full bg-white">
                            <div className="h-full w-[37%] rounded-full bg-primary" />
                        </div>

                        {/* 주간 감정 캘린더 */}
                        <div className="mb-5 flex items-start justify-between">
                            {weeklyEmotions.map((item, index) => (
                                <div key={index} className="flex flex-col items-center gap-2">
                                    <span className="text-xs font-normal text-black">{item.day}</span>
                                    <span className="text-base">{item.emoji}</span>
                                    <span className="text-xs font-normal text-black">{item.date}</span>
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
                            {/* 시간 선택 */}
                            <div className="relative flex-1">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowHourDropdown(!showHourDropdown);
                                        setShowMinuteDropdown(false);
                                    }}
                                    className="flex h-[52px] w-full items-center justify-between rounded-lg bg-white px-4 active:bg-gray-50"
                                >
                                    <span className="text-base font-normal text-primary">
                                        {alarmTime.hour.toString().padStart(2, "0")}시
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

                                {showHourDropdown && (
                                    <div
                                        className="absolute top-full z-20 mt-2 max-h-48 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {Array.from({ length: 24 }, (_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => {
                                                    setAlarmTime({ ...alarmTime, hour: i });
                                                    setShowHourDropdown(false);
                                                }}
                                                className={`w-full px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
                                                    alarmTime.hour === i
                                                        ? "bg-primary/10 font-semibold text-primary"
                                                        : "text-black"
                                                }`}
                                            >
                                                {i.toString().padStart(2, "0")}시
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* 분 선택 */}
                            <div className="relative flex-1">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowMinuteDropdown(!showMinuteDropdown);
                                        setShowHourDropdown(false);
                                    }}
                                    className="flex h-[52px] w-full items-center justify-between rounded-lg bg-white px-4 active:bg-gray-50"
                                >
                                    <span className="text-base font-normal text-primary">
                                        {alarmTime.minute.toString().padStart(2, "0")}분
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

                                {showMinuteDropdown && (
                                    <div
                                        className="absolute top-full z-20 mt-2 max-h-48 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {[0, 15, 30, 45].map((minute) => (
                                            <button
                                                key={minute}
                                                onClick={() => {
                                                    setAlarmTime({ ...alarmTime, minute });
                                                    setShowMinuteDropdown(false);
                                                }}
                                                className={`w-full px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
                                                    alarmTime.minute === minute
                                                        ? "bg-primary/10 font-semibold text-primary"
                                                        : "text-black"
                                                }`}
                                            >
                                                {minute.toString().padStart(2, "0")}분
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 알림 권한 요청 버튼 */}
                        {!isSubscribed && (
                            <button
                                onClick={async (e) => {
                                    e.stopPropagation();
                                    const granted = await requestPermission();
                                    if (granted) {
                                        alert("알림 권한이 승인되었습니다!");
                                    }
                                }}
                                className="mt-4 h-[52px] w-full rounded-lg bg-primary text-lg font-semibold text-white"
                            >
                                알림 권한 요청
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* 사용자 관리 모달 */}
            {showUserManagementModal && (
                <div 
                    className="fixed inset-0 z-50 bg-black/60" 
                    onClick={() => setShowUserManagementModal(false)}
                >
                    <div 
                        className="absolute bottom-0 left-0 right-0 rounded-t-3xl bg-white px-4 pb-6 pt-12 safe-area-bottom max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* 드래그 핸들 */}
                        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-1.5 bg-gray-300 rounded-full" />

                        {/* 타이틀 */}
                        <div className="mb-6">
                            <h2 className="text-base font-semibold text-black">사용자 관리</h2>
                        </div>

                        {/* 사용자 리스트 */}
                        <div className="mb-6 rounded-lg bg-[#ebebec] overflow-hidden">
                            {seniors.length === 0 ? (
                                <div className="px-6 py-8 text-center text-gray-500">
                                    등록된 사용자가 없습니다
                                </div>
                            ) : (
                                seniors.map((senior, index) => (
                                    <button
                                        key={senior.id}
                                        onClick={() => {
                                            setSelectedSenior(senior);
                                            setShowUserManagementModal(false);
                                        }}
                                        className={`w-full flex items-center justify-between px-6 py-4 border-b border-white last:border-b-0 active:bg-gray-100 ${
                                            selectedSenior?.id === senior.id ? "bg-primary/10" : ""
                                        }`}
                                    >
                                        <span className="text-sm font-semibold text-black">
                                            {senior.name} 님 {senior.code ? `(${senior.code})` : ""}
                                        </span>
                                        {selectedSenior?.id === senior.id && (
                                            <svg
                                                width="24"
                                                height="24"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <path
                                                    d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z"
                                                    fill="#b6771d"
                                                />
                                            </svg>
                                        )}
                                    </button>
                                ))
                            )}
                        </div>

                        {/* 초대코드 생성하기 버튼 */}
                        <button
                            onClick={() => {
                                setShowUserManagementModal(false);
                                router.push("/admin/user/register");
                            }}
                            className="h-[52px] w-full rounded-lg bg-primary text-lg font-semibold text-white active:opacity-90"
                        >
                            초대코드 생성하기
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

