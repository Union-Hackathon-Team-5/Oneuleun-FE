// Context Upload API
export interface ContextUploadRequest {
    session_id: string;
    user_id: string;
    image_file: File | Blob;
}

export interface ContextUploadResponse {
    success: boolean;
    message?: string;
    data?: {
        url?: string;
        file_id?: string;
    };
}

// Common API Response
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

// Auth API
export interface SignupRequest {
    account_id: string;
    password: string;
}

export interface SignupResponse {
    access_token: string;
    expires_at: string;
}

export interface LoginRequest {
    account_id: string;
    password: string;
}

export interface LoginResponse {
    access_token: string;
    expires_at: string;
}

// User Registration API
export interface UserRegisterRequest {
    name: string;
    birth_date: string;
    gender: "MALE" | "FEMALE";
}

export interface UserRegisterResponse {
    code: string;
}

// Senior Login API
export interface SeniorLoginRequest {
    code: string;
}

export interface SeniorLoginResponse {
    access_token: string;
    expires_at: string;
}

// Caregiver Seniors List API
export interface Senior {
    id: number; // senior-id로 사용
    name: string;
    code: string; // 노인 등록 코드
}

export type CaregiverSeniorsResponse = Senior[];

// Log API
export enum EmotionType {
    분노 = "분노",
    슬픔 = "슬픔",
    행복 = "행복",
    무기력함 = "무기력함",
    기쁨 = "기쁨",
    외로움 = "외로움",
}

export interface LogRequestData {
    user_id: number;
    session_id: string;
    health: string;
    emotion: string;
    daily_function: string;
    summary: string;
    key_phrases: string[];
    care_todo: string[];
    emotion_type: EmotionType;
    today: string;
    this_week: string;
    this_month: string;
    this_year: string;
}

export interface LogRequest {
    file?: File | Blob;
    request?: LogRequestData;
}

export interface LogResponse {
    // 빈 객체 (POST /log 응답)
}

// GET /log/{senior-id} 응답
export interface SeniorLogResponse {
    id: number;
    status_signal: {
        health: string;
        emotion: string;
        daily_function: string;
        summary: string;
    };
    key_phrases: string[];
    care_todo: string[];
    ai_care_plan: {
        today: string;
        this_week: string;
        this_month: string;
        this_year: string;
    };
    emotion_type: string;
    date: string;
    file_url: string;
}

// GET /log/emotion/{senior-id} 요청/응답
export enum Period {
    WEEK = "WEEK",   // 이번 주
    MONTH = "MONTH", // 이번 달
    YEAR = "YEAR",   // 올해
}

export interface EmotionCountResponse {
    count: number[]; // [기쁨, 분노, 슬픔, 외로움, 무기력함, 행복]
}

// Analyze Upload API
export interface AnalyzeUploadRequest {
    session_id: string;
    user_id: string;
    senior_name: string;
    conversation: string;
}

export interface StatusOverview {
    alert_level: "urgent" | "warning" | "normal";
    alert_badge: string;
    alert_title: string;
    alert_subtitle: string;
    status_color: string;
}

export interface TodaySummary {
    headline: string;
    mood_score: number;
    mood_label: string;
    mood_emoji: string;
    energy_score: number;
    pain_score: number;
    mother_voice: string[];
}

export interface KeyConcern {
    concern_id: number;
    type: string;
    icon: string;
    severity: "urgent" | "warning" | "normal";
    title: string;
    description: string;
    detected_from: string[];
    urgency_reason: string;
}

export interface ActionItem {
    action_id: number;
    priority: string;
    icon: string;
    title: string;
    reason: string;
    detail: string;
    deadline: string;
    estimated_time: string;
    suggested_topics: string[];
    options: string[];
    booking_button: boolean;
}

export interface ActionPlan {
    urgent_actions: ActionItem[];
    this_week_actions: ActionItem[];
    long_term_actions: ActionItem[];
}

export interface EmotionTimelineItem {
    timestamp: string;
    emotion: string;
    intensity: number;
    trigger: string;
}

export interface RiskIndicator {
    level: "high" | "medium" | "low";
    factors: string[];
}

export interface VideoHighlight {
    timestamp: string;
    thumbnail_url: string;
    emotion: string;
    caption: string;
    importance: "urgent" | "important" | "normal";
}

export interface AudioAnalysis {
    voice_energy: string;
    speaking_pace: string;
    tone_quality: string;
    emotional_indicators: string[];
}

export interface DetailedAnalysis {
    conversation_summary: Record<string, any>;
    emotion_timeline: EmotionTimelineItem[];
    risk_indicators: Record<string, RiskIndicator>;
    video_highlights: VideoHighlight[];
    audio_analysis: AudioAnalysis;
}

export interface TrendChange {
    metric: string;
    direction: "up" | "down" | "stable";
    change: number;
    icon: string;
    comment: string;
}

export interface TrendAnalysis {
    compared_to: string;
    changes: TrendChange[];
    alert_message: string;
    pattern: string;
}

export interface QuickStat {
    label: string;
    value: string;
    emoji: string;
    color: string;
}

export interface CTAButton {
    text: string;
    icon: string;
    color: string;
    action: string;
}

export interface UIComponents {
    header: Record<string, any>;
    quick_stats: QuickStat[];
    cta_buttons: CTAButton[];
}

// 새로운 AI 분석 응답 구조
export interface StatusSignal {
    health: string;
    emotion: string;
    daily_function: string;
    summary: string;
}

export interface AICarePlan {
    today: string;
    this_week: string;
    this_month: string;
    this_year: string;
}

export interface WeeklyChange {
    mood: number;
    meal: number;
    activity: number;
    graph_dummy_data: Array<{
        day: string;
        mood: number;
    }>;
}

// 기존 응답 구조 (하위 호환성 유지)
export interface AnalyzeUploadResponse {
    success?: boolean;
    session_id?: string;
    user_id?: string;
    recorded_at?: string;
    
    // 새로운 응답 구조
    status_signal?: StatusSignal;
    key_phrases?: string[];
    care_todo?: string[];
    weekly_change?: WeeklyChange;
    ai_care_plan?: AICarePlan;
    
    // 기존 응답 구조 (하위 호환성)
    status_overview?: StatusOverview;
    today_summary?: TodaySummary;
    key_concerns?: KeyConcern[];
    action_plan?: ActionPlan;
    detailed_analysis?: DetailedAnalysis;
    trend_analysis?: TrendAnalysis;
    ui_components?: UIComponents;
}

