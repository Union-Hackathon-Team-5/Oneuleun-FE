"use client";

import { cn } from "@/app/lib/cn";

interface ButtonProps {
    variant?: "primary" | "secondary";
    isActive?: boolean;
    type?: "button" | "submit" | "reset";
    className?: string;
    children: React.ReactNode;
    onClick?: () => void;
}

const Button = ({
    variant = "primary",
    isActive = true,
    type = "button",
    className,
    children,
    onClick,
}: ButtonProps) => {
    const baseClasses =
        "flex items-center justify-center rounded-lg px-4 py-2 text-body1 transition-colors";

    if (variant === "primary") {
        return (
            <button
                className={cn(
                    baseClasses,
                    "bg-primary text-white hover:opacity-90 disabled:cursor-not-allowed disabled:bg-gray-300",
                    className
                )}
                disabled={!isActive}
                type={type}
                onClick={onClick}
            >
                {children}
            </button>
        );
    }

    return (
        <button
            className={cn(
                baseClasses,
                "border-primary text-primary border hover:bg-gray-50 disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-400",
                className
            )}
            disabled={!isActive}
            type={type}
            onClick={onClick}
        >
            {children}
        </button>
    );
};

export default Button;
