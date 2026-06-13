"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

type FormMessageProps = {
  error?: string;
  success?: string;
};

export function FormMessage({ error, success }: FormMessageProps) {
  const displayedMessageRef = useRef<string | null>(null);

  useEffect(() => {
    const message = error || success;

    if (!message || displayedMessageRef.current === message) {
      return;
    }

    displayedMessageRef.current = message;

    if (error) {
      toast.error(error);
    } else if (success) {
      toast.success(success);
    }

    const url = new URL(window.location.href);
    url.searchParams.delete("error");
    url.searchParams.delete("success");
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }, [error, success]);

  return null;
}
