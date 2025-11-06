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
            <div className="flex items-center justify-center gap-3 border-b border-gray-100 py-4 px-4 bg-white">
                <div className="bg-primary h-2.5 w-2.5 rounded-full shadow-sm" />
                <div className="bg-primary h-2.5 w-2.5 rounded-full shadow-sm" />
                <div className="h-2.5 w-2.5 rounded-full bg-gray-200" />
            </div>

            {/* 메인 컨텐츠 */}
            <div className="flex flex-1 flex-col px-6 pt-8 pb-6">
                {/* 제목 */}
                <h1 className="mb-10 text-lg font-semibold text-black leading-tight">
                    본인의 현재 감정을 선택해주세요
                </h1>

                {/* 감정 선택 버튼 그룹 */}
                <div className="flex flex-col gap-4">
                    {emotions.map((emotion) => (
                        <button
                            key={emotion.id}
                            onClick={() =>
                                handleEmotionSelect(emotion.id, emotion.label)
                            }
                            className={`flex h-[72px] w-full items-center gap-4 rounded-xl border-2 bg-white px-5 shadow-sm transition-all hover:shadow-md active:scale-[0.98] ${
                                selectedEmotion === emotion.id
                                    ? "border-primary bg-primary/5 shadow-md"
                                    : "border-gray-200 hover:border-primary/50"
                            }`}
                        >
                            {/* 이모티콘 */}
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50 text-4xl">
                                {emotion.emoji}
                            </div>

                            {/* 감정 텍스트 */}
                            <span className={`text-xl font-medium transition-colors ${
                                selectedEmotion === emotion.id
                                    ? "text-primary"
                                    : "text-gray-700"
                            }`}>
                                {emotion.label}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
