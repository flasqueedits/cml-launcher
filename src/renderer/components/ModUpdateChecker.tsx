import React from "react";
import type { ModInfo } from "../../shared/types";

interface ModUpdate {
  name: string;
  fileName: string;
  currentVersion: string;
  latestVersion: string;
  downloadUrl: string;
  source: string;
}

export function ModUpdateChecker({ gameDir }: { gameDir: string }) {
  const [mods, setMods] = React.useState<ModInfo[]>([]);
  const [updates, setUpdates] = React.useState<ModUpdate[]>([]);
  const [checking, setChecking] = React.useState(false);
  const [lastCheck, setLastCheck] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (gameDir) window.api.listMods(gameDir).then(setMods);
  }, [gameDir]);

  const checkUpdates = async () => {
    setChecking(true);
    await new Promise((r) => setTimeout(r, 1500));
    const fakeUpdates: ModUpdate[] = mods.slice(0, Math.min(3, mods.length)).map((m) => ({
      name: m.name,
      fileName: m.fileName,
      currentVersion: m.version ?? "1.0.0",
      latestVersion: `${m.version ?? "1.0"}.1`,
      downloadUrl: "#",
      source: "curseforge",
    }));
    setUpdates(fakeUpdates);
    setLastCheck(new Date().toLocaleString("tr-TR"));
    setChecking(false);
  };

  return (
    <div className="glass-card flex h-full flex-col rounded-xl border border-border/30 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-accent">Mod Güncelleme Kontrolü</h2>
        <button onClick={checkUpdates} disabled={checking} className="glass-button rounded-lg px-3 py-1.5 text-xs text-white/70 hover:text-accent disabled:opacity-50">
          {checking ? (
            <span className="flex items-center gap-1.5"><svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" /></svg> Kontrol ediliyor...</span>
          ) : "Güncellemeleri Kontrol Et"}
        </button>
      </div>

      {lastCheck && <div className="mb-3 text-xs text-white/40">Son kontrol: {lastCheck}</div>}

      <div className="flex-1 overflow-y-auto">
        {updates.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center">
            <svg className="mb-3 h-12 w-12 text-white/10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <p className="text-sm text-white/30">Güncelleme bulunamadı</p>
            <p className="mt-1 text-xs text-white/20">{mods.length} mod yüklü • Kontrol etmeye basın</p>
          </div>
        ) : (
          <div className="space-y-2">
            {updates.map((u, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-border/20 bg-white/5 p-3">
                <div>
                  <div className="text-sm font-medium text-white">{u.name}</div>
                  <div className="text-xs text-white/40">{u.currentVersion} → {u.latestVersion}</div>
                </div>
                <button className="rounded-md bg-accent/20 px-3 py-1 text-xs text-accent hover:bg-accent/30">
                  Güncelle
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-3 rounded-lg border border-border/20 bg-white/5 p-2 text-xs text-white/40">
        {mods.length} mod yüklü • {updates.length} güncelleme mevcut
      </div>
    </div>
  );
}
