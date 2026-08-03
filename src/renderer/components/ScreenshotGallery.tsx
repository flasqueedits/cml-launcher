import React from "react";
import type { ScreenshotInfo } from "../../shared/types";

interface Props {
  screenshots: ScreenshotInfo[];
  onRemove: (fileName: string) => void;
  onOpen: (fileName: string) => void;
  onRefresh: () => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ScreenshotGallery({ screenshots, onRemove, onOpen, onRefresh }: Props) {
  return (
    <div className="glass-card relative z-10 w-[420px] max-h-[500px] rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold">Ekran Görüntüleri</h2>
        <div className="flex gap-2">
          <span className="text-xs text-text-dim">{screenshots.length} screenshot</span>
          <button onClick={onRefresh} className="icon-button !h-6 !w-6" title="Yenile">
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>
          </button>
        </div>
      </div>
      <div className="max-h-[380px] space-y-2 overflow-y-auto">
        {screenshots.length === 0 && <div className="py-8 text-center text-sm text-text-dim">Ekran görüntüsü bulunamadı.</div>}
        {screenshots.map((s) => (
          <div key={s.fileName} className="flex items-center gap-3 rounded-xl border border-border bg-surface/50 p-3 transition-colors hover:border-accent">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-2">
              <svg className="h-5 w-5 text-text-dim" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-text">{s.fileName}</div>
              <div className="text-[10px] text-text-dim">{formatSize(s.size)} • {new Date(s.takenAt).toLocaleDateString("tr-TR")}</div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => onOpen(s.fileName)} className="icon-button !h-7 !w-7" title="Aç">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
              </button>
              <button onClick={() => onRemove(s.fileName)} className="icon-button !h-7 !w-7 hover:!border-danger hover:!text-danger" title="Sil">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
