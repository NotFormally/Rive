"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useTranslations } from "next-intl";
import { X, Send, Sparkles, Navigation2, LifeBuoy, Check } from "lucide-react";

const transport = new DefaultChatTransport({ api: "/api/assistant" });

export default function Pilote() {
  const t = useTranslations("Pilote");
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [errorCount, setErrorCount] = useState(0);
  const [reportSent, setReportSent] = useState(false);
  const [sendingReport, setSendingReport] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, error } = useChat({
    transport,
    messages: [
      {
        id: "welcome",
        role: "assistant" as const,
        parts: [
          {
            type: "text" as const,
            text: t("welcome"),
          },
        ],
      },
    ],
  });

  const isLoading = status === "submitted" || status === "streaming";

  // Track errors for support reporting
  useEffect(() => {
    if (error) {
      setErrorCount((prev) => prev + 1);
    }
  }, [error]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input.trim() });
    setInput("");
  };

  // Extract text content from message parts
  const getMessageText = (msg: (typeof messages)[number]): string => {
    if (!msg.parts) return "";
    return msg.parts
      .filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join("");
  };

  const handleSendReport = async () => {
    if (sendingReport || reportSent) return;
    setSendingReport(true);

    try {
      const chatLog = messages.map((msg) => ({
        role: msg.role,
        text: getMessageText(msg),
        id: msg.id,
      }));

      await fetch("/api/support-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_log: chatLog,
          error_details: error?.message || t("error_count", { count: errorCount }),
        }),
      });

      setReportSent(true);
    } catch {
      // Silently fail — user already has an error
    } finally {
      setSendingReport(false);
    }
  };

  const quickPrompts = [
    { icon: "\u{1F4B0}", label: t("qp1_label"), prompt: t("qp1_prompt") },
    { icon: "\u{1F4CB}", label: t("qp2_label"), prompt: t("qp2_prompt") },
    { icon: "\u{1F4C8}", label: t("qp3_label"), prompt: t("qp3_prompt") },
    { icon: "\u{1F37D}\uFE0F", label: t("qp4_label"), prompt: t("qp4_prompt") },
    { icon: "\u{1F4DD}", label: t("qp5_label"), prompt: t("qp5_prompt") },
  ];

  const handleQuickPrompt = (prompt: string) => {
    if (isLoading) return;
    sendMessage({ text: prompt });
  };

  // Show support button if there are errors or if the conversation has 3+ messages
  const showSupportButton = errorCount > 0 || messages.length >= 4;

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 p-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95 flex items-center gap-2 group"
        >
          <Sparkles className="w-5 h-5 group-hover:animate-pulse" />
          <span className="font-semibold text-sm mr-1 hidden sm:block">
            {t("btn_label")}
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] h-[550px] bg-white rounded-2xl shadow-2xl flex flex-col border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-200">
          {/* Header */}
          <div className="bg-indigo-600 p-4 flex items-center justify-between shadow-sm z-10">
            <div className="flex items-center gap-3 text-white">
              <div className="bg-white/20 p-2 rounded-full">
                <Navigation2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight">
                  {t("title")}
                </h3>
                <p className="text-xs text-indigo-100/80">
                  {t("subtitle")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {showSupportButton && (
                <button
                  onClick={handleSendReport}
                  disabled={sendingReport || reportSent}
                  title={reportSent ? t("report_sent") : t("tooltip_report")}
                  className={`p-1.5 rounded-full transition-colors ${
                    reportSent
                      ? "bg-green-500/30 text-green-200"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {reportSent ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <LifeBuoy className="w-4 h-4" />
                  )}
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/70 hover:text-white transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  (msg.role as string) === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-sm ${
                    (msg.role as string) === "user"
                      ? "bg-slate-900 text-white rounded-tr-sm"
                      : "bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm"
                  }`}
                  style={{ whiteSpace: "pre-wrap" }}
                >
                  {getMessageText(msg)}
                </div>
              </div>
            ))}

            {/* Error banner */}
            {error && !isLoading && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 space-y-2">
                <p>{t("error_message")}</p>
                {!reportSent && (
                  <button
                    onClick={handleSendReport}
                    disabled={sendingReport}
                    className="flex items-center gap-1.5 text-red-600 hover:text-red-800 font-medium"
                  >
                    <LifeBuoy className="w-3.5 h-3.5" />
                    {sendingReport ? t("btn_sending") : t("btn_report")}
                  </button>
                )}
                {reportSent && (
                  <p className="text-green-700 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> {t("report_sent_confirm")}
                  </p>
                )}
              </div>
            )}

            {/* Suggested Prompts (only show at start) */}
            {messages.length === 1 && !isLoading && (
              <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-slate-200/60">
                <p className="text-xs font-semibold text-slate-500 px-1 uppercase tracking-wider">
                  {t("quick_prompts_title")}
                </p>
                <div className="flex flex-col gap-2">
                  {quickPrompts.map((qp) => (
                    <button
                      key={qp.label}
                      onClick={() => handleQuickPrompt(qp.prompt)}
                      className="text-left bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-700 text-xs p-2.5 rounded-xl transition-colors shadow-sm"
                    >
                      <span className="text-indigo-600 mr-2">{qp.icon}</span>
                      {qp.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-2xl p-3 rounded-tl-sm shadow-sm flex gap-1">
                  <div
                    className="w-2 h-2 rounded-full bg-slate-300 animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <div
                    className="w-2 h-2 rounded-full bg-slate-300 animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <div
                    className="w-2 h-2 rounded-full bg-slate-300 animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form
            onSubmit={handleSubmit}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("placeholder")}
              className="flex-1 bg-slate-100 border-transparent focus:bg-white focus:border-indigo-500 text-sm px-4 py-2.5 rounded-full outline-none transition-all shadow-sm"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed hidden sm:block shadow-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
