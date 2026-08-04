import React from "react";

interface ModUpdate {
  name: string;
  currentVersion: string;
  latestVersion: string;
  source: "curseforge" | "modrinth";
  downloadUrl: string;
}

interface Props {
  gameDir: string;
}

export function ModUpdateChecker({ gameDir }: Props) {
  const [updates, setUpdates] = React.useState<ModUpdate[]>([]);
  const [checking, setChecking] = React.useState(false);
  const [msg, setMsg] = React.useState("");
  const [installing, setInstalling] = React.useState<string | null>(null);

  const checkUpdates = async () => {
    if (!gameDir) return;
    setChecking(true);
    setMsg("Güncellemeler kontrol ediliyor...");
    try {
      const result = await window.api.checkModUpdates(gameDir);
      setUpdates(result);
      setMsg(result.length > 0 ? `${result.length} güncelleme bulundu` : "Güncelleme yok");
    } catch (e) {
      setMsg(`Hata: ${e}`);
    }
    setChecking(false);
  };

  const installUpdate = async (mod: ModUpdate) => {
    setInstalling(mod.name);
    try {
      await window.api.installModUpdate(gameDir, mod);
      setUpdates((prev) => prev.filter((u) => u.name !== mod.name));
      setMsg(`${mod.name} güncellendi!`);
    } catch (e) {
      setMsg(`Hata: ${e}`);
    }
    setInstalling(null);
  };

  return (
    <div className="glass-card relative z-10 w-[520px] max-h-[520px] rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold">Mod Güncellemeleri</h2>
        <button
          onClick={checkUpdates}
          disabled={checking}
          className="play-button rounded-lg px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
        >
          {checking ? "Kontrol ediliyor..." : "Kontrol Et"}
        </button>
      </div>

      {msg && (
        <div className={`mb-3 rounded-lg px-3 py-2 text-xs ${msg.includes("Hata") ? "bg-danger/10 text-danger" : "bg-accent/10 text-accent"}`}>
          {msg}
        </div>
      )}

      <div className="max-h-[380px] space-y-2 overflow-y-auto">
        {updates.map((mod) => (
          <div
            key={mod.name}
            className="flex items-center justify-between rounded-xl border border-border/50 bg-surface/30 p-3"
          >
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-text truncate">{mod.name}</div>
              <div className="text-[11px] text-text-dim">
                {mod.currentVersion} → {mod.latestVersion}
                <span className="ml-2 rounded bg-surface-2 px-1.5 py-0.5 text-[10px]">{mod.source}</span>
              </div>
            </div>
            <button
              onClick={() => installUpdate(mod)}
              disabled={installing === mod.name}
              className="shrink-0 rounded-lg border border-accent bg-accent/10 px-3 py-1 text-xs font-medium text-accent hover:bg-accent/20 disabled:opacity-50"
            >
              {installing === mod.name ? "..." : "Güncelle"}
            </button>
          </div>
        ))}
        {!checking && updates.length === 0 && (
          <div className="py-8 text-center text-sm text-text-dim">Kontrol etmek için butona basın</div>
        )}
      </div>
    </div>
  );
}
