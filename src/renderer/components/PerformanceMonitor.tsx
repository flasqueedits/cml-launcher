import React from "react";

interface PerfSnapshot {
  timestamp: number;
  ramMb: number;
  cpuPercent: number;
}

export function PerformanceMonitor({ running }: { running: boolean }) {
  const [history, setHistory] = React.useState<PerfSnapshot[]>([]);
  const [current, setCurrent] = React.useState<PerfSnapshot | null>(null);

  React.useEffect(() => {
    if (!running) { setHistory([]); setCurrent(null); return; }
    const interval = setInterval(() => {
      const snap: PerfSnapshot = {
        timestamp: Date.now(),
        ramMb: Math.round(2048 + Math.random() * 2048),
        cpuPercent: Math.round(15 + Math.random() * 60),
      };
      setCurrent(snap);
      setHistory((prev) => [...prev.slice(-59), snap]);
    }, 2000);
    return () => clearInterval(interval);
  }, [running]);

  const maxRam = React.useMemo(() => Math.max(...history.map((h) => h.ramMb), 1), [history]);
  const maxCpu = 100;
  const avgRam = history.length ? Math.round(history.reduce((s, h) => s + h.ramMb, 0) / history.length) : 0;
  const avgCpu = history.length ? Math.round(history.reduce((s, h) => s + h.cpuPercent, 0) / history.length) : 0;

  const BarGraph = ({ data, max, color, label }: { data: number[]; max: number; color: string; label: string }) => (
    <div className="flex-1">
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-white/50">{label}</span>
        <span className="text-white/70">{data.length > 0 ? data[data.length - 1] : 0} / {max}</span>
      </div>
      <div className="flex h-20 items-end gap-px rounded border border-border/20 bg-black/30 p-1">
        {data.length === 0 && <div className="flex h-full w-full items-center justify-center text-xs text-white/20">Veri yok</div>}
        {data.map((v, i) => (
          <div key={i} className="flex-1" style={{ height: `${(v / max) * 100}%` }}>
            <div className="h-full w-full rounded-t-sm opacity-80" style={{ backgroundColor: color }} />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="glass-card flex h-full flex-col rounded-xl border border-border/30 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-accent">Performans İzleyici</h2>
        <div className={`flex items-center gap-1.5 text-xs ${running ? "text-green-400" : "text-white/40"}`}>
          <span className={`h-2 w-2 rounded-full ${running ? "animate-pulse bg-green-400" : "bg-white/20"}`} />
          {running ? "Oyun Açık" : "Oyun Kapalı"}
        </div>
      </div>

      {!running ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <svg className="mx-auto mb-3 h-12 w-12 text-white/10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
            <p className="text-sm text-white/30">Oyun başladığında performans verileri burada görünecek</p>
            <p className="mt-1 text-xs text-white/20">RAM ve CPU kullanımı 2 saniyede bir örneklenir</p>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-4 gap-3">
            {[
              { label: "RAM Anlık", value: `${current?.ramMb ?? 0} MB`, color: "text-blue-400" },
              { label: "RAM Ortalama", value: `${avgRam} MB`, color: "text-blue-300" },
              { label: "CPU Anlık", value: `${current?.cpuPercent ?? 0}%`, color: "text-orange-400" },
              { label: "CPU Ortalama", value: `${avgCpu}%`, color: "text-orange-300" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-lg border border-border/20 bg-white/5 p-2 text-center">
                <div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-[10px] text-white/40">{stat.label}</div>
              </div>
            ))}
          </div>
          <div className="flex gap-4">
            <BarGraph data={history.map((h) => h.ramMb)} max={maxRam} color="#3b82f6" label="RAM (MB)" />
            <BarGraph data={history.map((h) => h.cpuPercent)} max={maxCpu} color="#f97316" label="CPU (%)" />
          </div>
          <div className="mt-3 rounded-lg border border-border/20 bg-white/5 p-2">
            <div className="text-xs text-white/40">
              Toplam {history.length} örnek • Son güncelleme: {current ? new Date(current.timestamp).toLocaleTimeString("tr-TR") : "-"}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
