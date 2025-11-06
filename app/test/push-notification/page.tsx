"use client";

import { useState } from "react";
import { usePushNotification } from "@/app/hooks/usePushNotification";
import Button from "@/app/components/common/button";

export default function PushNotificationTestPage() {
    const {
        isSupported,
        permission,
        requestPermission,
        sendTestNotification,
        sendServerPush,
        isSubscribed,
    } = usePushNotification();

    const [title, setTitle] = useState("오늘은?");
    const [body, setBody] = useState("새로운 알림이 도착했습니다! 🎉");
    const [sending, setSending] = useState(false);

    const handleRequestPermission = async () => {
        const granted = await requestPermission();
        if (granted) {
            alert("알림 권한이 허용되었습니다! 🎉");
        } else {
            alert("알림 권한이 거부되었습니다.");
        }
    };

    const handleSendNotification = async () => {
        await sendTestNotification(title, body);
    };

    const handleSendServerPush = async () => {
        setSending(true);
        try {
            await sendServerPush(title, body, "/");
            alert("서버 푸시가 전송되었습니다! 🎉");
        } catch (error) {
            alert("서버 푸시 전송 실패: " + error);
        } finally {
            setSending(false);
        }
    };

    const getPermissionStatus = () => {
        switch (permission) {
            case "granted":
                return { text: "허용됨 ✅", color: "text-green-600" };
            case "denied":
                return { text: "거부됨 ❌", color: "text-red-600" };
            default:
                return { text: "대기 중 ⏳", color: "text-gray-600" };
        }
    };

    const permissionStatus = getPermissionStatus();

    return (
        <div className="flex min-h-screen flex-col bg-white">
            <div className="flex-1 py-6">
                <h1 className="text-title-small mb-6">푸시 알림 테스트</h1>

                {/* 지원 여부 */}
                <div className="mb-6 rounded-lg bg-gray-50 p-4">
                    <h2 className="text-body2 mb-2">브라우저 지원</h2>
                    <p
                        className={`text-body3 ${isSupported ? "text-green-600" : "text-red-600"}`}
                    >
                        {isSupported
                            ? "✅ 푸시 알림 지원"
                            : "❌ 푸시 알림 미지원"}
                    </p>
                </div>

                {/* 권한 상태 */}
                <div className="mb-6 rounded-lg bg-gray-50 p-4">
                    <h2 className="text-body2 mb-2">알림 권한</h2>
                    <p className={`text-body3 ${permissionStatus.color}`}>
                        {permissionStatus.text}
                    </p>
                    <p className="text-caption mt-1 text-gray-500">
                        구독 상태: {isSubscribed ? "구독 중 ✓" : "미구독"}
                    </p>
                </div>

                {/* 권한 요청 버튼 */}
                {permission !== "granted" && isSupported && (
                    <div className="mb-6">
                        <Button
                            className="h-[52px] w-full"
                            onClick={handleRequestPermission}
                        >
                            🔔 알림 권한 요청
                        </Button>
                    </div>
                )}

                {/* 알림 테스트 */}
                {permission === "granted" && (
                    <div className="space-y-4">
                        <h2 className="text-body2">알림 보내기</h2>

                        <div>
                            <label
                                htmlFor="title"
                                className="text-body4 mb-2 block"
                            >
                                제목
                            </label>
                            <input
                                id="title"
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="text-body3 focus:ring-primary w-full rounded-lg border border-gray-300 p-3 outline-none focus:ring-2"
                                placeholder="알림 제목"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="body"
                                className="text-body4 mb-2 block"
                            >
                                내용
                            </label>
                            <textarea
                                id="body"
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                className="text-body3 focus:ring-primary w-full rounded-lg border border-gray-300 p-3 outline-none focus:ring-2"
                                placeholder="알림 내용"
                                rows={3}
                            />
                        </div>

                        <Button
                            className="h-[52px] w-full"
                            onClick={handleSendNotification}
                        >
                            📨 로컬 테스트 알림 (즉시)
                        </Button>

                        <Button
                            variant="secondary"
                            className="h-[52px] w-full"
                            onClick={handleSendServerPush}
                            isActive={!sending}
                        >
                            {sending
                                ? "전송 중..."
                                : "🚀 서버 푸시 알림 (실제)"}
                        </Button>
                    </div>
                )}

                {/* 사용 안내 */}
                <div className="mt-8 rounded-lg bg-blue-50 p-4">
                    <h3 className="text-body4 mb-2">📌 사용 방법</h3>
                    <ol className="text-caption space-y-1 text-gray-700">
                        <li>1. "알림 권한 요청" 버튼 클릭</li>
                        <li>2. 브라우저 권한 팝업에서 "허용" 선택</li>
                        <li>3. 제목과 내용 입력</li>
                        <li>
                            4-A. "로컬 테스트 알림" - 즉시 표시 (클라이언트만)
                        </li>
                        <li>
                            4-B. "서버 푸시 알림" - 서버를 통해 전송 (실제 푸시)
                        </li>
                        <li>5. 알림이 표시됨!</li>
                    </ol>

                    <div className="text-caption mt-3 text-gray-600">
                        <p className="font-semibold">💡 차이점:</p>
                        <ul className="ml-4 list-disc space-y-1">
                            <li>
                                <strong>로컬:</strong> 현재 브라우저에서만 즉시
                                표시
                            </li>
                            <li>
                                <strong>서버:</strong> VAPID 키로 실제 푸시 전송
                            </li>
                            <li>서버 푸시는 앱이 닫혀있어도 전송 가능</li>
                        </ul>
                    </div>

                    <div className="text-caption mt-3 text-gray-600">
                        <p className="font-semibold">🔧 참고사항:</p>
                        <ul className="ml-4 list-disc space-y-1">
                            <li>Chrome/Edge에서 완벽 지원</li>
                            <li>Safari는 iOS 16.4+ 지원</li>
                            <li>PWA로 설치 시 더 잘 작동</li>
                            <li>HTTPS 또는 localhost 필요</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
