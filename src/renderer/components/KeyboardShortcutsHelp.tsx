import React from "react";

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

const shortcuts: Shortcut[] = [
  { keys: ["Ctrl", "K"], description: "Komut Paleti", category: "Genel" },
  { keys: ["Ctrl", ","], description: "Ayarları Aç", category: "Genel" },
  { keys: ["Ctrl", "Enter"], description: "Hızlı Oyna", category: "Genel" },
  { keys: ["Ctrl", "Q"], description: "Hızlı Başlat Sekmesi", category: "Gezinme" },
  { keys: ["Ctrl", "T"], description: "Tema Özelleştirici", category: "Genel" },
  { keys: ["Ctrl", "1-9"], description: "Sekme Hızlı Erişimi", category: "Gezinme" },
  { keys: ["Esc"], description: "Paneli Kapat", category: "Genel" },
];

const categories = [...new Set(shortcuts.map((s) => s.category))];

export function KeyboardShortcutsHelp({ onClose }: { onClose: () => void }) {
  const [search, setSearch] = React.useState("");

  const filtered = shortcuts.filter((s) =>
    !search || s.description.toLowerCase().includes(search.toLowerCase()) || s.keys.join(" ").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="glass-card relative z-50 mx-auto w-full max-w-lg rounded-2xl border border-border/30 p-6 shadow-2xl">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-accent">Klavye Kısayolları</h2>
        <button onClick={onClose} className="text-white/40 hover:text-white">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
      </div>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Kısayol ara..."
        className="mb-4 w-full rounded-lg border border-border/30 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-accent/50"
        autoFocus
      />
      <div className="max-h-80 overflow-y-auto">
        {categories.map((cat) => {
          const catShortcuts = filtered.filter((s) => s.category === cat);
          if (catShortcuts.length === 0) return null;
          return (
            <div key={cat} className="mb-3">
              <div className="mb-1 text-xs font-medium uppercase text-white/30">{cat}</div>
              {catShortcuts.map((s, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-white/5">
                  <span className="text-sm text-white/70">{s.description}</span>
                  <div className="flex gap-1">
                    {s.keys.map((k) => (
                      <kbd key={k} className="rounded border border-border/40 bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-white/60">{k}</kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
