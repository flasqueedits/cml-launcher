import React from "react";
import type { MinecraftRelease } from "../../shared/types";

interface Props {
  versions: MinecraftRelease[];
  selected: string;
  onSelect: (id: string) => void;
  loading: boolean;
}

const TYPE_COLOR: Record<string, string> = {
  release: "bg-accent",
  snapshot: "bg-amber-400",
  "old_beta": "bg-orange-400",
  "old_alpha": "bg-purple-400",
};

export function VersionList({ versions, selected, onSelect, loading }: Props) {
  return (
    <aside className="flex h-full w-64 flex-col border-r border-surface bg-surface/40">
      <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-text-dim">
        Sürümler
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {loading && <div className="px-2 py-1 text-sm text-text-dim">Yükleniyor...</div>}
        {versions.map((v) => {
          const active = v.id === selected;
          return (
            <button
              key={v.id}
              onClick={() => onSelect(v.id)}
              className={`mb-1 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
                active
                  ? "bg-accent-dim text-text"
                  : "text-text-dim hover:bg-surface-2 hover:text-text"
              }`}
            >
              <span className={`h-2 w-2 shrink-0 rounded-full ${TYPE_COLOR[v.type] ?? "bg-text-dim"}`} />
              <span className="truncate font-mono">{v.id}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}