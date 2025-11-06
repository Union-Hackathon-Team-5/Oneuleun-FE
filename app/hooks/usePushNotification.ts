"use client";

import { useState, useEffect } from "react";

interface PushNotificationHook {
    isSupported: boolean;
    permission: NotificationPermission;
    requestPermission: () => Promise<boolean>;
    sendTestNotification: (title: string, body: string) => Promise<void>;
    sendServerPush: (
        title: string,
        body: string,
        url?: string
    ) => Promise<void>;
    isSubscribed: boolean;
}

export function usePushNotification(): PushNotificationHook {
    const [isSupported, setIsSupported] = useState(false);
    const [permission, setPermission] =
        useState<NotificationPermission>("default");
    const [isSubscribed, setIsSubscribed] = useState(false);

    useEffect(() => {
        // 브라우저 지원 여부 확인
        const supported =
            "Notification" in window &&
            "serviceWorker" in navigator &&
            "PushManager" in window;

        setIsSupported(supported);

        if (supported) {
            setPermission(Notification.permission);
            checkSubscription();
        }
    }, []);

    const checkSubscription = async () => {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription =
                await registration.pushManager.getSubscription();
            setIsSubscribed(!!subscription);
        } catch (error) {
            console.error("구독 확인 실패:", error);
        }
    };

    const requestPermission = async (): Promise<boolean> => {
        if (!isSupported) {
            alert("이 브라우저는 푸시 알림을 지원하지 않습니다.");
            return false;
        }

        try {
            const result = await Notification.requestPermission();
            setPermission(result);

            if (result === "granted") {
                await subscribeToPush();
                return true;
            }

            return false;
        } catch (error) {
            console.error("권한 요청 실패:", error);
            return false;
        }
    };

    const subscribeToPush = async () => {
        try {
            const registration = await navigator.serviceWorker.ready;

            const applicationServerKey = urlBase64ToUint8Array(
                process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ""
            );

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey:
                    applicationServerKey.length > 0
                        ? (applicationServerKey as BufferSource)
                        : undefined,
            });

            console.log("푸시 구독 완료:", subscription);

            // 서버에 구독 정보 전송
            const response = await fetch("/api/push/subscribe", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(subscription),
            });

            if (response.ok) {
                setIsSubscribed(true);
                console.log("서버에 구독 정보 저장 완료");
            } else {
                throw new Error("서버 구독 실패");
            }
        } catch (error) {
            console.error("푸시 구독 실패:", error);
            throw error;
        }
    };

    const sendTestNotification = async (title: string, body: string) => {
        if (permission !== "granted") {
            alert("알림 권한이 필요합니다!");
            return;
        }

        try {
            const registration = await navigator.serviceWorker.ready;

            // Service Worker를 통해 알림 표시
            await registration.showNotification(title, {
                body,
                icon: "/icon.svg",
                badge: "/icon.svg",
                data: {
                    url: "/",
                    timestamp: Date.now(),
                },
                actions: [
                    { action: "open", title: "열기" },
                    { action: "close", title: "닫기" },
                ],
            } as NotificationOptions);
        } catch (error) {
            console.error("알림 전송 실패:", error);
        }
    };

    const sendServerPush = async (
        title: string,
        body: string,
        url?: string
    ) => {
        if (!isSubscribed) {
            alert("먼저 알림을 구독해주세요!");
            return;
        }

        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription =
                await registration.pushManager.getSubscription();

            if (!subscription) {
                alert("구독 정보를 찾을 수 없습니다!");
                return;
            }

            // 서버를 통해 푸시 전송
            const response = await fetch("/api/push/send", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    subscription,
                    title,
                    body,
                    url: url || "/",
                }),
            });

            if (!response.ok) {
                throw new Error("서버 푸시 전송 실패");
            }

            console.log("서버 푸시 전송 완료");
        } catch (error) {
            console.error("서버 푸시 전송 실패:", error);
            throw error;
        }
    };

    return {
        isSupported,
        permission,
        requestPermission,
        sendTestNotification,
        sendServerPush,
        isSubscribed,
    };
}

// VAPID 키 변환 헬퍼 함수
function urlBase64ToUint8Array(base64String: string): Uint8Array {
    if (!base64String) {
        return new Uint8Array(0);
    }

    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, "+")
        .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
}
