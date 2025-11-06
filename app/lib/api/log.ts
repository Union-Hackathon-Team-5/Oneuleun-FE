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

        // request 데이터를 JSON 문자열로 변환하여 Blob으로 추가 (application/json Content-Type 설정)
        const jsonString = JSON.stringify(requestData);
        const jsonBlob = new Blob([jsonString], { type: "application/json" });
        formData.append("request", jsonBlob, "request.json");
        console.log(`[LogService] request 데이터 (application/json):`, requestData);

        // 파일이 있으면 추가 (multipart/form-data)
        if (file) {
            // 파일 이름과 MIME 타입을 mp4로 설정 (서버에서 mp4를 기대함)
            const fileName = `log-${Date.now()}.mp4`;
            const mimeType = "video/mp4";
            
            // Blob을 File 객체로 변환하여 명시적인 파일 이름과 MIME 타입 설정
            if (file instanceof Blob && !(file instanceof File)) {
                const videoFile = new File([file], fileName, { type: mimeType });
                formData.append("file", videoFile, fileName);
                console.log(`[LogService] 영상 파일 업로드 (multipart/form-data): ${fileName}, 크기: ${file.size} bytes, 원본 타입: ${file.type}, 업로드 타입: ${mimeType}`);
            } else {
                // File 객체인 경우도 mp4로 변환
                const videoFile = file instanceof File 
                    ? new File([file], fileName, { type: mimeType })
                    : new File([file], fileName, { type: mimeType });
                formData.append("file", videoFile, fileName);
                console.log(`[LogService] 영상 파일 업로드 (multipart/form-data): ${fileName}, 크기: ${file.size} bytes, 원본 타입: ${file.type}, 업로드 타입: ${mimeType}`);
            }
        } else {
            console.warn("[LogService] 파일이 없습니다. request만 전송합니다.");
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

