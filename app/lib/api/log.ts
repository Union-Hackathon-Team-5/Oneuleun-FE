import { apiClient } from "./client";
import type { LogRequestData, LogResponse } from "@/app/types/api";

export class LogService {
    /**
     * 노인 기록을 서버에 저장
     * @param requestData 기록 데이터 (user_id, session_id, emotion, warning_signs, summary)
     * @param file 선택적 파일
     * @returns 빈 응답 객체
     */
    async createLog(
        requestData: LogRequestData,
        file?: File | Blob
    ): Promise<LogResponse> {
        const formData = new FormData();

        // request 데이터를 JSON 문자열로 변환하여 추가
        formData.append("request", JSON.stringify(requestData));

        // 파일이 있으면 추가
        if (file) {
            formData.append("file", file, file instanceof File ? file.name : `log-${Date.now()}.mp4`);
        }

        return apiClient.postFormData<LogResponse>("/log", formData);
    }
}

export const logService = new LogService();

