import { ReactNode } from "react";

interface WizardStep {
    title: string;
    content: ReactNode;
}

interface WizardProps {
    steps: WizardStep[];
    currentStep: number;
    onStepChange?: (step: number) => void;
}

export default function Wizard({ steps, currentStep }: WizardProps) {
    // 컨텐츠: 마지막 단계를 넘어가지 않도록 제한
    const contentIndex = Math.min(
        Math.max(currentStep - 1, 0),
        steps.length - 1
    );
    const currentContent = steps[contentIndex]?.content;

    return (
        <div className="flex h-full w-full flex-col">
            {/* 단계 점 인디케이터 */}
            <div className="flex items-center justify-center gap-3 py-3">
                {steps.map((_, index) => (
                    <div
                        key={index}
                        className={`h-2 w-2 rounded-full transition-all duration-500 ${
                            index < currentStep
                                ? "bg-primary" // 완료된 단계 (금색)
                                : "bg-[#eff0f2]" // 대기 중인 단계 (회색)
                        }`}
                    />
                ))}
            </div>

            {/* 현재 단계 컨텐츠 */}
            <div className="flex flex-1 flex-col">{currentContent}</div>
        </div>
    );
}
