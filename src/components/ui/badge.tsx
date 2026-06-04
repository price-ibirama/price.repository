import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
    variant?: "default" | "success" | "warning" | "danger" | "muted";
};

const variants = {
    default: "bg-slate-900 text-white",
    success: "bg-green-100 text-green-800",
    warning: "bg-amber-100 text-amber-800",
    danger: "bg-red-100 text-red-800",
    muted: "bg-slate-100 text-slate-700",
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
    return (
        <span
            className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", variants[variant], className)}
            {...props}
        />
    );
}
