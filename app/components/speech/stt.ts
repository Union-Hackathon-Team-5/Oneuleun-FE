"use client";

import { useState } from "react";
import {
    SpeechRecognitionErrorEvent,
    SpeechRecognitionEvent,
} from "@/app/types/tts";

export default function STT() {
    const [listening, setListening] = useState(false);
    const [text, setText] = useState("");
    const [error, setError] = useState("");

    // 🎤 음성 인식 시작
    const startListening = () => {
        // 브라우저 호환성 체크
        if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
            setError("이 브라우저는 음성 인식을 지원하지 않습니다.");
            return;
        }

        const SpeechRecognition =
            window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.lang = "ko-KR";
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
            setListening(true);
            setError("");
        };
        recognition.onend = () => setListening(false);

        recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
            console.error("음성 인식에 실패했습니다: ", e);
            setListening(false);

            switch (e.error) {
                case "audio-capture":
                    setError("마이크를 찾을 수 없습니다.");
                    break;
                case "not-allowed":
                    setError("마이크 권한이 거부되었습니다.");
                    break;
                case "network":
                    setError("네트워크 오류가 발생했습니다.");
                    break;
                default:
                    setError(`음성 인식에 실패했습니다: ${e.error}`);
            }

            setListening(false);
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            const transcript = event.results[0][0].transcript;
            setText(transcript);
            setError("");
        };

        recognition.start();
    };
}
