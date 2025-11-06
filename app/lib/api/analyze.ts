import { aiApiClient } from "./client";
import type { AnalyzeUploadRequest, AnalyzeUploadResponse } from "@/app/types/api";

export class AnalyzeService {
    /**
     * 영상 촬영 완료 후 분석 요청
     * @param sessionId 세션 ID
     * @param userId 사용자 ID
     * @param seniorName 노인 이름
     * @param conversation AI 질문과 노인 응답이 포함된 대화 내용
     * @returns 분석 결과
     */
    async uploadAnalysis(
        sessionId: string,
        userId: string,
        seniorName: string,
        conversation: string
    ): Promise<AnalyzeUploadResponse> {
        const requestBody: AnalyzeUploadRequest = {
            session_id: sessionId,
            user_id: userId,
            senior_name: seniorName,
            conversation: conversation,
        };

        return aiApiClient.post<AnalyzeUploadResponse>(
            "/analyze/upload",
            requestBody
        );
    }
}

export const analyzeService = new AnalyzeService();

