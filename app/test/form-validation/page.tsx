"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormData } from "@/app/lib/validations/form";
import Button from "@/app/components/common/button";

export default function FormValidationTestPage() {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        mode: "onChange", // 입력할 때마다 검증
    });

    const onSubmit = async (data: LoginFormData) => {
        console.log("폼 데이터:", data);
        // 여기서 API 호출 등을 할 수 있습니다
        await new Promise((resolve) => setTimeout(resolve, 1000)); // 시뮬레이션
        alert(`로그인 성공!\n이메일: ${data.email}`);
    };

    return (
        <div className="flex min-h-screen flex-col bg-white">
            <div className="flex-1 py-6">
                <h1 className="text-title-small mb-8">
                    Zod + React Hook Form 예시
                </h1>

                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="space-y-6"
                    noValidate
                >
                    {/* 이메일 입력 */}
                    <div>
                        <label
                            htmlFor="email"
                            className="text-body4 mb-2 block"
                        >
                            이메일
                        </label>
                        <input
                            id="email"
                            type="email"
                            {...register("email")}
                            className={`text-body3 w-full rounded-lg border p-3 transition-colors outline-none focus:ring-2 ${
                                errors.email
                                    ? "border-red-500 focus:ring-red-500"
                                    : "focus:ring-primary border-gray-300"
                            }`}
                            placeholder="example@email.com"
                        />
                        {errors.email && (
                            <p className="text-caption mt-1 text-red-600">
                                {errors.email.message}
                            </p>
                        )}
                    </div>

                    {/* 비밀번호 입력 */}
                    <div>
                        <label
                            htmlFor="password"
                            className="text-body4 mb-2 block"
                        >
                            비밀번호
                        </label>
                        <input
                            id="password"
                            type="password"
                            {...register("password")}
                            className={`text-body3 w-full rounded-lg border p-3 transition-colors outline-none focus:ring-2 ${
                                errors.password
                                    ? "border-red-500 focus:ring-red-500"
                                    : "focus:ring-primary border-gray-300"
                            }`}
                            placeholder="8자 이상 입력해주세요"
                        />
                        {errors.password && (
                            <p className="text-caption mt-1 text-red-600">
                                {errors.password.message}
                            </p>
                        )}
                        <p className="text-caption mt-1 text-gray-500">
                            영문 대소문자와 숫자 포함 8자 이상
                        </p>
                    </div>

                    {/* 검증 규칙 안내 */}
                    <div className="rounded-lg bg-gray-50 p-4">
                        <h3 className="text-body4 mb-2">검증 규칙</h3>
                        <ul className="text-caption space-y-1 text-gray-600">
                            <li>✓ 이메일: 올바른 이메일 형식</li>
                            <li>✓ 비밀번호: 최소 8자, 영문 대소문자 + 숫자</li>
                            <li>✓ 실시간 검증 (onChange)</li>
                        </ul>
                    </div>

                    {/* 제출 버튼 */}
                    <Button
                        type="submit"
                        className="h-[52px] w-full"
                        isActive={!isSubmitting}
                    >
                        {isSubmitting ? "처리 중..." : "로그인"}
                    </Button>
                </form>
            </div>
        </div>
    );
}
