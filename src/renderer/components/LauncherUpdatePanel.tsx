import React from "react";

interface Props {
  onCheck: () => void;
  update: { available: boolean; version: string; url: string; changelog: string; releaseDate: string } | null;
  checking: boolean;
}

export function LauncherUpdatePanel({ onCheck, update, checking }: Props) {
  return (
    <div className="glass-card relative z-10 w-[420px] max-h-[500px] rounded-2xl p-5">
      <h2 className="mb-4 text-base font-semibold">Launcher Güncelleme</h2>

      <div className="mb-4 text-center">
        <button onClick={onCheck} disabled={checking} className="play-button rounded-xl px-6 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {checking ? "Kontrol ediliyor..." : "Güncellemeyi Kontrol Et"}
        </button>
      </div>

      {update && (
        <div className={`rounded-xl border p-4 ${update.available ? "border-accent/40 bg-accent-dim/10" : "border-border bg-surface/50"}`}>
          {update.available ? (
            <>
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20 text-accent">⬇️</div>
                <div>
                  <div className="text-sm font-semibold text-text">Güncelleme Mevcut!</div>
                  <div className="text-[10px] text-text-dim">Sürüm: {update.version}</div>
                </div>
              </div>
              {update.changelog && (
                <div className="mt-3 rounded-lg bg-surface-2 p-3">
                  <div className="mb-1 text-[10px] font-semibold text-accent">Değişiklikler:</div>
                  <div className="max-h-[150px] overflow-y-auto whitespace-pre-wrap text-xs text-text-dim">{update.changelog}</div>
                </div>
              )}
              <div className="mt-3 text-center">
                <a href={update.url} target="_blank" rel="noreferrer" className="play-button inline-block rounded-lg px-6 py-2 text-xs font-semibold text-white">
                  İndir
                </a>
              </div>
              {update.releaseDate && <div className="mt-2 text-center text-[10px] text-text-dim/60">Yayın tarihi: {new Date(update.releaseDate).toLocaleDateString("tr-TR")}</div>}
            </>
          ) : (
            <div className="text-center">
              <div className="mb-2 text-2xl">✅</div>
              <div className="text-sm font-medium text-text">Launcher güncel!</div>
              <div className="text-[10px] text-text-dim">Mevcut sürüm: {update.version}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
