import { cn } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            className={cn(
                "flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-green-600/20 transition focus:border-green-600 focus:ring-4 disabled:cursor-not-allowed disabled:opacity-50",
                className
            )}
            {...props}
        />
    );
}
