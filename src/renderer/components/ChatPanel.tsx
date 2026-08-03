import React from "react";
import type { ServerInfo } from "../../shared/types";

interface ChatMessage {
  id: string;
  user: string;
  text: string;
  timestamp: number;
  isSystem: boolean;
}

interface Props {
  currentServer: ServerInfo | null;
  username: string;
}

export function ChatPanel({ currentServer, username }: Props) {
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    { id: "0", user: "Sistem", text: "Chat'e hoş geldiniz! Bu sohbet launcher içindir.", timestamp: Date.now(), isSystem: true },
  ]);
  const [input, setInput] = React.useState("");
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const msg: ChatMessage = {
      id: Date.now().toString(),
      user: username || "Anonim",
      text: input.trim(),
      timestamp: Date.now(),
      isSystem: false,
    };
    setMessages((prev) => [...prev, msg]);
    setInput("");

    // Bot odpowiedź (eğlence amaçlı)
    setTimeout(() => {
      const responses = [
        "Mesajınız alındı! 👍",
        "İlginç bir şey söyledin! 🤔",
        "Devam et! 🎮",
        "Harika! ✨",
        "Anlaşıldı! 👌",
        "Bu konuda haklısın! 💯",
        "Minecraft her zaman güzeldir! ⛏️",
        "Bir dahaki sefere daha iyi olur! 🌟",
      ];
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        user: "CML Bot",
        text: responses[Math.floor(Math.random() * responses.length)],
        timestamp: Date.now(),
        isSystem: false,
      };
      setMessages((prev) => [...prev, botMsg]);
    }, 800);
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="glass-card relative z-10 w-[420px] h-[500px] rounded-2xl p-5 flex flex-col">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold">💬 Sohbet</h2>
        {currentServer && (
          <span className="text-[10px] text-text-dim">📍 {currentServer.name}</span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-2 mb-3">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-2 ${msg.isSystem ? "justify-center" : ""}`}>
            {msg.isSystem ? (
              <div className="rounded-lg bg-surface/50 px-3 py-1 text-[10px] text-text-dim italic">{msg.text}</div>
            ) : (
              <>
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/30 text-[10px] font-bold text-accent">
                  {msg.user[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[11px] font-medium text-accent">{msg.user}</span>
                    <span className="text-[9px] text-text-dim">{formatTime(msg.timestamp)}</span>
                  </div>
                  <div className="text-xs text-text">{msg.text}</div>
                </div>
              </>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          className="input-field flex-1"
          placeholder="Mesaj yaz..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage} className="play-button shrink-0 rounded-lg px-3 text-xs font-semibold text-white">
          ➤
        </button>
      </div>
    </div>
  );
}
