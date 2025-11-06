import { aiApiClient } from "./client";
import type { ContextUploadResponse } from "@/app/types/api";

export class RecordingService {
    /**
     * 녹화 컨텍스트(이미지)를 AI 서버에 업로드
     */
    async uploadContext(
        sessionId: string,
        userId: string,
        imageFile: Blob
    ): Promise<ContextUploadResponse> {
        const formData = new FormData();
        formData.append("session_id", sessionId);
        formData.append("user_id", userId);
        formData.append("image_file", imageFile, `recording-${Date.now()}.jpg`);

        return aiApiClient.postFormData<ContextUploadResponse>(
            "/context/upload",
            formData
        );
    }

    /**
     * 세션 ID 생성
     */
    generateSessionId(): string {
        return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}

export const recordingService = new RecordingService();

