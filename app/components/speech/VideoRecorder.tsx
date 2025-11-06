"use client";

import { useState, useRef, useEffect } from "react";
import Button from "@/app/components/common/button";

interface RecognitionResult {
    transcript: string;
    timestamp: number;
}

// Web Speech API 타입 정의
interface SpeechRecognitionErrorEvent extends Event {
    error: string;
    message: string;
}

interface SpeechRecognitionEvent extends Event {
    resultIndex: number;
    results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
    length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
    length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
    isFinal: boolean;
}

interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
}

interface SpeechRecognition extends EventTarget {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    maxAlternatives: number;
    start(): void;
    stop(): void;
    abort(): void;
    onerror:
        | ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any)
        | null;
    onresult:
        | ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any)
        | null;
    onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onend: ((this: SpeechRecognition, ev: Event) => any) | null;
}

interface SpeechRecognitionConstructor {
    new (): SpeechRecognition;
    prototype: SpeechRecognition;
}

declare global {
    interface Window {
        SpeechRecognition: SpeechRecognitionConstructor;
        webkitSpeechRecognition: SpeechRecognitionConstructor;
    }
}

export default function VideoRecorder() {
    const [isRecording, setIsRecording] = useState(false);
    const [transcripts, setTranscripts] = useState<RecognitionResult[]>([]);
    const [currentTranscript, setCurrentTranscript] = useState("");
    const [error, setError] = useState("");

    const videoRef = useRef<HTMLVideoElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    // 컴포넌트 언마운트 시 정리
    useEffect(() => {
        return () => {
            stopRecording();
        };
    }, []);

    const startRecording = async () => {
        try {
            setError("");

            // 웹캠 + 마이크 접근
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
            });

            streamRef.current = stream;

            // 비디오 미리보기
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }

            // 비디오 녹화 시작
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, {
                    type: "video/webm",
                });
                // 여기서 서버에 업로드하거나 다운로드 가능
                console.log("녹화 완료:", blob);
            };

            mediaRecorder.start();

            // 음성 인식 시작
            if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
                throw new Error("음성 인식을 지원하지 않는 브라우저입니다.");
            }

            const SpeechRecognition =
                window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();

            recognition.lang = "ko-KR";
            recognition.continuous = true; // 계속 듣기
            recognition.interimResults = true; // 중간 결과도 표시

            recognition.onresult = (event: SpeechRecognitionEvent) => {
                let interimTranscript = "";
                let finalTranscript = "";

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript;
                    } else {
                        interimTranscript += transcript;
                    }
                }

                if (finalTranscript) {
                    setTranscripts((prev) => [
                        ...prev,
                        {
                            transcript: finalTranscript,
                            timestamp: Date.now(),
                        },
                    ]);
                    setCurrentTranscript("");
                } else {
                    setCurrentTranscript(interimTranscript);
                }
            };

            recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
                console.error("음성 인식 에러:", e);
                setError(`음성 인식 오류: ${e.error}`);
            };

            recognition.start();
            recognitionRef.current = recognition;

            setIsRecording(true);
        } catch (err) {
            console.error("녹화 시작 실패:", err);
            setError(
                err instanceof Error
                    ? err.message
                    : "카메라/마이크 접근에 실패했습니다."
            );
        }
    };

    const stopRecording = () => {
        // 비디오 녹화 중지
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current = null;
        }

        // 음성 인식 중지
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }

        // 스트림 정리
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }

        // 비디오 미리보기 정리
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        setIsRecording(false);
        setCurrentTranscript("");
    };

    return (
        <div className="flex min-h-screen flex-col bg-white">
            <div className="flex-1 py-6">
                <h1 className="text-title-small mb-6">
                    비디오 녹화 + 음성 변환
                </h1>

                {/* 비디오 미리보기 */}
                <div className="mb-6 overflow-hidden rounded-lg bg-gray-900">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="h-[400px] w-full object-cover"
                    />
                </div>

                {/* 에러 메시지 */}
                {error && (
                    <div className="mb-4 rounded-lg bg-red-100 p-4 text-red-700">
                        ⚠️ {error}
                    </div>
                )}

                {/* 현재 인식 중인 텍스트 (임시) */}
                {currentTranscript && (
                    <div className="mb-4 rounded-lg bg-gray-100 p-4">
                        <p className="text-body5 mb-1 text-gray-500">
                            인식 중...
                        </p>
                        <p className="text-body3 text-gray-600">
                            {currentTranscript}
                        </p>
                    </div>
                )}

                {/* 인식된 텍스트 목록 */}
                <div className="mb-4 space-y-2">
                    <h2 className="text-body2 mb-2">인식된 텍스트</h2>
                    {transcripts.length === 0 ? (
                        <p className="text-body5 text-gray-400">
                            아직 인식된 텍스트가 없습니다
                        </p>
                    ) : (
                        <div className="max-h-[300px] space-y-2 overflow-y-auto">
                            {transcripts.map((item, index) => (
                                <div
                                    key={index}
                                    className="rounded-lg bg-gray-50 p-3"
                                >
                                    <p className="text-body3">
                                        {item.transcript}
                                    </p>
                                    <p className="text-caption mt-1 text-gray-400">
                                        {new Date(
                                            item.timestamp
                                        ).toLocaleTimeString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* 버튼 */}
            <div className="pb-8">
                {!isRecording ? (
                    <Button
                        className="h-[52px] w-full"
                        onClick={startRecording}
                    >
                        🎥 녹화 시작
                    </Button>
                ) : (
                    <Button
                        className="h-[52px] w-full"
                        variant="secondary"
                        onClick={stopRecording}
                    >
                        ⏹️ 녹화 중지
                    </Button>
                )}
            </div>
        </div>
    );
}
