import React from "react";

interface LogLine { line: string; level: string; }

export function ConsoleFilterPanel({ logs }: { logs: LogLine[] }) {
  const [filter, setFilter] = React.useState("");
  const [levelFilter, setLevelFilter] = React.useState<string>("all");
  const [autoScroll, setAutoScroll] = React.useState(true);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const filtered = React.useMemo(() => {
    return logs.filter((l) => {
      if (levelFilter !== "all" && l.level !== levelFilter) return false;
      if (filter && !l.line.toLowerCase().includes(filter.toLowerCase())) return false;
      return true;
    });
  }, [logs, filter, levelFilter]);

  React.useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [filtered.length, autoScroll]);

  const levelColor = (level: string) => {
    if (level === "error") return "text-red-400";
    if (level === "warn") return "text-yellow-400";
    if (level === "debug") return "text-gray-400";
    if (level === "game") return "text-green-400";
    return "text-white/70";
  };

  const levelCounts = React.useMemo(() => {
    const counts: Record<string, number> = { all: logs.length, info: 0, warn: 0, error: 0, debug: 0, game: 0 };
    logs.forEach((l) => { if (counts[l.level] !== undefined) counts[l.level]++; });
    return counts;
  }, [logs]);

  return (
    <div className="glass-card flex h-full flex-col rounded-xl border border-border/30 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-accent">Konsol Filtresi</h2>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1 text-xs text-white/50">
            <input type="checkbox" checked={autoScroll} onChange={(e) => setAutoScroll(e.target.checked)} className="accent-accent" />
            Otomatik Kaydır
          </label>
          <span className="text-xs text-white/40">{filtered.length} / {logs.length} satır</span>
        </div>
      </div>
      <div className="mb-3 flex items-center gap-2">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Log ara... (sunucu, hata, mod adı)"
          className="flex-1 rounded-lg border border-border/30 bg-white/5 px-3 py-1.5 text-sm text-white placeholder-white/30 outline-none focus:border-accent/50"
        />
        <div className="flex gap-1">
          {(["all", "info", "warn", "error", "debug", "game"] as const).map((lvl) => (
            <button
              key={lvl}
              onClick={() => setLevelFilter(lvl)}
              className={`rounded-md px-2 py-1 text-xs font-medium transition-all ${levelFilter === lvl ? "bg-accent/20 text-accent border border-accent/40" : "bg-white/5 text-white/40 border border-transparent hover:text-white/60"}`}
            >
              {lvl === "all" ? "Tümü" : lvl.toUpperCase()} <span className="ml-1 opacity-60">{levelCounts[lvl]}</span>
            </button>
          ))}
        </div>
      </div>
      <div ref={containerRef} className="flex-1 overflow-y-auto rounded-lg border border-border/20 bg-black/30 p-2 font-mono text-xs">
        {filtered.length === 0 && <div className="py-8 text-center text-white/30">Filtreye uyan log yok</div>}
        {filtered.map((l, i) => (
          <div key={i} className={`whitespace-pre-wrap break-all py-0.5 ${levelColor(l.level)}`}>
            <span className="mr-2 inline-block w-12 text-right text-white/20">{i + 1}</span>
            <span className="mr-2 inline-block w-10 text-[10px] uppercase opacity-50">[{l.level}]</span>
            {l.line}
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <button onClick={() => { navigator.clipboard.writeText(filtered.map((l) => l.line).join("\n")); }} className="glass-button rounded-lg px-3 py-1.5 text-xs text-white/70 hover:text-accent">
          Kopyala
        </button>
        <button onClick={() => { const blob = new Blob([filtered.map((l) => l.line).join("\n")], { type: "text/plain" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `console-${new Date().toISOString().slice(0, 10)}.log`; a.click(); }} className="glass-button rounded-lg px-3 py-1.5 text-xs text-white/70 hover:text-accent">
          Kaydet
        </button>
      </div>
    </div>
  );
}
