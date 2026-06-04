"use client";

import {
  simulateWhatsappMessage,
  type CapturedSimulatorEvent,
} from "@/app/(admin)/admin/simulador/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Bot, LoaderCircle, Send, UserRound } from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useRef, useState, useTransition } from "react";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  events?: CapturedSimulatorEvent[];
};

const initialMessages: ChatMessage[] = [
  {
    id: "welcome",
    role: "assistant",
    content: "Olá! Envie uma pergunta como se estivesse no WhatsApp. Ex.: cerveja, arroz, tem leite?",
    timestamp: new Date().toISOString(),
  },
];

function formatWhatsappLine(line: string) {
  const fragments = line.split(/(```[^`]+```|\*[^*]+\*|_[^_]+_|~[^~]+~)/g).filter(Boolean);

  return fragments.map((fragment, index): ReactNode => {
    const key = `${fragment}-${index}`;

    if (fragment.startsWith("```") && fragment.endsWith("```")) {
      return (
        <code key={key} className="rounded bg-background px-1 py-0.5 font-mono text-xs">
          {fragment.slice(3, -3)}
        </code>
      );
    }

    if (fragment.startsWith("*") && fragment.endsWith("*")) {
      return <strong key={key}>{fragment.slice(1, -1)}</strong>;
    }

    if (fragment.startsWith("_") && fragment.endsWith("_")) {
      return <em key={key}>{fragment.slice(1, -1)}</em>;
    }

    if (fragment.startsWith("~") && fragment.endsWith("~")) {
      return (
        <span key={key} className="line-through">
          {fragment.slice(1, -1)}
        </span>
      );
    }

    return fragment;
  });
}

function WhatsappMessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex items-end gap-2", isUser ? "justify-end" : "justify-start")}>
      {!isUser ? (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
          <Bot />
        </div>
      ) : null}
      <div
        className={cn(
          "flex max-w-[min(34rem,82%)] flex-col gap-2 rounded-2xl px-4 py-3 text-sm shadow-sm",
          isUser ? "bg-primary text-primary-foreground" : "bg-card text-card-foreground ring-1 ring-border",
        )}
      >
        <div className="flex flex-col gap-1 whitespace-pre-wrap">
          {message.content.split("\n").map((line, index) => (
            <span key={`${message.id}-${index}`}>{line ? formatWhatsappLine(line) : "\u00A0"}</span>
          ))}
        </div>
        {message.events?.length ? (
          <div className="flex flex-wrap gap-1">
            {message.events.map((event, index) => (
              <Badge key={`${message.id}-${event.type}-${index}`} variant="outline">
                {event.label}
              </Badge>
            ))}
          </div>
        ) : null}
      </div>
      {isUser ? (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <UserRound />
        </div>
      ) : null}
    </div>
  );
}

export function WhatsappSimulator() {
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isPending]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const message = draft.trim();
    if (!message || isPending) {
      return;
    }

    setError(null);
    setDraft("");

    const optimisticMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: message,
      timestamp: new Date().toISOString(),
    };

    setMessages((currentMessages) => [...currentMessages, optimisticMessage]);

    startTransition(async () => {
      const result = await simulateWhatsappMessage({ message });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: result.data.messageId,
          role: "assistant",
          content: result.data.responseText,
          timestamp: result.data.timestamp,
          events: result.data.events,
        },
      ]);
    });
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      <div className="overflow-hidden rounded-[2rem] bg-muted p-3 ring-1 ring-border">
        <div className="flex items-center justify-between rounded-t-[1.5rem] bg-card px-4 py-3 ring-1 ring-border">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Bot />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">Price Ofertas</span>
              <span className="text-xs text-muted-foreground">Simulação local do WhatsApp</span>
            </div>
          </div>
          <Badge variant="outline">dev</Badge>
        </div>
        <ScrollArea className="h-[32rem] rounded-b-[1.5rem] bg-background">
          <div className="flex flex-col gap-4 p-4">
            {messages.map((message) => (
              <WhatsappMessageBubble key={message.id} message={message} />
            ))}
            {isPending ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <LoaderCircle className="animate-spin" />
                Processando mensagem...
              </div>
            ) : null}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <Field>
            <FieldLabel className="sr-only" htmlFor="simulator-message">
              Mensagem
            </FieldLabel>
            <Textarea
              id="simulator-message"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Digite como no WhatsApp: cerveja, arroz, tem leite?"
              rows={3}
              maxLength={500}
              disabled={isPending}
            />
          </Field>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-muted-foreground">
              A simulação grava logs reais no Supabase local para reproduzir o webhook.
            </p>
            <Button type="submit" disabled={!draft.trim() || isPending}>
              {isPending ? <LoaderCircle data-icon="inline-start" className="animate-spin" /> : <Send data-icon="inline-start" />}
              Enviar
            </Button>
          </div>
        </FieldGroup>
      </form>
    </div>
  );
}
