import React from "react";
import type { PanelTab } from "../../shared/types";

interface Command {
  id: string;
  label: string;
  description: string;
  icon: string;
  tab?: PanelTab;
  action?: () => void;
  shortcut?: string;
  category: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onTabChange: (tab: PanelTab) => void;
  onAction: (id: string) => void;
}

const ALL_COMMANDS: Omit<Command, "action">[] = [
  // Navigasyon
  { id: "tab-play", label: "Oyna", description: "Ana oyun ekranına git", icon: "▶️", tab: "play", shortcut: "Ctrl+1", category: "Navigasyon" },
  { id: "tab-quick", label: "Hızlı Başlat", description: "Son oynanan sürümü başlat", icon: "⚡", tab: "quick-play", shortcut: "Ctrl+Q", category: "Navigasyon" },
  { id: "tab-servers", label: "Sunucular", description: "Sunucu listesini göster", icon: "🖥️", tab: "servers", shortcut: "Ctrl+2", category: "Navigasyon" },
  { id: "tab-mods", label: "Modlar", description: "Mod yönetim paneli", icon: "🔧", tab: "mods", shortcut: "Ctrl+3", category: "Navigasyon" },
  { id: "tab-textures", label: "Texture Pack", description: "Texture paketleri", icon: "📦", tab: "resource-packs", shortcut: "Ctrl+4", category: "Navigasyon" },
  { id: "tab-shaders", label: "Shader", description: "Shader paketleri", icon: "✨", tab: "shader-packs", shortcut: "Ctrl+5", category: "Navigasyon" },
  { id: "tab-skins", label: "Skin", description: "Skin yöneticisi", icon: "🧑", tab: "skins", shortcut: "Ctrl+6", category: "Navigasyon" },
  { id: "tab-worlds", label: "Dünyalar", description: "Dünya yönetimi", icon: "🌍", tab: "worlds", category: "Navigasyon" },
  { id: "tab-news", label: "Haberler", description: "Minecraft haberleri", icon: "📰", tab: "news", category: "Navigasyon" },
  { id: "tab-profiles", label: "Profiller", description: "Oyun profilleri", icon: "👤", tab: "profiles", category: "Navigasyon" },
  { id: "tab-screenshots", label: "Ekran Görüntüleri", description: "Screenshot galerisi", icon: "📸", tab: "screenshots", category: "Navigasyon" },
  { id: "tab-playtime", label: "Oyun Süresi", description: "Oyun istatistikleri", icon: "⏱️", tab: "playtime", category: "Navigasyon" },
  { id: "tab-crash", label: "Crash Logları", description: "Hata kayıtları", icon: "💥", tab: "crash-logs", category: "Navigasyon" },
  { id: "tab-updates", label: "Güncellemeler", description: "Launcher güncellemeleri", icon: "🔄", tab: "updates", category: "Navigasyon" },
  { id: "tab-mod-downloader", label: "Mod İndirici", description: "Online mod ara ve indir", icon: "🔍", tab: "mod-downloader", category: "Navigasyon" },
  { id: "tab-mod-loaders", label: "Mod Loader", description: "Forge/Fabric kur", icon: "⚙️", tab: "mod-loaders", category: "Navigasyon" },
  { id: "tab-modpacks", label: "Modpack", description: "Modpack ara ve kur", icon: "📚", tab: "modpacks", category: "Navigasyon" },
  { id: "tab-favorites", label: "Favoriler", description: "Favori sunucular", icon: "⭐", tab: "favorites", category: "Navigasyon" },
  { id: "tab-stats", label: "İstatistikler", description: "Oyun istatistikleri", icon: "📊", tab: "game-stats", category: "Navigasyon" },

  // Aksiyonlar
  { id: "action-play", label: "Oyunu Başlat", description: "Minecraft'ı başlat", icon: "🎮", shortcut: "Ctrl+Enter", category: "Aksiyon" },
  { id: "action-settings", label: "Ayarlar", description: "Ayarları aç", icon: "⚙️", shortcut: "Ctrl+,", category: "Aksiyon" },
  { id: "action-theme", label: "Tema Değiştir", description: "Tema özelleştirme panelini aç", icon: "🎨", category: "Aksiyon" },
  { id: "action-java", label: "Java Kontrol", description: "Java kurulumunu kontrol et", icon: "☕", category: "Aksiyon" },
  { id: "action-discord", label: "Discord Bağlan", description: "Discord RPC'yi bağla", icon: "💜", category: "Aksiyon" },
  { id: "action-news", label: "Haberleri Yenile", description: "Minecraft haberlerini yenile", icon: "📰", category: "Aksiyon" },
  { id: "action-refresh", label: "Modları Yenile", description: "Mod listesini yenile", icon: "🔄", category: "Aksiyon" },
  { id: "action-backup", label: "Dünya Yedekle", description: "Aktif dünyayı yedekle", icon: "💾", category: "Aksiyon" },
  { id: "action-open-dir", label: "Klasörü Aç", description: "Oyun klasörünü aç", icon: "📁", category: "Aksiyon" },
  { id: "action-logout", label: "Çıkış Yap", description: "Hesaptan çıkış yap", icon: "🚪", category: "Aksiyon" },
];

export function CommandPalette({ visible, onClose, onTabChange, onAction }: Props) {
  const [query, setQuery] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const commands = React.useMemo(() => {
    const mapped: Command[] = ALL_COMMANDS.map((c) => ({
      ...c,
      action: c.tab ? () => onTabChange(c.tab!) : () => onAction(c.id),
    }));
    if (!query.trim()) return mapped;
    const q = query.toLowerCase();
    return mapped.filter(
      (c) => c.label.toLowerCase().includes(q) || c.description.toLowerCase().includes(q) || c.category.toLowerCase().includes(q)
    );
  }, [query, onTabChange, onAction]);

  React.useEffect(() => {
    if (visible) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [visible]);

  React.useEffect(() => { setSelectedIndex(0); }, [query]);

  const executeCommand = (cmd: Command) => {
    cmd.action?.();
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex((i) => Math.min(i + 1, commands.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIndex((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter" && commands[selectedIndex]) { executeCommand(commands[selectedIndex]); }
    else if (e.key === "Escape") { onClose(); }
  };

  if (!visible) return null;

  const categories = [...new Set(commands.map((c) => c.category))];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="glass-card relative w-[520px] rounded-2xl border border-border/50 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Search */}
        <div className="flex items-center gap-3 border-b border-border/30 px-4 py-3">
          <span className="text-text-dim text-sm">🔍</span>
          <input
            ref={inputRef}
            className="flex-1 bg-transparent text-sm text-text outline-none placeholder:text-text-dim"
            placeholder="Komut ara... (örn: tema, ayarlar, oyna)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <kbd className="rounded border border-border bg-surface/50 px-1.5 py-0.5 text-[10px] text-text-dim">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-[320px] overflow-y-auto p-2">
          {commands.length === 0 && (
            <div className="py-8 text-center text-sm text-text-dim">Sonuç bulunamadı</div>
          )}
          {categories.map((cat) => {
            const catCommands = commands.filter((c) => c.category === cat);
            if (catCommands.length === 0) return null;
            return (
              <div key={cat} className="mb-2">
                <div className="mb-1 px-2 text-[10px] font-medium uppercase tracking-wider text-text-dim">{cat}</div>
                {catCommands.map((cmd) => {
                  const globalIdx = commands.indexOf(cmd);
                  return (
                    <button
                      key={cmd.id}
                      onClick={() => executeCommand(cmd)}
                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition ${globalIdx === selectedIndex ? "bg-accent/20 text-text" : "text-text-dim hover:bg-surface/50"}`}
                    >
                      <span className="text-base">{cmd.icon}</span>
                      <div className="flex-1">
                        <div className="text-xs font-medium">{cmd.label}</div>
                        <div className="text-[10px] text-text-dim">{cmd.description}</div>
                      </div>
                      {cmd.shortcut && (
                        <kbd className="rounded border border-border bg-surface/50 px-1.5 py-0.5 text-[10px] text-text-dim">{cmd.shortcut}</kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border/30 px-4 py-2 text-[10px] text-text-dim">
          <span>{commands.length} komut</span>
          <div className="flex gap-2">
            <span>↑↓</span>
            <span>Enter</span>
            <span>ESC</span>
          </div>
        </div>
      </div>
    </div>
  );
}
