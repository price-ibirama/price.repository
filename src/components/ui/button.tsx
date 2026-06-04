import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "ghost" | "destructive";
};

const variants = {
    primary: "bg-green-600 text-white shadow-sm hover:bg-green-700",
    secondary: "border border-slate-200 bg-white text-slate-900 shadow-sm hover:bg-slate-50",
    ghost: "text-slate-700 hover:bg-slate-100",
    destructive: "bg-red-600 text-white shadow-sm hover:bg-red-700",
};

export function Button({ className, variant = "primary", type = "button", ...props }: ButtonProps) {
    return (
        <button
            type={type}
            className={cn(
                "inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
                variants[variant],
                className
            )}
            {...props}
        />
    );
}
