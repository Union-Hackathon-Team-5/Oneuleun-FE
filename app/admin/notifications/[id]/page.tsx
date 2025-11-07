"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { logService } from "@/app/lib/api/log";
import { authService } from "@/app/lib/api/auth";
import type { SeniorLogResponse } from "@/app/types/api";

interface Notification {
    id: number;
    userName: string;
    title: string;
    description: string;
    isRead: boolean;
    timestamp?: number;
}

const STORAGE_KEY = "notifications";

export default function NotificationDetailPage() {
    const router = useRouter();
    const params = useParams();
    const notificationId = params?.id ? Number(params.id) : null;

    const [notification, setNotification] = useState<Notification | null>(null);
    const [seniorLog, setSeniorLog] = useState<SeniorLogResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [seniorId, setSeniorId] = useState<number | null>(null);

    useEffect(() => {
        if (!notificationId) {
            router.push("/admin/notifications");
            return;
        }

        // URL의 id를 senior-id로 사용하여 직접 로그 조회
        // 예: /admin/notifications/1 -> GET /log/1
        const fetchSeniorLog = async (seniorId: number) => {
            try {
                console.log(`[NotificationDetail] senior-id ${seniorId}로 로그 조회 시작`);
                const log = await logService.getSeniorLog(seniorId);
                console.log(`[NotificationDetail] 로그 조회 성공:`, log);
                setSeniorLog(log);
                
                // 노인 정보 가져오기
                const seniors = await authService.getCaregiverSeniors();
                const senior = seniors.find((s) => s.id === seniorId);
                if (senior) {
                    setSeniorId(senior.id);
                    // 알림 정보 생성 (로그 기반)
                    setNotification({
                        id: log.id || seniorId,
                        userName: senior.name,
                        title: `${senior.name}님의 영상 편지`,
                        description: log.status_signal?.summary || "영상 편지가 도착했어요",
                        isRead: false,
                        timestamp: log.date ? new Date(log.date).getTime() : Date.now(),
                    });
                } else {
                    // 노인 정보를 찾지 못한 경우에도 기본 알림 정보 생성
                    setNotification({
                        id: log.id || seniorId,
                        userName: "사용자",
                        title: "영상 편지",
                        description: log.status_signal?.summary || "영상 편지가 도착했어요",
                        isRead: false,
                        timestamp: log.date ? new Date(log.date).getTime() : Date.now(),
                    });
                }
            } catch (error) {
                console.error("노인 기록 조회 실패:", error);
                router.push("/admin/notifications");
            } finally {
                setIsLoading(false);
            }
        };

        // notificationId를 senior-id로 사용하여 로그 조회
        fetchSeniorLog(notificationId);
    }, [notificationId, router]);

    // 날짜 포맷팅
    const formatDate = (timestamp?: number) => {
        if (!timestamp) return "";
        const date = new Date(timestamp);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
        const weekday = weekdays[date.getDay()];
        return `${year}. ${month}. ${day} (${weekday})`;
    };

    // 감정 이모지 매핑
    const getEmotionEmoji = (emotion: string) => {
        const emotionMap: Record<string, string> = {
            기쁨: "😁",
            분노: "😡",
            슬픔: "😥",
            외로움: "😔",
            무기력함: "😐",
            행복: "😊",
            우울함: "😔",
        };
        return emotionMap[emotion] || "😐";
    };

    // 감정 색상 매핑
    const getEmotionColor = (emotion: string) => {
        const colorMap: Record<string, { bg: string; text: string }> = {
            우울함: { bg: "bg-purple-200", text: "text-blue-900" },
            정서: { bg: "bg-red-200", text: "text-red-900" },
            건강: { bg: "bg-red-200", text: "text-red-900" },
        };
        return colorMap[emotion] || { bg: "bg-gray-200", text: "text-gray-900" };
    };

    if (isLoading || !notification) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-white">
                <p className="text-gray-400">로딩 중...</p>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col bg-white">
            {/* 영상 편지 재생 */}
            <div className="relative h-[296px] w-full overflow-hidden bg-black">
                {seniorLog?.file_url ? (
                    <video
                        src={seniorLog.file_url}
                        controls
                        className="h-full w-full object-contain"
                        preload="metadata"
                    >
                        브라우저가 비디오 태그를 지원하지 않습니다.
                    </video>
                ) : (
                    <div className="flex h-full items-center justify-center">
                        <p className="text-gray-400">영상 없음</p>
                    </div>
                )}
                {/* 헤더 오버레이 */}
                <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-4">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center justify-center rounded-full bg-black/30 p-2 backdrop-blur-sm active:opacity-70"
                    >
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M19 12H5M5 12L12 19M5 12L12 5"
                                stroke="white"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </button>

                    <div className="flex items-center gap-2">
                        <span className="text-base font-semibold text-white">
                            {notification.userName}님
                        </span>
                        <span className="text-base font-semibold text-white/80">알림</span>
                    </div>

                    <div className="w-10" /> {/* 공간 맞춤 */}
                </div>
            </div>

            {/* 내용 */}
            <div className="flex-1 px-4 py-6">
                {/* 날짜 */}
                <div className="mb-2">
                    <p className="text-base font-semibold text-black">
                        {formatDate(notification.timestamp)}
                    </p>
                </div>

                {/* 질문 */}
                <div className="mb-4">
                    <p className="text-sm text-black leading-relaxed">오늘은 어때요?</p>
                </div>

                {/* 경고 배지 */}
                {seniorLog?.status_signal && (
                    <div className="mb-4">
                        <div className="rounded-xl border border-red-500/80 bg-red-500/40 px-4 py-2.5">
                            <p className="text-lg font-semibold text-[#c30000]">
                                🚨 즉시 확인 필요
                            </p>
                        </div>
                    </div>
                )}

                {/* 태그들 */}
                {seniorLog?.status_signal?.summary && (
                    <div className="mb-4 flex flex-wrap gap-2">
                        {seniorLog.status_signal.summary.split(/[,\s]+/).slice(0, 4).map((tag, index) => (
                            <div
                                key={index}
                                className="rounded-lg border border-black px-3 py-1.5"
                            >
                                <span className="text-xs text-black">{tag}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* 답변 */}
                <div className="mb-4">
                    <p className="mb-2 text-sm text-black leading-relaxed">
                        오늘은 어떤 상담?
                    </p>
                    <p className="text-sm text-black leading-relaxed">
                        💬 요즘 그럭저럭 지내고 있어요
                    </p>
                </div>

                {/* 감정 카드 */}
                {seniorLog?.emotion_type && (
                    <div className="mb-4">
                        <div className="rounded-xl bg-purple-200/60 flex items-center gap-3 px-4 py-4">
                            <span className="text-4xl">{getEmotionEmoji(seniorLog.emotion_type)}</span>
                            <span className="text-2xl text-blue-900">
                                {seniorLog.emotion_type}
                            </span>
                        </div>
                    </div>
                )}

                {/* 오늘은 000 님에게 */}
                <div className="mb-4">
                    <p className="text-sm text-black leading-relaxed">
                        오늘은 {notification.userName} 님에게
                    </p>
                </div>

                {/* 정서 카드 */}
                {seniorLog?.status_signal?.emotion && (
                    <div className="mb-4">
                        <div className="rounded-xl bg-red-200/60 flex items-start gap-3 px-4 py-4">
                            <span className="text-4xl">💔</span>
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-red-900 mb-1">
                                    보호자의 관심이 필요한 상황
                                </p>
                                <p className="text-2xl text-red-900 mb-1">정서</p>
                                <p className="text-xs text-black">
                                    💬 정기적인 안부 확인이 도움될 것 같습니다.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* 건강 카드 */}
                {seniorLog?.status_signal?.health && (
                    <div className="mb-4">
                        <div className="rounded-xl bg-red-200/60 flex items-start gap-3 px-4 py-4">
                            <span className="text-4xl">💔</span>
                            <div className="flex-1">
                                <p className="text-2xl text-red-900 mb-1">건강</p>
                                <p className="text-sm font-semibold text-red-900 leading-tight whitespace-pre-line">
                                    {seniorLog.status_signal.health}
                                </p>
                                <p className="text-xs text-black mt-1">
                                    💬 정기적인 안부 확인이 도움될 것 같습니다.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

