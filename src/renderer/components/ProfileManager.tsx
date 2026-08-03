import React from "react";
import type { GameProfile } from "../../shared/types";

interface Props {
  profiles: GameProfile[];
  activeId: string;
  onAdd: (name: string, username: string, type: "microsoft" | "offline") => void;
  onRemove: (id: string) => void;
  onSetActive: (id: string) => void;
}

export function ProfileManager({ profiles, activeId, onAdd, onRemove, onSetActive }: Props) {
  const [showAdd, setShowAdd] = React.useState(false);
  const [name, setName] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [type, setType] = React.useState<"microsoft" | "offline">("offline");

  const handleAdd = () => {
    if (!name.trim() || !username.trim()) return;
    onAdd(name.trim(), username.trim(), type);
    setName(""); setUsername(""); setShowAdd(false);
  };

  return (
    <div className="glass-card relative z-10 w-[420px] max-h-[500px] rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold">Profiller</h2>
        <button onClick={() => setShowAdd(!showAdd)} className="play-button !h-7 !w-7 rounded-lg" title="Yeni Profil">
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
        </button>
      </div>

      {showAdd && (
        <div className="mb-4 space-y-2 rounded-xl border border-border bg-surface/50 p-3">
          <input className="input-field" placeholder="Profil adı" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="input-field" placeholder="Kullanıcı adı" value={username} onChange={(e) => setUsername(e.target.value)} />
          <select className="input-field" value={type} onChange={(e) => setType(e.target.value as "microsoft" | "offline")}>
            <option value="offline">Offline</option>
            <option value="microsoft">Microsoft</option>
          </select>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="play-button flex-1 rounded-lg py-1.5 text-xs font-semibold text-white">Ekle</button>
            <button onClick={() => setShowAdd(false)} className="flex-1 rounded-lg border border-border py-1.5 text-xs text-text-dim hover:bg-surface-2">İptal</button>
          </div>
        </div>
      )}

      <div className="max-h-[320px] space-y-2 overflow-y-auto">
        {profiles.length === 0 && <div className="py-8 text-center text-sm text-text-dim">Henüz profil yok.</div>}
        {profiles.map((p) => (
          <div key={p.id} className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${p.id === activeId ? "border-accent bg-accent-dim/20" : "border-border bg-surface/50 hover:border-accent"}`}>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-2 text-sm font-bold text-accent">
              {p.username[0]?.toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-text">{p.name}</div>
              <div className="text-[10px] text-text-dim">{p.username} • {p.type}</div>
            </div>
            <div className="flex gap-1">
              {p.id !== activeId && (
                <button onClick={() => onSetActive(p.id)} className="icon-button !h-7 !w-7" title="Seç">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                </button>
              )}
              {p.id === activeId && <span className="text-[10px] font-semibold text-accent">AKTİF</span>}
              <button onClick={() => onRemove(p.id)} className="icon-button !h-7 !w-7 hover:!border-danger hover:!text-danger" title="Sil">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
