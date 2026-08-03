import React from "react";
import type { ResourcePack } from "../../shared/types";

interface Props {
  packs: ResourcePack[];
  onToggle: (fileName: string, enabled: boolean) => void;
  onRemove: (fileName: string) => void;
  onRefresh: () => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ResourcePackPanel({ packs, onToggle, onRemove, onRefresh }: Props) {
  return (
    <div className="glass-card relative z-10 w-[420px] max-h-[500px] rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold">Texture Paketleri</h2>
        <div className="flex gap-2">
          <span className="text-xs text-text-dim">{packs.length} paket</span>
          <button onClick={onRefresh} className="icon-button !h-6 !w-6" title="Yenile">
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          </button>
        </div>
      </div>

      <p className="mb-3 text-[10px] text-text-dim/60">
        Texture paketlerini {`<gameDir>/resourcepacks`} klasörüne koyun. Buradan etkinleştirebilirsiniz.
      </p>

      <div className="max-h-[340px] space-y-2 overflow-y-auto">
        {packs.length === 0 && (
          <div className="py-8 text-center text-sm text-text-dim">
            Texture paketi bulunamadı.
          </div>
        )}
        {packs.map((p) => (
          <div
            key={p.fileName}
            className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${
              p.enabled
                ? "border-accent/30 bg-accent-dim/20"
                : "border-border bg-surface/50 opacity-60"
            }`}
          >
            <div className={`h-2.5 w-2.5 rounded-full ${p.enabled ? "bg-green-400" : "bg-text-dim"}`} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-text">{p.name}</div>
              <div className="text-[10px] text-text-dim">{formatSize(p.size)}</div>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => onToggle(p.fileName, !p.enabled)}
                className="icon-button !h-7 !w-7"
                title={p.enabled ? "Devre dışı bırak" : "Etkinleştir"}
              >
                {p.enabled ? (
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                  </svg>
                ) : (
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
              <button
                onClick={() => onRemove(p.fileName)}
                className="icon-button !h-7 !w-7 hover:!border-danger hover:!text-danger"
                title="Sil"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
