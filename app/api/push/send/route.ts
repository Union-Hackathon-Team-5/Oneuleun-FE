import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";

// VAPID 키 설정
const vapidKeys = {
    publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "",
    privateKey: process.env.VAPID_PRIVATE_KEY || "",
};

webpush.setVapidDetails(
    "mailto:your-email@example.com",
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

export async function POST(request: NextRequest) {
    try {
        const { subscription, title, body, url, userName } = await request.json();

        if (!subscription) {
            return NextResponse.json(
                { success: false, error: "구독 정보가 없습니다" },
                { status: 400 }
            );
        }

        const payload = JSON.stringify({
            title: title || "오늘은?",
            body: body || "새로운 알림이 도착했습니다",
            url: url || "/",
            userName: userName || null, // userName 전달
            icon: "/icon.svg",
            badge: "/icon.svg",
        });

        await webpush.sendNotification(subscription, payload);

        console.log("푸시 알림 전송 완료:", { title, body, userName });

        return NextResponse.json({
            success: true,
            message: "알림이 전송되었습니다",
        });
    } catch (error) {
        console.error("푸시 알림 전송 실패:", error);
        return NextResponse.json(
            { success: false, error: "알림 전송 실패" },
            { status: 500 }
        );
    }
}
