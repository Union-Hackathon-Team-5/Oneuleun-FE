import { apiClient } from "./client";
import type { LogRequestData, LogResponse, SeniorLogResponse, EmotionCountResponse, Period } from "@/app/types/api";

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

        // 인증 토큰이 필요하므로 useAuth: true 전달
        return apiClient.postFormData<LogResponse>("/log", formData, undefined, true);
    }

    /**
     * 노인 기록 조회
     * @param seniorId 노인 ID
     * @returns 노인 기록 데이터
     */
    async getSeniorLog(seniorId: number): Promise<SeniorLogResponse> {
        return apiClient.get<SeniorLogResponse>(`/log/${seniorId}`, undefined, true);
    }

    /**
     * 노인 감정 카운트 조회
     * @param seniorId 노인 ID
     * @param periods 기간 필터 (WEEK, MONTH, YEAR) - 선택적
     * @returns 감정별 카운트 배열 [기쁨, 분노, 슬픔, 외로움, 무기력함, 행복]
     */
    async getEmotionCount(
        seniorId: number,
        periods?: Period[]
    ): Promise<EmotionCountResponse> {
        let endpoint = `/log/emotion/${seniorId}`;
        
        // period 쿼리 파라미터 추가
        if (periods && periods.length > 0) {
            const periodParams = periods.map((p) => `period=${p}`).join("&");
            endpoint += `?${periodParams}`;
        }
        
        return apiClient.get<EmotionCountResponse>(endpoint, undefined, true);
    }
}

export const logService = new LogService();

