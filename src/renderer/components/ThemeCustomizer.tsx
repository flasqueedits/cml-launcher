import React from "react";

interface Theme {
  id: string;
  name: string;
  accent: string;
  surface: string;
  bg: string;
}

const PRESETS: Theme[] = [
  { id: "default", name: "Varsayılan Turuncu", accent: "#c87b3a", surface: "#1a1612", bg: "#0f0d0a" },
  { id: "emerald", name: "Zümrüt Yeşil", accent: "#10b981", surface: "#0f1a14", bg: "#0a0f0d" },
  { id: "sapphire", name: "Safir Mavi", accent: "#3b82f6", surface: "#0f141a", bg: "#0a0d0f" },
  { id: "ruby", name: "Yakut Kırmızı", accent: "#ef4444", surface: "#1a0f0f", bg: "#0f0a0a" },
  { id: "amethyst", name: "Ametist Mor", accent: "#a855f7", surface: "#150f1a", bg: "#0d0a0f" },
  { id: "rose", name: "Gül Pembe", accent: "#f43f5e", surface: "#1a0f14", bg: "#0f0a0d" },
  { id: "cyan", name: "Cyan", accent: "#06b6d4", surface: "#0f1a1a", bg: "#0a0f0f" },
  { id: "amber", name: "Amber", accent: "#f59e0b", surface: "#1a170f", bg: "#0f0d0a" },
  { id: "slate", name: "Koyu Gri", accent: "#64748b", surface: "#12141a", bg: "#0a0b0f" },
  { id: "neon", name: "Neon Yeşil", accent: "#39ff14", surface: "#0a1a0f", bg: "#050f0a" },
];

interface Props {
  currentAccent: string;
  onThemeChange: (accent: string) => void;
  onClose: () => void;
}

export function ThemeCustomizer({ currentAccent, onThemeChange, onClose }: Props) {
  const [customColor, setCustomColor] = React.useState(currentAccent);

  const applyPreset = (theme: Theme) => {
    setCustomColor(theme.accent);
    onThemeChange(theme.accent);
    document.documentElement.style.setProperty("--accent", theme.accent);
    document.documentElement.style.setProperty("--surface", theme.surface);
    document.documentElement.style.setProperty("--bg", theme.bg);
  };

  const applyCustom = () => {
    onThemeChange(customColor);
    document.documentElement.style.setProperty("--accent", customColor);
  };

  return (
    <div className="glass-card relative z-50 w-[400px] max-h-[480px] rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold">🎨 Tema Özelleştirme</h2>
        <button onClick={onClose} className="text-text-dim hover:text-text text-sm">✕</button>
      </div>

      {/* Preset Themes */}
      <div className="mb-4">
        <label className="mb-2 block text-xs font-medium text-text-dim">Hazır Temalar</label>
        <div className="grid grid-cols-5 gap-2">
          {PRESETS.map((theme) => (
            <button
              key={theme.id}
              onClick={() => applyPreset(theme)}
              className={`group flex flex-col items-center gap-1 rounded-lg border p-2 transition ${currentAccent === theme.accent ? "border-accent bg-accent/20" : "border-border hover:border-border/80"}`}
              title={theme.name}
            >
              <div className="h-6 w-6 rounded-full border border-border" style={{ backgroundColor: theme.accent }} />
              <span className="text-[9px] text-text-dim group-hover:text-text">{theme.name.split(" ")[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Color */}
      <div className="mb-4">
        <label className="mb-2 block text-xs font-medium text-text-dim">Özel Renk</label>
        <div className="flex gap-2">
          <input
            type="color"
            value={customColor}
            onChange={(e) => setCustomColor(e.target.value)}
            className="h-9 w-9 cursor-pointer rounded-lg border border-border bg-transparent"
          />
          <input
            className="input-field flex-1"
            value={customColor}
            onChange={(e) => setCustomColor(e.target.value)}
            placeholder="#c87b3a"
          />
          <button onClick={applyCustom} className="play-button shrink-0 rounded-lg px-3 text-xs font-semibold text-white">
            Uygula
          </button>
        </div>
      </div>

      {/* Preview */}
      <div>
        <label className="mb-2 block text-xs font-medium text-text-dim">Önizleme</label>
        <div className="rounded-xl border border-border bg-surface/50 p-3">
          <div className="mb-2 flex items-center gap-2">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: customColor }} />
            <span className="text-xs font-medium" style={{ color: customColor }}>Örnek Metin</span>
          </div>
          <div className="mb-1 h-2 w-3/4 rounded bg-border/30" />
          <div className="mb-1 h-2 w-1/2 rounded bg-border/30" />
          <div className="flex gap-1">
            <div className="h-6 w-16 rounded" style={{ backgroundColor: customColor }} />
            <div className="h-6 w-16 rounded bg-border/30" />
          </div>
        </div>
      </div>
    </div>
  );
}
