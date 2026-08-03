import React from "react";
import type { AppSettings, MinecraftRelease, PlayerProfile, ProgressInfo } from "../../shared/types";
import { SkinAvatar } from "./SkinAvatar";

interface Props {
  settings: AppSettings | null;
  profile: PlayerProfile | null;
  versions: MinecraftRelease[];
  selected: string;
  onSelect: (id: string) => void;
  busy: boolean;
  running: boolean;
  progress: ProgressInfo | null;
  status: string;
  offlineName: string;
  onOfflineNameChange: (v: string) => void;
  onPlay: () => void;
  onSettings: () => void;
  onAutoStart: (v: boolean) => void;
  onForceUpdate: (v: boolean) => void;
  onRefresh: () => void;
  onOpenFolder: () => void;
  onShowLog: () => void;
  showLog: boolean;
}

export function CenterCard({
  settings,
  profile,
  versions,
  selected,
  onSelect,
  busy,
  running,
  progress,
  status,
  offlineName,
  onOfflineNameChange,
  onPlay,
  onSettings,
  onAutoStart,
  onForceUpdate,
  onRefresh,
  onOpenFolder,
  onShowLog,
  showLog,
}: Props) {
  const selectedVersion = versions.find((v) => v.id === selected);
  const displayName = profile?.username ?? offlineName.trim() ?? "Kullanıcı";
  const [openDropdown, setOpenDropdown] = React.useState<"account" | "version" | null>(null);
  const [skinUrl, setSkinUrl] = React.useState<string | null>(null);

  // Skin çek
  React.useEffect(() => {
    const username = profile?.username ?? offlineName.trim();
    if (!username || username.length < 3) { setSkinUrl(null); return; }
    window.api.getSkin(username).then(setSkinUrl);
  }, [profile?.username, offlineName]);

  return (
    <div className="glass-card relative z-10 w-[380px] rounded-2xl p-5">
      <div className="mb-4 flex items-center gap-3">
        <SkinAvatar skinUrl={skinUrl} username={displayName} size={40} model="classic" />
        <div className="relative flex-1">
          <button
            onClick={() => setOpenDropdown(openDropdown === "account" ? null : "account")}
            className="flex w-full items-center justify-between rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text transition-colors hover:border-accent"
          >
            <span className="truncate">{displayName}</span>
            <svg className="h-4 w-4 shrink-0 text-text-dim" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          {openDropdown === "account" && (
            <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-lg border border-border bg-surface shadow-xl">
              {profile && (
                <button
                  onClick={() => { setOpenDropdown(null); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-text-dim hover:bg-surface-2"
                >
                  <span className="font-medium text-text">{profile.username}</span>
                  <span className="text-[10px] text-text-dim">
                    {profile.type === "microsoft" ? "Microsoft" : "Offline"}
                  </span>
                </button>
              )}
              <div className="border-t border-border">
                <input
                  className="w-full bg-transparent px-3 py-2 text-sm text-text outline-none placeholder:text-text-dim"
                  placeholder="Offline kullanıcı adı..."
                  value={offlineName}
                  onChange={(e) => onOfflineNameChange(e.target.value)}
                  maxLength={16}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && offlineName.trim().length >= 3) {
                      setOpenDropdown(null);
                    }
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mb-4">
        <div className="relative">
          <button
            onClick={() => setOpenDropdown(openDropdown === "version" ? null : "version")}
            className="flex w-full items-center justify-between rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text transition-colors hover:border-accent"
          >
            <span className="truncate">
                Son yayınlanmış {selectedVersion?.id ?? (selected || "Sürüm seçin")}
            </span>
            <svg className="h-4 w-4 shrink-0 text-text-dim" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          {openDropdown === "version" && (
            <div className="absolute left-0 top-full z-50 mt-1 max-h-[200px] w-full overflow-y-auto rounded-lg border border-border bg-surface shadow-xl">
              {versions.map((v) => (
                <button
                  key={v.id}
                  onClick={() => { onSelect(v.id); setOpenDropdown(null); }}
                  className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors ${
                    v.id === selected
                      ? "bg-accent-dim text-text"
                      : "text-text-dim hover:bg-surface-2 hover:text-text"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      v.type === "release"
                        ? "bg-green-400"
                        : v.type === "snapshot"
                          ? "bg-amber-400"
                          : "bg-text-dim"
                    }`}
                  />
                  <span className="truncate">{v.id}</span>
                  <span className="ml-auto text-[10px] text-text-dim">
                    {v.type === "release" ? "Stabil" : v.type === "snapshot" ? "Snapshot" : v.type}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mb-4 flex gap-6">
        <label className="flex items-center gap-2 text-sm text-text-dim">
          <input
            type="checkbox"
            checked={settings?.autoStart ?? false}
            onChange={(e) => onAutoStart(e.target.checked)}
            className="h-4 w-4 rounded border-border bg-surface-2 accent-accent"
          />
          Otomatik başlat
        </label>
        <label className="flex items-center gap-2 text-sm text-text-dim">
          <input
            type="checkbox"
            checked={settings?.forceUpdate ?? false}
            onChange={(e) => onForceUpdate(e.target.checked)}
            className="h-4 w-4 rounded border-border bg-surface-2 accent-accent"
          />
          Zorla güncelle
        </label>
      </div>

      {progress && (
        <div className="mb-3">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-text-dim">{progress.message}</span>
            <span className="font-mono text-accent-bright">{(progress.fraction * 100).toFixed(0)}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent-dim to-accent transition-all duration-200"
              style={{ width: `${Math.max(0, Math.min(100, progress.fraction * 100))}%` }}
            />
          </div>
        </div>
      )}

      <button
        onClick={onPlay}
        disabled={busy || running}
        className="play-button mb-4 w-full rounded-xl py-3.5 text-base font-bold tracking-wider text-white"
      >
        {running ? "OYUN ÇALIŞIYOR" : busy ? "HAZIRLANIYOR..." : "Oyuna Gir"}
      </button>

      <div className="flex items-center justify-center gap-2">
        <button
          onClick={onShowLog}
          className={`icon-button ${showLog ? "border-accent text-accent" : ""}`}
          title="Günlük"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        </button>
        <button onClick={onOpenFolder} className="icon-button" title="Oyun Klasörü">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
        </button>
        <button onClick={onRefresh} className="icon-button" title="Yenile">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
        </button>
        <button onClick={onSettings} className="icon-button" title="Ayarlar">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
