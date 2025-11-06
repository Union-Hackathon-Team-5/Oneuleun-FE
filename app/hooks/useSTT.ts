"use client";

import { useCallback, useRef } from "react";
import type {
    SpeechRecognition,
    SpeechRecognitionErrorEvent,
    SpeechRecognitionEvent,
} from "@/app/types/tts";

export function useSTT() {
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    const listen = useCallback((timeout: number = 10000): Promise<string> => {
        return new Promise((resolve, reject) => {
            // 브라우저 호환성 체크
            if (
                typeof window === "undefined" ||
                (!window.SpeechRecognition && !window.webkitSpeechRecognition)
            ) {
                reject(new Error("이 브라우저는 음성 인식을 지원하지 않습니다."));
                return;
            }

            const SpeechRecognition =
                window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();

            recognition.lang = "ko-KR";
            recognition.continuous = true; // 연속 인식 모드 (사용자가 말하는 동안 계속 듣기)
            recognition.interimResults = true; // 중간 결과도 받기
            recognition.maxAlternatives = 1;

            let finalTranscript = "";
            let hasSpeech = false; // 음성이 감지되었는지 추적
            let speechTimeoutId: NodeJS.Timeout | null = null;

            // 전체 타임아웃 설정 (음성이 없을 때만 적용)
            const timeoutId = setTimeout(() => {
                if (!hasSpeech) {
                    // 음성이 전혀 감지되지 않았을 때만 타임아웃
                    recognition.stop();
                    recognition.abort();
                    reject(new Error("답변 시간이 초과되었습니다."));
                }
            }, timeout);

            // 음성 감지 후 추가 대기 시간 (사용자가 말을 마칠 때까지)
            const resetSpeechTimeout = () => {
                if (speechTimeoutId) {
                    clearTimeout(speechTimeoutId);
                }
                speechTimeoutId = setTimeout(() => {
                    // 2초 동안 추가 음성이 없으면 종료
                    if (finalTranscript.trim()) {
                        clearTimeout(timeoutId);
                        recognition.stop();
                    }
                }, 2000);
            };

            recognition.onstart = () => {
                console.log("[useSTT] 음성 인식 시작");
            };

            recognition.onend = () => {
                clearTimeout(timeoutId);
                if (speechTimeoutId) {
                    clearTimeout(speechTimeoutId);
                }
                console.log("[useSTT] 음성 인식 종료, 최종 텍스트:", finalTranscript);
                if (finalTranscript.trim()) {
                    resolve(finalTranscript.trim());
                } else {
                    reject(new Error("음성이 감지되지 않았습니다."));
                }
            };

            recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
                clearTimeout(timeoutId);
                if (speechTimeoutId) {
                    clearTimeout(speechTimeoutId);
                }
                console.error("[useSTT] 음성 인식 오류:", e.error);
                
                // no-speech 에러는 음성이 없었을 때만 처리
                if (e.error === "no-speech" && !hasSpeech) {
                    reject(new Error("음성이 감지되지 않았습니다."));
                    return;
                }
                
                // aborted는 사용자가 중단한 경우이므로 무시
                if (e.error === "aborted") {
                    return;
                }
                
                let errorMessage = "음성 인식에 실패했습니다.";
                switch (e.error) {
                    case "audio-capture":
                        errorMessage = "마이크를 찾을 수 없습니다.";
                        break;
                    case "not-allowed":
                        errorMessage = "마이크 권한이 거부되었습니다.";
                        break;
                    case "network":
                        errorMessage = "네트워크 오류가 발생했습니다.";
                        break;
                    default:
                        errorMessage = `음성 인식에 실패했습니다: ${e.error}`;
                }
                
                reject(new Error(errorMessage));
            };

            recognition.onresult = (event: SpeechRecognitionEvent) => {
                // 타임아웃 리셋 (음성이 감지되었으므로)
                clearTimeout(timeoutId);
                hasSpeech = true;
                
                let interimTranscript = "";
                let finalTranscriptPart = "";

                // 모든 결과 처리
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscriptPart += transcript + " ";
                    } else {
                        interimTranscript += transcript;
                    }
                }

                if (finalTranscriptPart) {
                    finalTranscript += finalTranscriptPart;
                    console.log("[useSTT] 최종 텍스트 업데이트:", finalTranscript);
                    resetSpeechTimeout(); // 추가 음성 대기 시간 리셋
                } else if (interimTranscript) {
                    console.log("[useSTT] 중간 텍스트:", interimTranscript);
                    resetSpeechTimeout(); // 추가 음성 대기 시간 리셋
                }
            };

            recognitionRef.current = recognition;
            recognition.start();
        });
    }, []);

    const stop = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current.abort();
        }
    }, []);

    return { listen, stop };
}

