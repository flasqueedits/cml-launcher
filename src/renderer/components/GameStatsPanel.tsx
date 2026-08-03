import React from "react";
import type { GameStats } from "../../shared/types";

interface Props {
  stats: GameStats | null;
}

function formatMs(ms: number): string {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h > 24) {
    const d = Math.floor(h / 24);
    const rh = h % 24;
    return `${d}g ${rh}sa`;
  }
  if (h > 0) return `${h}sa ${m}dk`;
  return `${m}dk`;
}

function BarChart({ data }: { data: { date: string; ms: number }[] }) {
  const maxMs = Math.max(...data.map((d) => d.ms), 1);
  return (
    <div className="flex items-end gap-1 h-20">
      {data.map((d) => {
        const height = Math.max((d.ms / maxMs) * 100, 2);
        const dayLabel = new Date(d.date).toLocaleDateString("tr-TR", { weekday: "narrow" });
        return (
          <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
            <div className="w-full rounded-t bg-accent/70 transition-all" style={{ height: `${height}%` }} title={formatMs(d.ms)} />
            <span className="text-[8px] text-text-dim">{dayLabel}</span>
          </div>
        );
      })}
    </div>
  );
}

export function GameStatsPanel({ stats }: Props) {
  if (!stats) return <div className="glass-card relative z-10 w-[420px] rounded-2xl p-5 text-center text-sm text-text-dim">İstatistikler yükleniyor...</div>;

  const statItems = [
    { label: "Toplam Süre", value: formatMs(stats.totalPlayTimeMs), icon: "⏱️" },
    { label: "Oturum Sayısı", value: String(stats.totalSessions), icon: "🎮" },
    { label: "Sürüm Çeşidi", value: String(stats.uniqueVersions), icon: "📦" },
    { label: "Favori Sürüm", value: stats.favoriteVersion || "-", icon: "⭐" },
    { label: "Mod Sayısı", value: String(stats.totalMods), icon: "🔧" },
    { label: "Texture Pack", value: String(stats.totalResourcePacks), icon: "🎨" },
    { label: "Dünya Sayısı", value: String(stats.totalWorlds), icon: "🌍" },
    { label: "Ekran Görüntüsü", value: String(stats.totalScreenshots), icon: "📸" },
    { label: "Crash Sayısı", value: String(stats.crashCount), icon: "💥" },
  ];

  return (
    <div className="glass-card relative z-10 w-[420px] max-h-[500px] rounded-2xl p-5">
      <h2 className="mb-4 text-base font-semibold">Oyun İstatistikleri</h2>

      <div className="mb-4 rounded-xl border border-accent/30 bg-accent-dim/20 p-4">
        <div className="mb-2 text-[10px] uppercase tracking-wider text-text-dim">Son 7 Gün</div>
        <BarChart data={stats.dailyPlaytime} />
      </div>

      <div className="grid grid-cols-3 gap-2">
        {statItems.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-surface/50 p-3 text-center">
            <div className="mb-1 text-lg">{s.icon}</div>
            <div className="text-sm font-bold text-accent">{s.value}</div>
            <div className="text-[9px] text-text-dim">{s.label}</div>
          </div>
        ))}
      </div>

      {stats.lastPlayed && (
        <div className="mt-3 text-center text-[10px] text-text-dim">
          Son oynama: {new Date(stats.lastPlayed).toLocaleDateString("tr-TR")}
        </div>
      )}
    </div>
  );
}
