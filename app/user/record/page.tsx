"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { recordingService } from "@/app/lib/api/recording";
import { useAuth } from "@/app/hooks/useAuth";

export default function UserRecordPage() {
    const router = useRouter();
    const { user } = useAuth();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [snapshot, setSnapshot] = useState<string | null>(null);

    useEffect(() => {
        // 웹캠 시작
        const startWebcam = async () => {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 1920 },
                        height: { ideal: 1080 },
                        facingMode: "user",
                    },
                    audio: true,
                });

                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }
                setStream(mediaStream);
            } catch (error) {
                console.error("웹캠 접근 오류:", error);
                alert("웹캠에 접근할 수 없습니다. 권한을 확인해주세요.");
            }
        };

        startWebcam();

        return () => {
            // 컴포넌트 언마운트 시 스트림 정리
            if (stream) {
                stream.getTracks().forEach((track) => track.stop());
            }
        };
    }, []);

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

    const handleRecordToggle = () => {
        if (!stream) return;

        if (isRecording) {
            // 녹화 중지
            if (mediaRecorderRef.current) {
                mediaRecorderRef.current.stop();
            }
            setIsRecording(false);
            setSnapshot(null); // 스냅샷 해제하고 라이브 화면으로 복귀

            // 녹화 완료 후 감정 선택 페이지로 이동
            router.push("/user/emotion");
        } else {
            // 현재 화면 캡처 (멈춘 화면 표시)
            captureSnapshot();

            // 녹화 시작
            try {
                const mediaRecorder = new MediaRecorder(stream, {
                    mimeType: "video/mp4;codecs=vp9",
                });

                const chunks: Blob[] = [];

                mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        chunks.push(event.data);
                    }
                };

                mediaRecorder.onstop = async () => {
                    const blob = new Blob(chunks, { type: "video/mp4" });
                    
                    // 스냅샷 이미지를 blob으로 변환하여 업로드
                    if (canvasRef.current) {
                        canvasRef.current.toBlob(async (imageBlob) => {
                            if (imageBlob) {
                                await uploadToServer(imageBlob);
                            }
                        }, "image/jpeg", 0.95);
                    }

                    // 비디오 다운로드 (선택사항)
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `recording-${Date.now()}.mp4`;
                    a.click();
                };

                mediaRecorder.start();
                mediaRecorderRef.current = mediaRecorder;
                setIsRecording(true);
            } catch (error) {
                console.error("녹화 시작 오류:", error);
                alert("녹화를 시작할 수 없습니다.");
            }
        }
    };

    return (
        <div className="relative flex min-h-screen flex-col bg-[#f7f7f9]">
            {/* 웹캠 비디오 배경 */}
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`absolute inset-0 h-full w-full object-cover ${snapshot ? "hidden" : ""}`}
            />

            {/* 캡처된 스냅샷 (녹화 중일 때 표시) */}
            {snapshot && (
                <img
                    src={snapshot}
                    alt="Recording snapshot"
                    className="absolute inset-0 h-full w-full object-cover"
                />
            )}

            {/* 숨겨진 캔버스 (스냅샷 캡처용) */}
            <canvas ref={canvasRef} className="hidden" />

            {/* 어두운 오버레이 */}
            <div className="absolute inset-0 bg-black opacity-[0.01]" />

            {/* 컨텐츠 */}
            <div className="relative z-10 flex min-h-screen flex-col">
                {/* 단계 인디케이터 (1/3) */}
                <div className="flex items-center justify-center gap-3 py-3">
                    <div className="bg-primary h-2 w-2 rounded-full" />
                    <div className="h-2 w-2 rounded-full bg-gray-50" />
                    <div className="h-2 w-2 rounded-full bg-gray-50" />
                </div>

                {/* 중앙 공간 */}
                <div className="flex-1" />

                {/* 녹화 버튼 */}
                <div className="flex items-center justify-center pb-8">
                    <button
                        onClick={handleRecordToggle}
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
