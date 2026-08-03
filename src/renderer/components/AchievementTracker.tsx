import React from "react";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  maxProgress?: number;
}

const MC_ACHIEVEMENTS: Achievement[] = [
  // İlerleme
  { id: "wood", name: "Tahta Toplama", description: "Bir ağacı kes", icon: "🪵", category: "İlerleme", unlocked: false },
  { id: "craft_table", name: "Çalışma Tezgahı", description: "Bir çalışma tezgahı yap", icon: "🔨", category: "İlerleme", unlocked: false },
  { id: "pickaxe", name: "Kazma Yapımı", description: "Bir kazma yap", icon: "⛏️", category: "İlerleme", unlocked: false },
  { id: "stone_pickaxe", name: "Taş Kazma", description: "Bir taş kazma yap", icon: "⛏️", category: "İlerleme", unlocked: false },
  { id: "iron", name: "Demir Bulma", description: "Demir cevheri bul", icon: "🪨", category: "İlerleme", unlocked: false },
  { id: "diamond", name: "Elmas Bulma", description: "Elmas cevheri bul", icon: "💎", category: "İlerleme", unlocked: false },
  { id: "netherite", name: "Netherite Bulma", description: "Netherite cevheri bul", icon: "⬛", category: "İlerleme", unlocked: false },
  { id: "enchant", name: "Büyülama", description: "Bir eşyayı büyül", icon: "✨", category: "İlerleme", unlocked: false },
  { id: "anvil", name: "Örs", description: "Bir örs yap", icon: "🔨", category: "İlerleme", unlocked: false },
  { id: "beacon", name: "Fener", description: "Bir fener yap", icon: "🗼", category: "İlerleme", unlocked: false },
  { id: "conduit", name: "Kanalizasyon", description: "Bir kanalizasyon yap", icon: "🌊", category: "İlerleme", unlocked: false },
  { id: "elytra", name: "Elytra", description: "Elytra bul", icon: "🪽", category: "İlerleme", unlocked: false },
  { id: "shulker", name: "Shulker Kutu", description: "Bir shulker kutu yap", icon: "📦", category: "İlerleme", unlocked: false },
  { id: "totem", name: "Ölüm Totemi", description: "Bir ölüm totemi al", icon: "🗿", category: "İlerleme", unlocked: false },
  { id: "trident", name: "Üç Dişli Mızrak", description: "Bir üç dişli mızrak bul", icon: "🔱", category: "İlerleme", unlocked: false },

  // Savaş
  { id: "kill_creeper", name: "Creeper Avı", description: "Bir creeper öldür", icon: "💚", category: "Savaş", unlocked: false },
  { id: "kill_zombie", name: "Zombi Avı", description: "Bir zombi öldür", icon: "🧟", category: "Savaş", unlocked: false },
  { id: "kill_skeleton", name: "İskelet Avı", description: "Bir iskelet öldür", icon: "💀", category: "Savaş", unlocked: false },
  { id: "kill_enderman", name: "Enderman Avı", description: "Bir enderman öldür", icon: "🖤", category: "Savaş", unlocked: false },
  { id: "kill_spider", name: "Örümcek Avı", description: "Bir örümcek öldür", icon: "🕷️", category: "Savaş", unlocked: false },
  { id: "kill_ghast", name: "Ghast Avı", description: "Bir ghast öldür", icon: "👻", category: "Savaş", unlocked: false },
  { id: "kill_blaze", name: "Blaze Avı", description: "Bir blaze öldür", icon: "🔥", category: "Savaş", unlocked: false },
  { id: "kill_wither", name: "Wither Yenilgisi", description: "Wither'ı öldür", icon: "💀", category: "Savaş", unlocked: false },
  { id: "kill_dragon", name: "Ejderha Yenilgisi", description: "Ender Dragon'u öldür", icon: "🐉", category: "Savaş", unlocked: false },
  { id: "kill_warden", name: "Warden Yenilgisi", description: "Warden'ı öldür", icon: "👁️", category: "Savaş", unlocked: false },

  // Keşif
  { id: "village", name: "Köy Keşfi", description: "Bir köy bul", icon: "🏘️", category: "Keşif", unlocked: false },
  { id: "stronghold", name: "Güçlü Kale", description: "Bir güçlü kale bul", icon: "🏰", category: "Keşif", unlocked: false },
  { id: "end_city", name: "End Şehri", description: "Bir End şehri bul", icon: "🏙️", category: "Keşif", unlocked: false },
  { id: "nether_fortress", name: "Nether Kale", description: "Bir Nether kalesi bul", icon: "🏰", category: "Keşif", unlocked: false },
  { id: "ocean_monument", description: "Bir okyanus anıtı bul", name: "Okyanus Anıtı", icon: "🏛️", category: "Keşif", unlocked: false },
  { id: "woodland_mansion", name: "Orman Konak", description: "Bir orman konağı bul", icon: "🏚️", category: "Keşif", unlocked: false },
  { id: "trail_ruins", name: "Patika Harabeleri", description: "Bir patika harabeleri bul", icon: "🏚️", category: "Keşif", unlocked: false },
  { id: "ancient_city", name: "Antik Şehir", description: "Bir antik şehir bul", icon: "🌃", category: "Keşif", unlocked: false },
  { id: "mansion", name: "Mansion", description: "Bir mansion bul", icon: "🏚️", category: "Keşif", unlocked: false },
  { id: "mineshaft", description: "Bir maden shaftı bul", name: "Maden Shafts", icon: "⛏️", category: "Keşif", unlocked: false },

  // Yapı
  { id: "house", name: "İlk Ev", description: "Bir ev inşa et", icon: "🏠", category: "Yapı", unlocked: false },
  { id: "castle", name: "Şato", description: "Bir şato inşa et", icon: "🏰", category: "Yapı", unlocked: false },
  { id: "farm", name: "Çiftlik", description: "Bir çiftlik kur", icon: "🌾", category: "Yapı", unlocked: false },
  { id: "redstone", name: "Redstone", description: "Bir redstone mekanizması yap", icon: "🔴", category: "Yapı", unlocked: false },
  { id: "railway", name: "Ray Sistemi", description: "Bir ray sistemi kur", icon: "🚂", category: "Yapı", unlocked: false },
  { id: "nether_portal", name: "Nether Portalı", description: "Bir nether portalı yap", icon: "🟪", category: "Yapı", unlocked: false },
  { id: "end_portal", name: "End Portalı", description: "Bir end portalı bul", icon: "🟪", category: "Yapı", unlocked: false },
];

interface Props {
  unlockedIds?: string[];
  onUnlock?: (id: string) => void;
}

export function AchievementTracker({ unlockedIds = [], onUnlock }: Props) {
  const [achievements, setAchievements] = React.useState<Achievement[]>(
    MC_ACHIEVEMENTS.map((a) => ({
      ...a,
      unlocked: unlockedIds.includes(a.id),
    }))
  );
  const [filter, setFilter] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState("");

  const categories = ["all", ...new Set(MC_ACHIEVEMENTS.map((a) => a.category))];
  const categoryLabels: Record<string, string> = {
    all: "📋 Tümü",
    "İlerleme": "⬆️ İlerleme",
    "Savaş": "⚔️ Savaş",
    "Keşif": "🗺️ Keşif",
    "Yapı": "🏗️ Yapı",
  };

  const filtered = achievements.filter((a) => {
    if (filter !== "all" && a.category !== filter) return false;
    if (searchQuery && !a.name.toLowerCase().includes(searchQuery.toLowerCase()) && !a.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const totalUnlocked = achievements.filter((a) => a.unlocked).length;
  const total = achievements.length;
  const percentage = Math.round((totalUnlocked / total) * 100);

  const toggleUnlock = (id: string) => {
    setAchievements((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, unlocked: !a.unlocked, unlockedAt: !a.unlocked ? new Date().toLocaleString("tr-TR") : undefined } : a
      )
    );
    onUnlock?.(id);
  };

  return (
    <div className="glass-card relative z-10 w-[480px] max-h-[520px] rounded-2xl p-5">
      <h2 className="mb-3 text-base font-semibold">🏆 Başarı Takipçisi</h2>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="mb-1 flex items-center justify-between text-[10px] text-text-dim">
          <span>{totalUnlocked}/{total} başarım</span>
          <span>%{percentage}</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-border/30">
          <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${percentage}%` }} />
        </div>
      </div>

      {/* Search */}
      <input
        className="input-field mb-3 w-full"
        placeholder="Başarı ara..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      {/* Category Filter */}
      <div className="mb-3 flex gap-1 overflow-x-auto">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-medium transition ${filter === cat ? "bg-accent text-white" : "bg-surface/50 text-text-dim hover:text-text"}`}
          >
            {categoryLabels[cat] || cat}
          </button>
        ))}
      </div>

      {/* Achievement List */}
      <div className="max-h-[280px] space-y-1 overflow-y-auto">
        {filtered.map((ach) => (
          <div
            key={ach.id}
            onClick={() => toggleUnlock(ach.id)}
            className={`flex items-center gap-3 rounded-xl border p-2.5 transition cursor-pointer ${
              ach.unlocked ? "border-accent/30 bg-accent/10" : "border-border/30 bg-surface/30 hover:border-border/50"
            }`}
          >
            <span className={`text-xl ${ach.unlocked ? "" : "grayscale opacity-40"}`}>{ach.icon}</span>
            <div className="min-w-0 flex-1">
              <div className={`text-xs font-medium ${ach.unlocked ? "text-accent" : "text-text"}`}>{ach.name}</div>
              <div className="text-[10px] text-text-dim">{ach.description}</div>
            </div>
            {ach.unlocked && <span className="text-[10px] text-green-400">✅</span>}
            {!ach.unlocked && <span className="text-[10px] text-text-dim">🔒</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
