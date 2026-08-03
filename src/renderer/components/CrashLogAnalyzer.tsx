import React from "react";
import type { CrashLog } from "../../shared/types";

interface Props {
  logs: CrashLog[];
  onRefresh: () => void;
}

export function CrashLogAnalyzer({ logs, onRefresh }: Props) {
  const [selected, setSelected] = React.useState<string | null>(null);
  const [analysis, setAnalysis] = React.useState<{ cause: string; suggestion: string } | null>(null);
  const [analyzing, setAnalyzing] = React.useState(false);

  const handleAnalyze = async (log: CrashLog) => {
    setSelected(log.id);
    setAnalyzing(true);
    const result = await window.api.analyzeCrashLog(log.stackTrace);
    setAnalysis(result);
    setAnalyzing(false);
  };

  return (
    <div className="glass-card relative z-10 w-[420px] max-h-[500px] rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold">Crash Log Analizi</h2>
        <button onClick={onRefresh} className="icon-button !h-6 !w-6" title="Yenile"><svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg></button>
      </div>
      <div className="max-h-[380px] space-y-2 overflow-y-auto">
        {logs.length === 0 && <div className="py-8 text-center text-sm text-text-dim">Crash log bulunamadı.</div>}
        {logs.map((l) => (
          <div key={l.id} className={`rounded-xl border p-3 ${selected === l.id ? "border-accent bg-accent-dim/20" : "border-border bg-surface/50"}`}>
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-text">{l.exception}</div>
                <div className="truncate text-[10px] text-text-dim">{l.message}</div>
              </div>
              <button onClick={() => handleAnalyze(l)} className="shrink-0 rounded-lg bg-amber-600 px-3 py-1 text-[10px] font-semibold text-white hover:bg-amber-500">
                {analyzing && selected === l.id ? "..." : "Analiz Et"}
              </button>
            </div>
            {selected === l.id && analysis && (
              <div className="mt-3 space-y-2 rounded-lg bg-surface-2 p-3">
                <div><span className="text-[10px] font-semibold text-accent">Sebep:</span> <span className="text-xs text-text">{analysis.cause}</span></div>
                <div><span className="text-[10px] font-semibold text-accent">Öneri:</span> <span className="text-xs text-text-dim">{analysis.suggestion}</span></div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
