import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Send, Sparkles } from "lucide-react";
import { useDataset } from "@/lib/data-store";
import { summarizeForAi } from "@/lib/eda";

const SUGGESTIONS = [
  "Summarize this dataset in 3 bullet points",
  "What are the top drivers of the target?",
  "Which segment underperforms and why?",
  "Predict the next period's trend",
];

export function ChatPanel() {
  const { rows, profile } = useDataset();
  const datasetContext = useMemo(
    () => (profile ? summarizeForAi(profile, rows) : ""),
    [profile, rows],
  );

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: () => ({ datasetContext }),
      }),
    [datasetContext],
  );

  const { messages, sendMessage, status } = useChat({ transport });
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const busy = status === "submitted" || status === "streaming";

  const submit = (text: string) => {
    if (!text.trim() || busy) return;
    void sendMessage({ text });
    setInput("");
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  return (
    <div className="flex h-[560px] flex-col">
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto pr-2">
        {messages.length === 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              Ask anything about your data
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => submit(s)}
                  className="glass rounded-xl px-3 py-2 text-left text-xs text-muted-foreground transition hover:text-foreground hover:glow"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m) => {
          const text = m.parts
            .map((p) => (p.type === "text" ? p.text : ""))
            .join("");
          return (
            <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "glass text-foreground"
                }`}
              >
                <div className="prose prose-sm prose-invert max-w-none prose-p:my-1 prose-ul:my-1">
                  <ReactMarkdown>{text || "…"}</ReactMarkdown>
                </div>
              </div>
            </div>
          );
        })}
        {busy && messages[messages.length - 1]?.role === "user" && (
          <div className="flex justify-start">
            <div className="glass flex items-center gap-1 rounded-2xl px-4 py-3">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.2s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.1s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" />
            </div>
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(input);
        }}
        className="glass mt-3 flex items-center gap-2 rounded-2xl p-2"
      >
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={profile ? "Ask your data anything…" : "Upload a dataset to start chatting"}
          disabled={!profile || busy}
          className="flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          disabled={!input.trim() || busy || !profile}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
