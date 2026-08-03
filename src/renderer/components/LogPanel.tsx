import React from "react";
import type { LogLevel } from "../../shared/types";

type Line = { id: number; level: LogLevel; text: string };

interface Props {
  lines: Line[];
  running: boolean;
  visible: boolean;
  onClose: () => void;
}

const LEVEL_COLOR: Record<LogLevel, string> = {
  info: "text-sky-300",
  warn: "text-amber-300",
  error: "text-red-400",
  debug: "text-text-dim",
  game: "text-text",
};

export function LogPanel({ lines, running, visible, onClose }: Props) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [lines]);

  if (!visible) return null;

  return (
    <div className="glass-card absolute bottom-0 left-0 right-0 z-30 flex h-[280px] flex-col rounded-t-2xl">
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-text-dim">Günlük</span>
          {running && (
            <span className="flex items-center gap-1 text-[10px] text-accent-bright">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
              Çalışıyor
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="rounded p-1 text-text-dim hover:bg-surface-2 hover:text-text"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="2" y1="2" x2="10" y2="10" />
            <line x1="10" y1="2" x2="2" y2="10" />
          </svg>
        </button>
      </div>
      <div ref={ref} className="flex-1 overflow-y-auto px-4 py-2 font-mono text-[11px] leading-relaxed">
        {lines.length === 0 && (
          <div className="text-text-dim">Oyunu başlatınca çıktı burada görünür.</div>
        )}
        {lines.map((l) => (
          <div key={l.id} className={`whitespace-pre-wrap ${LEVEL_COLOR[l.level]}`}>
            {l.text}
          </div>
        ))}
      </div>
    </div>
  );
}
