import React from "react";

interface Instance {
  id: string;
  name: string;
  gameDir: string;
  version: string;
  modCount: number;
  lastPlayed: string;
}

interface Props {
  instances: Instance[];
  activeId: string;
  onSelect: (id: string) => void;
  onCreate: (name: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
}

export function InstanceManager({ instances, activeId, onSelect, onCreate, onDelete, onRename }: Props) {
  const [newName, setNewName] = React.useState("");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState("");

  return (
    <div className="glass-card relative z-10 w-[480px] max-h-[520px] rounded-2xl p-5">
      <h2 className="mb-4 text-base font-semibold">Çoklu Instance Yönetimi</h2>

      {/* Yeni instance oluştur */}
      <div className="mb-4 flex gap-2">
        <input
          className="input-field flex-1"
          placeholder="Instance adı..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && newName.trim()) { onCreate(newName.trim()); setNewName(""); } }}
        />
        <button
          onClick={() => { if (newName.trim()) { onCreate(newName.trim()); setNewName(""); } }}
          className="play-button shrink-0 rounded-lg px-4 text-xs font-semibold text-white"
        >
          + Oluştur
        </button>
      </div>

      {/* Instance listesi */}
      <div className="max-h-[380px] space-y-2 overflow-y-auto">
        {instances.map((inst) => (
          <div
            key={inst.id}
            className={`flex items-center gap-3 rounded-xl border p-3 transition ${
              inst.id === activeId
                ? "border-accent bg-accent/10"
                : "border-border bg-surface/30 hover:border-border/80"
            }`}
          >
            <button
              onClick={() => onSelect(inst.id)}
              className="flex flex-1 items-center gap-3 text-left"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20 text-accent">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                {editingId === inst.id ? (
                  <input
                    className="w-full bg-transparent text-sm font-medium outline-none border-b border-accent"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && editName.trim()) { onRename(inst.id, editName.trim()); setEditingId(null); }
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    onBlur={() => { if (editName.trim()) onRename(inst.id, editName.trim()); setEditingId(null); }}
                    autoFocus
                  />
                ) : (
                  <div className="text-sm font-medium text-text truncate">{inst.name}</div>
                )}
                <div className="text-[11px] text-text-dim">
                  {inst.version || "Sürüm yok"} • {inst.modCount} mod • {inst.lastPlayed ? new Date(inst.lastPlayed).toLocaleDateString("tr") : "Hiç oynanmadı"}
                </div>
              </div>
            </button>
            <div className="flex gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); setEditingId(inst.id); setEditName(inst.name); }}
                className="rounded-lg p-1.5 text-text-dim hover:bg-surface-2 hover:text-text"
                title="Yeniden adlandır"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); if (confirm("Bu instance'ı silmek istediğinize emin misiniz?")) onDelete(inst.id); }}
                className="rounded-lg p-1.5 text-text-dim hover:bg-danger/20 hover:text-danger"
                title="Sil"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            </div>
          </div>
        ))}
        {instances.length === 0 && (
          <div className="py-8 text-center text-sm text-text-dim">
            Henüz instance yok. Yukarıdan yeni bir tane oluşturun.
          </div>
        )}
      </div>
    </div>
  );
}
