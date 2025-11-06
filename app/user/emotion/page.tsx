"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function EmotionPage() {
    const router = useRouter();
    const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);

    const emotions = [
        { id: "joy", label: "기쁨", emoji: "😊" },
        { id: "happy", label: "행복", emoji: "😄" },
        { id: "angry", label: "화남", emoji: "😠" },
        { id: "sad", label: "슬픔", emoji: "😢" },
        { id: "tired", label: "무기력함", emoji: "😔" },
        { id: "lonely", label: "외로움", emoji: "😐" },
    ];

    const handleEmotionSelect = (emotionId: string, emotionLabel: string) => {
        setSelectedEmotion(emotionId);
        // 선택 후 다음 페이지로 이동
        setTimeout(() => {
            router.push(
                `/user/recommendation?emotion=${encodeURIComponent(emotionLabel)}`
            );
        }, 300);
    };

    return (
        <div className="flex min-h-screen flex-col bg-white">
            {/* 단계 인디케이터 (2/3) */}
            <div className="flex items-center justify-center gap-3 py-3">
                <div className="bg-primary h-2 w-2 rounded-full" />
                <div className="bg-primary h-2 w-2 rounded-full" />
                <div className="h-2 w-2 rounded-full bg-gray-50" />
            </div>

            {/* 메인 컨텐츠 */}
            <div className="flex flex-1 flex-col px-6 pt-12">
                {/* 제목 */}
                <h1 className="mb-12 text-[18px] leading-[25px] font-semibold text-black">
                    본인의 현재 감정을 선택해주세요
                </h1>

                {/* 감정 선택 버튼 그룹 */}
                <div className="flex flex-col gap-3">
                    {emotions.map((emotion) => (
                        <button
                            key={emotion.id}
                            onClick={() =>
                                handleEmotionSelect(emotion.id, emotion.label)
                            }
                            className={`flex h-[88px] w-full items-center gap-6 rounded-xl border-2 bg-white px-6 transition-all ${
                                selectedEmotion === emotion.id
                                    ? "border-primary bg-[#fef9f2]"
                                    : "border-primary hover:bg-[#fef9f2]"
                            }`}
                        >
                            {/* 이모티콘 */}
                            <div className="flex h-16 w-16 items-center justify-center text-5xl">
                                {emotion.emoji}
                            </div>

                            {/* 감정 텍스트 */}
                            <span className="text-primary text-2xl font-normal">
                                {emotion.label}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
