import { NextRequest, NextResponse } from "next/server";

// 구독 정보 저장 (실제로는 데이터베이스에 저장해야 함)
const subscriptions = new Set<string>();

export async function POST(request: NextRequest) {
    try {
        const subscription = await request.json();

        // 구독 정보를 문자열로 변환하여 저장
        const subString = JSON.stringify(subscription);
        subscriptions.add(subString);

        console.log("새로운 푸시 구독:", subscription);
        console.log("총 구독자 수:", subscriptions.size);

        return NextResponse.json({
            success: true,
            message: "구독이 완료되었습니다",
        });
    } catch (error) {
        console.error("구독 실패:", error);
        return NextResponse.json(
            { success: false, error: "구독 실패" },
            { status: 500 }
        );
    }
}

// 현재 구독 정보 조회 (테스트용)
export async function GET() {
    return NextResponse.json({
        count: subscriptions.size,
        subscriptions: Array.from(subscriptions).map((s) => JSON.parse(s)),
    });
}
