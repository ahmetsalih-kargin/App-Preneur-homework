"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { LoaderCircle, MessageSquare, Send, X } from "lucide-react";
import { api, type ChatTurn } from "@/lib/api";

const MAX_INPUT = 2000;
// Sunucuya giden geçmişi sınırla: maliyet ve istek boyutu kontrolsüz büyümesin
const MAX_HISTORY = 12;

const greeting = (hasTarget: boolean): ChatTurn => ({
  role: "assistant",
  content: hasTarget
    ? "Bu hedefin bulgularıyla ilgili soru sorabilirsiniz. Yanıtlar yalnızca taramada toplanan verilere dayanır."
    : "Önce bir tarama başlatın; ardından bulgularla ilgili soru sorabilirsiniz.",
});

interface ChatCopilotProps {
  activeScanId: string | null;
  /** Sağdaki detay paneli açıkken masaüstünde onun soluna kayar */
  isPanelOpen?: boolean;
}

export function ChatCopilot({ activeScanId, isPanelOpen = false }: ChatCopilotProps) {
  const panelId = useId();
  const inputId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatTurn[]>(() => [greeting(false)]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  // Hedef değişince uçtaki yanıtın yeni sohbete düşmesini engeller
  const conversationRef = useRef(0);

  useEffect(() => {
    conversationRef.current += 1;
    setMessages([greeting(!!activeScanId)]);
    setIsLoading(false);
  }, [activeScanId]);

  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const close = () => {
    setIsOpen(false);
    toggleRef.current?.focus();
  };

  const send = async (e?: FormEvent) => {
    e?.preventDefault();
    const content = input.trim();
    if (!content || isLoading) return;

    const conversation = conversationRef.current;
    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    setInput("");
    setIsLoading(true);

    try {
      // İlk karşılama mesajı yerel bir metin; sunucuya gönderilmez
      const history = next.slice(1).slice(-MAX_HISTORY);
      const { reply } = await api.chatWithCopilot(activeScanId, history);
      if (conversation !== conversationRef.current) return;
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      if (conversation !== conversationRef.current) return;
      setMessages((prev) => [...prev, { role: "assistant", content: "Asistana ulaşılamadı. Biraz sonra tekrar deneyin." }]);
    } finally {
      if (conversation === conversationRef.current) setIsLoading(false);
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void send();
    }
  };

  return (
    <div
      className={`pointer-events-none fixed bottom-4 right-4 z-40 flex flex-col items-end gap-3 sm:bottom-6 ${
        isPanelOpen ? "sm:right-[384px]" : "sm:right-6"
      }`}
    >
      {isOpen && (
        <div
          id={panelId}
          role="dialog"
          aria-label="Asistan"
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              close();
            }
          }}
          className="pointer-events-auto flex h-[min(32rem,70vh)] w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 shadow-xl shadow-black/40 sm:w-96"
        >
          <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
            <div>
              <h2 className="text-sm font-medium text-zinc-100">Asistan</h2>
              <p className="text-xs text-zinc-400">Bulguları yorumlar, yeni bulgu üretmez.</p>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="Asistanı kapat"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
            >
              <X aria-hidden className="h-4 w-4" />
            </button>
          </div>

          <div ref={logRef} role="log" aria-live="polite" className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((msg, i) => (
              <div key={i} className={msg.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <p
                  className={`max-w-[85%] whitespace-pre-wrap break-words rounded-lg px-3 py-2 text-sm leading-relaxed ${
                    msg.role === "user" ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-100"
                  }`}
                >
                  <span className="sr-only">{msg.role === "user" ? "Siz: " : "Asistan: "}</span>
                  {msg.content}
                </p>
              </div>
            ))}
            {isLoading && (
              <p className="flex items-center gap-2 text-sm text-zinc-400">
                <LoaderCircle aria-hidden className="h-4 w-4 animate-spin" />
                Yanıt bekleniyor…
              </p>
            )}
          </div>

          <form onSubmit={send} className="border-t border-zinc-800 p-3">
            <label htmlFor={inputId} className="sr-only">
              Mesajınız
            </label>
            <div className="flex items-end gap-2">
              <textarea
                id={inputId}
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                maxLength={MAX_INPUT}
                rows={2}
                placeholder={activeScanId ? "Örn. öncelikli düzeltilmesi gereken bulgu hangisi?" : "Önce bir tarama başlatın"}
                className="block max-h-32 min-h-[2.75rem] flex-1 resize-none rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                aria-label="Gönder"
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-blue-600 text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
              >
                <Send aria-hidden className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      <button
        ref={toggleRef}
        type="button"
        onClick={() => (isOpen ? close() : setIsOpen(true))}
        aria-expanded={isOpen}
        aria-controls={isOpen ? panelId : undefined}
        className="pointer-events-auto inline-flex h-12 items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 px-4 text-sm font-medium text-zinc-100 shadow-lg shadow-black/40 hover:bg-zinc-800"
      >
        {isOpen ? <X aria-hidden className="h-4 w-4" /> : <MessageSquare aria-hidden className="h-4 w-4" />}
        {isOpen ? "Kapat" : "Asistan"}
      </button>
    </div>
  );
}
