import React from "react";
import type { NewsItem } from "../../shared/types";

interface Props {
  news: NewsItem[];
  onRefresh: () => void;
}

export function NewsFeed({ news, onRefresh }: Props) {
  return (
    <div className="glass-card relative z-10 w-[420px] max-h-[500px] rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold">Minecraft Haberleri</h2>
        <button onClick={onRefresh} className="icon-button !h-6 !w-6" title="Yenile"><svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg></button>
      </div>
      <div className="max-h-[380px] space-y-3 overflow-y-auto">
        {news.length === 0 && <div className="py-8 text-center text-sm text-text-dim">Haber yükleniyor...</div>}
        {news.map((n) => (
          <a key={n.id} href={n.url} target="_blank" rel="noreferrer" className="block rounded-xl border border-border bg-surface/50 p-3 transition-colors hover:border-accent">
            {n.imageUrl && <img src={n.imageUrl} className="mb-2 w-full rounded-lg object-cover" style={{ maxHeight: "120px" }} alt="" />}
            <div className="text-sm font-medium text-text">{n.title}</div>
            <div className="mt-1 line-clamp-2 text-[10px] text-text-dim">{n.summary}</div>
            <div className="mt-1 text-[10px] text-text-dim/60">{new Date(n.date).toLocaleDateString("tr-TR")} • {n.source}</div>
          </a>
        ))}
      </div>
    </div>
  );
}
