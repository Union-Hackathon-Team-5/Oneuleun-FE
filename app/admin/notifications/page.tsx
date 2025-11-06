"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Notification {
    id: number;
    userName: string;
    title: string;
    description: string;
    isRead: boolean;
    timestamp?: number;
}

const STORAGE_KEY = "notifications";

export default function AdminNotificationsPage() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);

    // 로컬 스토리지에서 알림 목록 불러오기
    useEffect(() => {
        const loadNotifications = () => {
            try {
                const stored = localStorage.getItem(STORAGE_KEY);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    // 최신순으로 정렬
                    const sorted = parsed.sort((a: Notification, b: Notification) => 
                        (b.timestamp || 0) - (a.timestamp || 0)
                    );
                    setNotifications(sorted);
                } else {
                    // 초기 샘플 데이터
                    const sampleNotifications: Notification[] = [
                        {
                            id: 1,
                            userName: "홍길동",
                            title: "홍길동님의 영상 편지가 도착했어요",
                            description: "하루하루 반복되는 일상 속에서도, 노인분...",
                            isRead: false,
                            timestamp: Date.now() - 86400000,
                        },
                        {
                            id: 2,
                            userName: "김철수",
                            title: "김철수님의 영상 편지가 도착했어요",
                            description: "하루하루 반복되는 일상 속에서도, 노인분...",
                            isRead: false,
                            timestamp: Date.now() - 172800000,
                        },
                    ];
                    setNotifications(sampleNotifications);
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleNotifications));
                }
            } catch (error) {
                console.error("알림 목록 불러오기 실패:", error);
            }
        };

        loadNotifications();

        // Service Worker로부터 푸시 알림 수신 리스너
        const setupServiceWorkerListener = async () => {
            if ("serviceWorker" in navigator) {
                try {
                    const registration = await navigator.serviceWorker.ready;
                    
                    // Service Worker 메시지 리스너
                    navigator.serviceWorker.addEventListener("message", (event) => {
                        if (event.data && event.data.type === "PUSH_NOTIFICATION") {
                            const newNotification = event.data.notification;
                            
                            // 로컬 스토리지에 저장
                            const stored = localStorage.getItem(STORAGE_KEY);
                            const existing = stored ? JSON.parse(stored) : [];
                            const updated = [newNotification, ...existing];
                            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                            
                            // 상태 업데이트 (최신순 정렬)
                            const sorted = updated.sort((a: Notification, b: Notification) => 
                                (b.timestamp || 0) - (a.timestamp || 0)
                            );
                            setNotifications(sorted);
                        }
                    });
                } catch (error) {
                    console.error("Service Worker 리스너 설정 실패:", error);
                }
            }
        };

        setupServiceWorkerListener();
    }, []);

    return (
        <div className="flex min-h-screen flex-col bg-white">
            {/* 헤더 */}
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4 bg-white">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-gray-50 active:bg-gray-100"
                >
                    <svg
                        width="20"
                        height="20"
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
                            className="text-gray-500"
                        />
                    </svg>
                    <span className="text-sm text-gray-500">뒤로</span>
                </button>

                <h1 className="text-lg font-semibold text-black">알림</h1>

                <div className="w-16" /> {/* 공간 맞춤 */}
            </div>

            {/* 알림 리스트 */}
            <div className="flex-1">
                {notifications.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-gray-400">알림이 없습니다</p>
                    </div>
                ) : (
                    notifications.map((notification, index) => (
                        <button
                            key={notification.id}
                            onClick={() => router.push(`/admin/notifications/${notification.id}`)}
                            className={`w-full border-b border-gray-100 text-left transition-colors ${
                                index === 0 ? "border-t border-gray-100" : ""
                            } hover:bg-gray-50 active:bg-gray-100`}
                        >
                            <div className="flex items-start gap-4 px-4 py-5">
                                {/* 로고 아이콘 */}
                                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary shadow-sm">
                                    <span 
                                        className="font-dangdang text-[8px] leading-[9.68px] text-[#f5daa7]"
                                        style={{
                                            fontFamily: "Cafe24 Dangdanghae, sans-serif",
                                        }}
                                    >
                                        오늘은?
                                    </span>
                                </div>

                                {/* 알림 내용 */}
                                <div className="flex-1">
                                    <h3 className="text-base font-semibold text-black leading-tight mb-1">
                                        {notification.title}
                                    </h3>
                                    <p className="text-sm text-gray-500 leading-relaxed">
                                        {notification.description}
                                    </p>
                                </div>
                            </div>
                        </button>
                    ))
                )}
            </div>
        </div>
    );
}

