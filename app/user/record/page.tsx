"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { recordingService } from "@/app/lib/api/recording";
import { analyzeService } from "@/app/lib/api/analyze";
import { logService } from "@/app/lib/api/log";
import { useAuth } from "@/app/hooks/useAuth";
import { useTTS } from "@/app/hooks/useTTS";
import { useSTT } from "@/app/hooks/useSTT";
import type { AnalyzeUploadResponse } from "@/app/types/api";
import { EmotionType } from "@/app/types/api";

interface ConversationEntry {
    question: string;
    answer: string;
    timestamp: string;
}

export default function UserRecordPage() {
    const router = useRouter();
    const { user } = useAuth();
    const { speak, stop: stopTTS } = useTTS();
    const { listen, stop: stopSTT } = useSTT();
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const isRecordingRef = useRef(false); // 클로저 문제 방지용
    const [stream, setStream] = useState<MediaStream | null>(null);
    const streamRef = useRef<MediaStream | null>(null); // cleanup에서 최신 스트림 참조용
    const [snapshot, setSnapshot] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const recordedBlobRef = useRef<Blob | null>(null);
    
    // 대화 기록
    const [conversations, setConversations] = useState<ConversationEntry[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const isProcessingRef = useRef(false); // 중복 호출 방지
    const hasStartedQuestionsRef = useRef(false); // 질문 시작 여부 추적
    
    // 질문 리스트
    const questions = [
        "오늘 하루는 어떠셨나요?",
        "오늘 무엇을 하셨나요?",
        "기분은 어떤가요?",
        "몸은 편안하신가요?",
        "오늘 특별히 기억에 남는 일이 있으신가요?",
    ];

    useEffect(() => {
        console.log("[컴포넌트] 마운트됨, 웹캠 시작 시도");
        
        // 웹캠 시작
        const startWebcam = async () => {
            try {
                console.log("[웹캠] getUserMedia 호출 중...");
                const mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 1920 },
                        height: { ideal: 1080 },
                        facingMode: "user",
                    },
                    audio: true,
                });

                console.log("[웹캠] getUserMedia 성공, 스트림 받음");
                
                if (videoRef.current) {
                    console.log("[웹캠] videoRef에 스트림 할당");
                    videoRef.current.srcObject = mediaStream;
                    // 비디오 재생 명시적 호출 (깜빡임 방지)
                    videoRef.current.play().catch((err) => {
                        console.error("[웹캠] 비디오 재생 오류:", err);
                    });
                } else {
                    console.warn("[웹캠] videoRef.current가 null입니다");
                }
                
                setStream(mediaStream);
                streamRef.current = mediaStream; // ref에도 저장
                console.log("[웹캠] 스트림 설정 완료");
                // useEffect에서 stream이 설정되면 자동으로 녹화 시작됨
            } catch (error) {
                console.error("[웹캠] 접근 오류:", error);
                alert("웹캠에 접근할 수 없습니다. 권한을 확인해주세요.");
            }
        };

        startWebcam();

        return () => {
            // 컴포넌트 언마운트 시 스트림 정리 (최신 스트림 참조)
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
                streamRef.current = null;
            }
            // TTS/STT 정리
            stopTTS();
            stopSTT();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // 빈 배열로 변경하여 마운트 시 한 번만 실행

    const captureSnapshot = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const video = videoRef.current;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext("2d");
        if (ctx) {
            ctx.drawImage(video, 0, 0);
            const imageData = canvas.toDataURL("image/jpeg");
            setSnapshot(imageData);
        }
    };

    const uploadToServer = async (blob: Blob) => {
        try {
            const sessionId = recordingService.generateSessionId();
            const userId = user?.id || `temp-user-${Date.now()}`;

            const result = await recordingService.uploadContext(
                sessionId,
                userId,
                blob
            );

            console.log("업로드 성공:", result);
            return result;
        } catch (error) {
            console.error("업로드 오류:", error);
            alert("녹화 업로드에 실패했습니다.");
            throw error;
        }
    };

    // 대화 내용을 문자열로 변환
    const formatConversation = (conversations: ConversationEntry[]): string => {
        return conversations
            .map((conv) => `AI: ${conv.question}\n사용자: ${conv.answer}`)
            .join("\n\n");
    };

    // 질문하기
    const askQuestion = async (question: string): Promise<void> => {
        try {
            setIsSpeaking(true);
            console.log("TTS 질문 시작:", question);
            await speak(question);
            console.log("TTS 질문 완료");
            setIsSpeaking(false);
        } catch (error) {
            console.error("TTS 오류:", error);
            setIsSpeaking(false);
            // TTS 오류 발생 시에도 다음 단계로 진행 (사용자 경험 유지)
            // 소리가 나지 않을 수 있으므로 시각적 피드백으로 대체
            alert("음성 안내가 작동하지 않습니다. 화면의 질문을 확인해주세요.");
        }
    };

    // 답변 듣기
    const listenAnswer = async (): Promise<string> => {
        try {
            setIsListening(true);
            // 10초 타임아웃 설정 (사용자가 말을 시작하면 더 길게 대기)
            // 실제로는 사용자가 말을 시작하면 자동으로 연장됨
            const answer = await listen(10000);
            setIsListening(false);
            console.log("[listenAnswer] 인식된 답변:", answer);
            return answer;
        } catch (error) {
            console.error("[listenAnswer] STT 오류:", error);
            setIsListening(false);
            
            // 타임아웃만 "[답변이 없었습니다]"로 처리
            // 다른 에러는 재시도하거나 실제 에러로 처리
            if (error instanceof Error && error.message.includes("초과")) {
                console.log("[listenAnswer] 타임아웃 - 답변이 없었습니다");
                return "[답변이 없었습니다]";
            }
            
            // no-speech 에러는 실제로 음성이 없었을 때만 처리
            if (error instanceof Error && error.message.includes("감지되지")) {
                console.log("[listenAnswer] 음성 미감지 - 답변이 없었습니다");
                return "[답변이 없었습니다]";
            }
            
            // 다른 에러는 다시 시도하거나 실제 에러로 처리
            console.error("[listenAnswer] 예상치 못한 에러:", error);
            throw error;
        }
    };

    // 질문-답변 흐름 처리
    const processQuestionAnswer = async (questionIndex: number) => {
        console.log("[processQuestionAnswer] 시작", {
            questionIndex,
            isProcessing: isProcessingRef.current,
            isRecording: isRecordingRef.current,
        });
        
        // 중복 호출 방지
        if (isProcessingRef.current) {
            console.log("[processQuestionAnswer] 이미 처리 중이므로 중단");
            return;
        }
        
        // 첫 질문(questionIndex === 0)은 녹화 시작 전에도 실행 가능
        // 이후 질문들은 녹화 중일 때만 실행
        if (questionIndex > 0 && !isRecordingRef.current) {
            console.log("[processQuestionAnswer] 녹화 중이 아니므로 중단");
            return;
        }

        if (questionIndex >= questions.length) {
            // 모든 질문이 끝났으면 녹화 중지
            isProcessingRef.current = false;
            if (mediaRecorderRef.current) {
                mediaRecorderRef.current.stop();
            }
            setIsRecording(false);
            isRecordingRef.current = false;
            return;
        }

        isProcessingRef.current = true;
        const question = questions[questionIndex];
        console.log("[processQuestionAnswer] 질문 시작:", question);
        
        try {
            // 첫 질문은 녹화 시작 전에도 실행 가능
            // 이후 질문들은 녹화 중일 때만 실행
            if (questionIndex > 0 && !isRecordingRef.current) {
                console.log("[processQuestionAnswer] 질문 전 녹화 중지됨");
                isProcessingRef.current = false;
                return;
            }
            
            // 1. 질문하기 (TTS)
            console.log("[processQuestionAnswer] TTS 호출 전");
            await askQuestion(question);
            console.log("[processQuestionAnswer] TTS 호출 완료");
            
            // 녹화 중지 체크 (질문 후)
            if (!isRecordingRef.current) {
                console.log("[processQuestionAnswer] 질문 후 녹화 중지됨");
                isProcessingRef.current = false;
                return;
            }
            
            // 2. 답변 듣기 (STT)
            const answer = await listenAnswer();
            
            // 녹화 중지 체크 (답변 후)
            if (!isRecordingRef.current) {
                isProcessingRef.current = false;
                return;
            }
            
            // 3. 대화 기록 저장
            const conversationEntry: ConversationEntry = {
                question,
                answer,
                timestamp: new Date().toISOString(),
            };
            
            setConversations((prev) => [...prev, conversationEntry]);
            
            // 4. 다음 질문으로
            setCurrentQuestionIndex(questionIndex + 1);
            isProcessingRef.current = false;
            
            // 약간의 대기 후 다음 질문
            setTimeout(() => {
                if (isRecordingRef.current) {
                    processQuestionAnswer(questionIndex + 1);
                }
            }, 1000);
        } catch (error) {
            console.error("질문-답변 처리 오류:", error);
            isProcessingRef.current = false;
            
            // 에러가 발생해도 다음 질문으로 진행 (녹화 중인 경우만)
            if (isRecordingRef.current && questionIndex < questions.length - 1) {
                setCurrentQuestionIndex(questionIndex + 1);
                setTimeout(() => {
                    if (isRecordingRef.current) {
                        processQuestionAnswer(questionIndex + 1);
                    }
                }, 1000);
            }
        }
    };

    const uploadAnalysisToServer = async (sessionId: string) => {
        try {
            setIsUploading(true);
            
            // 사용자 ID 확인
            const userId = user?.id;
            if (!userId) {
                throw new Error("사용자 정보가 없습니다. 다시 로그인해주세요.");
            }
            
            // 노인 이름 확인 (user.name이 없으면 기본값 사용)
            const seniorName = user?.name || "사용자";
            
            // 기록된 대화 내용을 포맷팅
            // 대화가 없으면 기본 메시지 사용
            const conversation = conversations.length > 0
                ? formatConversation(conversations)
                : "AI: 오늘 하루는 어떠셨나요?\n사용자: [녹화가 완료되었습니다]";

            // 요청 데이터 로깅
            console.log("[uploadAnalysisToServer] 요청 데이터:", {
                session_id: sessionId,
                user_id: userId,
                senior_name: seniorName,
                conversation_length: conversation.length,
                conversation_preview: conversation.substring(0, 100) + "...",
                conversations_count: conversations.length,
            });

            // /analyze/upload API 호출
            // 요청 형식: application/json
            // - session_id: string
            // - user_id: string
            // - senior_name: string
            // - conversation: string (AI 질문과 노인 응답이 포함된 대화 내용)
            const result = await analyzeService.uploadAnalysis(
                sessionId,
                userId,
                seniorName,
                conversation
            );

            console.log("[uploadAnalysisToServer] 분석 결과:", result);
            
            // 분석 결과를 로컬 스토리지에 저장 (나중에 사용 가능)
            if (typeof window !== "undefined") {
                localStorage.setItem(`analysis_${sessionId}`, JSON.stringify(result));
            }

            return result;
        } catch (error: any) {
            console.error("[uploadAnalysisToServer] 분석 업로드 오류:", error);
            
            // 에러 메시지 추출
            let errorMessage = "영상 분석에 실패했습니다.";
            if (error?.message) {
                errorMessage = error.message;
            } else if (typeof error === "string") {
                errorMessage = error;
            }
            
            // 500 에러인 경우 더 자세한 메시지
            if (errorMessage.includes("500") || errorMessage.includes("Internal Server Error")) {
                errorMessage = "서버에서 분석 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
            }
            
            console.error("[uploadAnalysisToServer] 에러 상세:", {
                error,
                message: errorMessage,
                stack: error?.stack,
            });
            
            // 사용자에게 알림 (하지만 플로우는 계속 진행)
            alert(errorMessage);
            throw error;
        } finally {
            setIsUploading(false);
        }
    };

    // /log API 호출 (녹화 영상 파일 + 분석 결과)
    // 감정 문자열을 EmotionType enum으로 변환
    const mapEmotionToEnum = (emotion: string | undefined): EmotionType => {
        if (!emotion) return EmotionType.기쁨; // 기본값
        
        // 감정 문자열을 enum 값으로 매핑
        const emotionMap: Record<string, EmotionType> = {
            "분노": EmotionType.분노,
            "슬픔": EmotionType.슬픔,
            "행복": EmotionType.행복,
            "무기력함": EmotionType.무기력함,
            "기쁨": EmotionType.기쁨,
            "외로움": EmotionType.외로움,
        };
        
        return emotionMap[emotion] || EmotionType.기쁨; // 기본값
    };

    const uploadLogToServer = async (
        videoBlob: Blob,
        sessionId: string,
        analysisResult: AnalyzeUploadResponse
    ) => {
        try {
            // 분석 결과에서 필요한 데이터 추출
            const statusSignal = analysisResult?.status_signal;
            const keyPhrases = analysisResult?.key_phrases || [];
            const careTodo = analysisResult?.care_todo || [];
            const aiCarePlan = analysisResult?.ai_care_plan;

            // emotion_type을 enum 값으로 변환
            const emotionType = mapEmotionToEnum(statusSignal?.emotion);

            // /log API 호출 (영상 파일 + 분석 결과 데이터)
            // user_id는 무조건 1로 고정
            await logService.createLog(
                {
                    user_id: 1,
                    session_id: sessionId,
                    health: statusSignal?.health || "",
                    emotion: statusSignal?.emotion || "",
                    daily_function: statusSignal?.daily_function || "",
                    summary: statusSignal?.summary || "",
                    key_phrases: keyPhrases,
                    care_todo: careTodo,
                    emotion_type: emotionType,
                    today: aiCarePlan?.today || "",
                    this_week: aiCarePlan?.this_week || "",
                    this_month: aiCarePlan?.this_month || "",
                    this_year: aiCarePlan?.this_year || "",
                },
                videoBlob
            );

            console.log("로그 저장 성공");
        } catch (error) {
            console.error("로그 저장 오류:", error);
            // 에러가 발생해도 사용자 플로우는 계속 진행
        }
    };

    // 녹화 시작 함수 (자동 시작 및 수동 시작 모두 사용)
    const startRecording = useCallback(() => {
        const currentStream = streamRef.current;
        
        if (!currentStream) {
            console.error("[startRecording] stream이 없어서 중단");
            return;
        }

        if (isRecordingRef.current) {
            console.log("[startRecording] 이미 녹화 중입니다");
            return;
        }

        console.log("[startRecording] 녹화 시작 준비");
        
        // 스냅샷 제거 (화면이 계속 녹화되도록)
        setSnapshot(null);

        // 녹화 시작
        try {
            console.log("[startRecording] MediaRecorder 생성 중...");
            
            // mp4 형식 지원 확인 (대부분의 브라우저는 webm만 지원)
            let mimeType = "video/webm;codecs=vp9";
            if (MediaRecorder.isTypeSupported("video/mp4")) {
                mimeType = "video/mp4";
            } else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9")) {
                mimeType = "video/webm;codecs=vp9";
            } else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp8")) {
                mimeType = "video/webm;codecs=vp8";
            } else {
                mimeType = "video/webm";
            }
            
            console.log(`[startRecording] 선택된 MIME 타입: ${mimeType}`);
            
            const mediaRecorder = new MediaRecorder(currentStream, {
                mimeType: mimeType,
            });
            console.log(`[startRecording] MediaRecorder 생성 완료, 실제 타입: ${mediaRecorder.mimeType}`);

            const chunks: Blob[] = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunks.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                // MediaRecorder가 실제로 생성한 형식 사용
                const actualMimeType = mediaRecorder.mimeType || "video/webm";
                const blob = new Blob(chunks, { type: actualMimeType });
                recordedBlobRef.current = blob;
                
                console.log(`[녹화 완료] 영상 Blob 생성: 크기=${blob.size} bytes, 실제 타입=${actualMimeType}`);
                
                // 녹화 중지 상태 업데이트
                setIsRecording(false);
                isRecordingRef.current = false;
                isProcessingRef.current = false;
                
                const sessionId = recordingService.generateSessionId();
                
                try {
                    // 1. 스냅샷 이미지 업로드 (기존 /context/upload)
                    if (canvasRef.current) {
                        canvasRef.current.toBlob(async (imageBlob) => {
                            if (imageBlob) {
                                await uploadToServer(imageBlob);
                            }
                        }, "image/jpeg", 0.95);
                    }

                    // 2. 영상 분석 업로드 (새로운 /analyze/upload)
                    // JSON 형식으로 대화 내용만 전송
                    let analysisResult: AnalyzeUploadResponse | null = null;
                    try {
                        analysisResult = await uploadAnalysisToServer(sessionId);
                        console.log("[녹화 완료] 분석 결과:", analysisResult);
                    } catch (error) {
                        console.error("[녹화 완료] 분석 실패, 기본값으로 진행:", error);
                        // 분석 실패 시에도 플로우는 계속 진행
                        // 기본값으로 빈 분석 결과 생성
                        analysisResult = {
                            status_signal: {
                                health: "",
                                emotion: "",
                                daily_function: "",
                                summary: "분석을 완료하지 못했습니다.",
                            },
                            key_phrases: [],
                            care_todo: [],
                            ai_care_plan: {
                                today: "",
                                this_week: "",
                                this_month: "",
                                this_year: "",
                            },
                        };
                    }
                    
                    // 3. /log API 호출 (영상 파일 + 분석 결과 전체)
                    // 분석 결과가 없어도 로그는 저장 (기본값 사용)
                    if (analysisResult) {
                        console.log(`[녹화 완료] 영상 업로드 시작: 크기=${blob.size} bytes`);
                        await uploadLogToServer(blob, sessionId, analysisResult);
                        console.log("[녹화 완료] 영상 업로드 완료");
                    } else {
                        console.warn("[녹화 완료] 분석 결과가 없어 영상 업로드를 건너뜁니다.");
                    }

                    // 4. 분석 완료 후 감정 선택 페이지로 이동
                    setSnapshot(null); // 스냅샷 해제
                    router.push("/user/emotion");
                } catch (error) {
                    console.error("[녹화 완료] 업로드 실패:", error);
                    // 에러가 발생해도 사용자 플로우는 계속 진행
                    setSnapshot(null);
                    router.push("/user/emotion");
                }
            };

            // 대화 초기화
            setConversations([]);
            setCurrentQuestionIndex(0);
            isProcessingRef.current = false;
            
            console.log("[startRecording] 대화 초기화 완료");
            
            // 녹화 바로 시작
            console.log("[startRecording] mediaRecorder.start() 호출");
            mediaRecorder.start();
            mediaRecorderRef.current = mediaRecorder;
            setIsRecording(true);
            isRecordingRef.current = true;
            hasStartedQuestionsRef.current = false; // 질문 시작 플래그 리셋
            console.log("[startRecording] 녹화 상태 설정 완료, isRecordingRef.current:", isRecordingRef.current);
            // isRecording이 true가 되면 useEffect에서 자동으로 첫 질문 시작됨
        } catch (error) {
            console.error("녹화 시작 오류:", error);
            alert("녹화를 시작할 수 없습니다.");
        }
    }, [captureSnapshot, uploadToServer, uploadAnalysisToServer, uploadLogToServer, router, processQuestionAnswer]);

    // 녹화 중지 함수
    const stopRecording = useCallback(() => {
        console.log("[stopRecording] 녹화 중지 요청");
        
        stopTTS();
        stopSTT();
        isProcessingRef.current = false;
        isRecordingRef.current = false;
        hasStartedQuestionsRef.current = false; // 질문 시작 플래그 리셋
        
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
        }
        
        setIsRecording(false);
        setCurrentQuestionIndex(0);
        // 녹화 완료 후 분석 API 호출은 mediaRecorder.onstop에서 처리
    }, [stopTTS, stopSTT]);

    const handleRecordToggle = () => {
        console.log("[handleRecordToggle] 함수 호출됨", {
            stream: stream ? "있음" : "없음",
            isRecording,
            streamRef: streamRef.current ? "있음" : "없음",
        });
        
        if (isRecording) {
            // 녹화 중지 (사용자가 수동으로 중지)
            stopRecording();
        } else {
            // 녹화 시작 (수동 시작 - 자동 시작이 실패한 경우 대비)
            startRecording();
        }
    };

    // 웹캠 스트림이 설정되면 자동으로 녹화 시작
    useEffect(() => {
        if (stream && streamRef.current && !isRecordingRef.current) {
            console.log("[자동 녹화] 스트림 확인됨, 1초 후 자동 녹화 시작");
            const timer = setTimeout(() => {
                if (streamRef.current && !isRecordingRef.current) {
                    console.log("[자동 녹화] 시작");
                    startRecording();
                } else {
                    console.log("[자동 녹화] 조건 불만족", {
                        hasStream: !!streamRef.current,
                        isRecording: isRecordingRef.current,
                    });
                }
            }, 1000); // 1초 후 자동 시작

            return () => {
                clearTimeout(timer);
            };
        }
    }, [stream, startRecording]); // stream이 설정되면 자동 녹화 시작

    // isRecording이 true가 되면 자동으로 첫 질문 시작
    useEffect(() => {
        if (isRecording && !hasStartedQuestionsRef.current) {
            console.log("[자동 질문] isRecording이 true가 됨, 첫 질문 시작");
            hasStartedQuestionsRef.current = true;
            // 약간의 지연 후 첫 질문 시작 (녹화가 안정화될 시간)
            setTimeout(() => {
                if (isRecordingRef.current) {
                    console.log("[자동 질문] processQuestionAnswer(0) 호출");
                    processQuestionAnswer(0).catch((error) => {
                        console.error("[자동 질문] 첫 질문 시작 오류:", error);
                    });
                }
            }, 500); // 500ms 후 첫 질문 시작
        }
    }, [isRecording, processQuestionAnswer]);

    return (
        <div className="relative flex min-h-screen flex-col bg-[#f7f7f9]">
            {/* 웹캠 비디오 배경 - 항상 렌더링하여 깜빡임 방지 */}
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 h-full w-full object-cover"
            />

            {/* 캡처된 스냅샷 (녹화 중일 때 표시) - 비디오 위에 오버레이 */}
            {snapshot && (
                <img
                    src={snapshot}
                    alt="Recording snapshot"
                    className="absolute inset-0 z-10 h-full w-full object-cover"
                />
            )}

            {/* 숨겨진 캔버스 (스냅샷 캡처용) */}
            <canvas ref={canvasRef} className="hidden" />

            {/* 어두운 오버레이 */}
            <div className="absolute inset-0 bg-black opacity-[0.01]" />

            {/* 컨텐츠 */}
            <div className="relative z-10 flex min-h-screen flex-col">
                {/* 단계 인디케이터 (1/3) */}
                <div className="flex items-center justify-center gap-3 py-4 px-4">
                    <div className="bg-primary h-2.5 w-2.5 rounded-full" />
                    <div className="h-2.5 w-2.5 rounded-full bg-gray-50" />
                    <div className="h-2.5 w-2.5 rounded-full bg-gray-50" />
                </div>

                {/* 업로드 중 로딩 오버레이 */}
                {isUploading && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50">
                        <div className="flex flex-col items-center gap-4 rounded-lg bg-white px-8 py-6">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                            <p className="text-base font-semibold text-black">
                                영상 분석 중...
                            </p>
                            <p className="text-sm text-gray-500">
                                잠시만 기다려주세요
                            </p>
                        </div>
                    </div>
                )}

                {/* 대화 상태 표시 */}
                {isRecording && (
                    <div className="absolute top-16 left-1/2 z-10 w-[90%] max-w-md -translate-x-1/2 transform px-4">
                        {/* 현재 질문 표시 (큰 텍스트) */}
                        {currentQuestionIndex < questions.length && (
                            <div className="rounded-lg bg-black/80 px-4 py-3 backdrop-blur-sm">
                                <p className="text-base font-semibold text-white leading-tight">
                                    {questions[currentQuestionIndex]}
                                </p>
                                {isSpeaking && (
                                    <p className="mt-2 text-xs text-white/80">
                                        🔊 음성 안내 중...
                                    </p>
                                )}
                                {isListening && (
                                    <p className="mt-2 text-xs text-white/80">
                                        🎤 답변을 듣고 있습니다...
                                    </p>
                                )}
                                {!isSpeaking && !isListening && (
                                    <p className="mt-2 text-xs text-white/80">
                                        질문 {currentQuestionIndex + 1}/{questions.length}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* 중앙 공간 */}
                <div className="flex-1" />

                {/* 녹화 버튼 */}
                <div className="flex items-center justify-center pb-6 safe-area-bottom">
                    <button
                        onClick={(e) => {
                            console.log("[버튼 클릭] onClick 이벤트 발생");
                            e.preventDefault();
                            e.stopPropagation();
                            handleRecordToggle();
                        }}
                        className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white transition-transform active:scale-95"
                        aria-label={isRecording ? "녹화 중지" : "녹화 시작"}
                    >
                        <div
                            className={
                                isRecording
                                    ? "bg-error h-16 w-16 rounded-full"
                                    : "bg-error h-[30px] w-[30px] rounded"
                            }
                        />
                    </button>
                </div>
            </div>
        </div>
    );
}
