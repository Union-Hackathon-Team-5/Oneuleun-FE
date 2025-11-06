"use client";

import { useCallback, useRef } from "react";

export function useTTS() {
    const synthRef = useRef<SpeechSynthesis | null>(null);

    const speak = useCallback((text: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            console.log("[useTTS] speak 호출됨, text:", text);
            
            if (typeof window === "undefined") {
                console.error("[useTTS] window가 undefined입니다");
                reject(new Error("TTS를 지원하지 않는 브라우저입니다."));
                return;
            }
            
            if (!window.speechSynthesis) {
                console.error("[useTTS] speechSynthesis가 지원되지 않습니다");
                reject(new Error("TTS를 지원하지 않는 브라우저입니다."));
                return;
            }

            console.log("[useTTS] 이전 재생 중지");
            // 이전 재생 중지
            window.speechSynthesis.cancel();
            
            // 약간의 지연으로 브라우저가 오디오를 준비할 시간 제공
            setTimeout(() => {
                try {
                    console.log("[useTTS] SpeechSynthesisUtterance 생성 중...");
                    const utterance = new SpeechSynthesisUtterance(text);
                    utterance.lang = "ko-KR";
                    utterance.rate = 0.9; // 속도 조절
                    utterance.pitch = 1.0;
                    utterance.volume = 1.0; // 최대 볼륨

                    utterance.onstart = () => {
                        console.log("[useTTS] TTS 재생 시작:", text);
                    };

                    utterance.onend = () => {
                        console.log("[useTTS] TTS 재생 완료");
                        resolve();
                    };

                    utterance.onerror = (error) => {
                        console.error("[useTTS] TTS 재생 오류:", error);
                        reject(error);
                    };

                    synthRef.current = window.speechSynthesis;
                    console.log("[useTTS] speechSynthesis.speak() 호출");
                    window.speechSynthesis.speak(utterance);
                } catch (error) {
                    console.error("[useTTS] TTS 초기화 오류:", error);
                    reject(error);
                }
            }, 100);
        });
    }, []);

    const stop = useCallback(() => {
        if (typeof window !== "undefined" && window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
    }, []);

    return { speak, stop };
}

