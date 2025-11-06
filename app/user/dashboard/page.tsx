"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/hooks/useAuth";
import type { AnalyzeUploadResponse } from "@/app/types/api";

export default function UserDashboardPage() {
    const router = useRouter();
    const { user, logout } = useAuth();
    const [latestAnalysis, setLatestAnalysis] = useState<AnalyzeUploadResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // 최근 분석 결과 불러오기
    useEffect(() => {
        const loadLatestAnalysis = () => {
            try {
                // 로컬 스토리지에서 최근 분석 결과 찾기
                const keys = Object.keys(localStorage);
                const analysisKeys = keys.filter((key) => key.startsWith("analysis_"));
                
                if (analysisKeys.length > 0) {
                    // 가장 최근 분석 결과 가져오기
                    const latestKey = analysisKeys.sort().reverse()[0];
                    const analysisData = localStorage.getItem(latestKey);
                    if (analysisData) {
                        setLatestAnalysis(JSON.parse(analysisData));
                    }
                }
            } catch (error) {
                console.error("분석 결과 불러오기 실패:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadLatestAnalysis();
    }, []);

    // 주간 감정 데이터 (임시 - 실제로는 API에서 가져와야 함)
    const weeklyEmotions = [
        { day: "월", emoji: "😁", date: 1 },
        { day: "화", emoji: "🙂", date: 2 },
        { day: "수", emoji: "😮‍💨", date: 3 },
        { day: "목", emoji: "😊", date: 4 },
        { day: "금", emoji: "😌", date: 5 },
        { day: "토", emoji: "😴", date: 6 },
        { day: "일", emoji: "😊", date: 7 },
    ];

    const handleLogout = () => {
        logout();
        router.push("/");
    };

    const handleStartRecording = () => {
        router.push("/user/record");
    };

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-white">
                <p className="text-gray-400">로딩 중...</p>
            </div>
        );
    }

    const statusSignal = latestAnalysis?.status_signal;
    const aiCarePlan = latestAnalysis?.ai_care_plan;
    const keyPhrases = latestAnalysis?.key_phrases || [];
    const careTodo = latestAnalysis?.care_todo || [];

    return (
        <div className="flex min-h-screen flex-col bg-white">
            {/* 헤더 */}
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4 bg-white">
                <h1 className="font-dangdang text-lg text-primary">오늘은?</h1>
                <div className="flex items-center gap-3">
                    <span className="text-base font-semibold text-black">
                        {user?.name || "사용자"} 님
                    </span>
                    <button 
                        onClick={handleLogout} 
                        className="p-2 -mr-2 rounded-lg transition-colors hover:bg-gray-50 active:bg-gray-100"
                    >
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9"
                                stroke="black"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <path
                                d="M16 17L21 12L16 7"
                                stroke="black"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <path
                                d="M21 12H9"
                                stroke="black"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </button>
                </div>
            </div>

            {/* 오늘의 상태 요약 */}
            {statusSignal && (
                <div className="px-4 py-4">
                    <div className="rounded-xl bg-primary/10 border border-primary/20 p-5 shadow-sm">
                        <h2 className="mb-4 text-base font-semibold text-black">오늘의 상태</h2>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-600">건강:</span>
                                <span className={`text-sm font-semibold px-2 py-1 rounded-lg ${
                                    statusSignal.health === "red" ? "text-red-700 bg-red-50" :
                                    statusSignal.health === "yellow" ? "text-yellow-700 bg-yellow-50" :
                                    "text-green-700 bg-green-50"
                                }`}>
                                    {statusSignal.health === "red" ? "주의 필요" :
                                     statusSignal.health === "yellow" ? "관찰 필요" :
                                     "양호"}
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-600">감정:</span>
                                <span className={`text-sm font-semibold px-2 py-1 rounded-lg ${
                                    statusSignal.emotion === "red" ? "text-red-700 bg-red-50" :
                                    statusSignal.emotion === "yellow" ? "text-yellow-700 bg-yellow-50" :
                                    "text-green-700 bg-green-50"
                                }`}>
                                    {statusSignal.emotion === "red" ? "주의 필요" :
                                     statusSignal.emotion === "yellow" ? "관찰 필요" :
                                     "양호"}
                                </span>
                            </div>
                            {statusSignal.summary && (
                                <p className="mt-3 text-sm text-gray-700 leading-relaxed">{statusSignal.summary}</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 오늘의 케어 계획 */}
            {aiCarePlan && (
                <div className="px-4 py-3">
                    <div className="rounded-xl bg-gray-50 border border-gray-200 p-5 shadow-sm">
                        <h2 className="mb-4 text-base font-semibold text-black">오늘의 케어 계획</h2>
                        <div className="space-y-4">
                            {aiCarePlan.today && (
                                <div className="rounded-lg bg-white p-3">
                                    <p className="text-sm font-semibold text-gray-700 mb-1">오늘</p>
                                    <p className="text-sm text-gray-600 leading-relaxed">{aiCarePlan.today}</p>
                                </div>
                            )}
                            {aiCarePlan.this_week && (
                                <div className="rounded-lg bg-white p-3">
                                    <p className="text-sm font-semibold text-gray-700 mb-1">이번 주</p>
                                    <p className="text-sm text-gray-600 leading-relaxed">{aiCarePlan.this_week}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 핵심 문구 */}
            {keyPhrases.length > 0 && (
                <div className="px-4 py-3">
                    <div className="rounded-xl bg-primary/5 border border-primary/10 p-5 shadow-sm">
                        <h2 className="mb-4 text-base font-semibold text-black">핵심 문구</h2>
                        <div className="flex flex-wrap gap-2">
                            {keyPhrases.map((phrase, index) => (
                                <span
                                    key={index}
                                    className="rounded-full bg-primary/20 border border-primary/30 px-3 py-1.5 text-sm text-gray-700 font-medium"
                                >
                                    {phrase}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* 케어 할 일 */}
            {careTodo.length > 0 && (
                <div className="px-4 py-3">
                    <div className="rounded-xl bg-white border border-gray-200 p-5 shadow-sm">
                        <h2 className="mb-4 text-base font-semibold text-black">케어 할 일</h2>
                        <ul className="space-y-3">
                            {careTodo.map((todo, index) => (
                                <li key={index} className="flex items-start gap-3 text-sm text-gray-700 leading-relaxed">
                                    <span className="mt-1 text-primary font-bold">•</span>
                                    <span>{todo}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {/* 주간 감정 통계 */}
            <div className="flex-1 bg-primary px-4 pb-6 pt-6 safe-area-bottom rounded-t-3xl shadow-lg">
                <div className="mb-6">
                    <h2 className="mb-6 text-base font-semibold text-black">이번 주 감정</h2>
                    <div className="flex items-start justify-between">
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
                </div>

                {/* 구분선 */}
                <div className="mb-6 h-px w-full bg-white/30" />

                {/* 새로운 기록 시작 버튼 */}
                <button
                    onClick={handleStartRecording}
                    className="w-full rounded-xl bg-white px-4 py-4 text-center text-base font-semibold text-primary shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                >
                    새로운 기록 시작하기
                </button>
            </div>
        </div>
    );
}

