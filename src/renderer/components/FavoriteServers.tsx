import React from "react";
import type { FavoriteServer } from "../../shared/types";

interface Props {
  favorites: FavoriteServer[];
  onAdd: (server: Omit<FavoriteServer, "id" | "addedAt">) => void;
  onRemove: (id: string) => void;
  onConnect: (address: string, port: number) => void;
}

export function FavoriteServers({ favorites, onAdd, onRemove, onConnect }: Props) {
  const [showAdd, setShowAdd] = React.useState(false);
  const [name, setName] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [port, setPort] = React.useState("25565");

  const handleAdd = () => {
    if (!name.trim() || !address.trim()) return;
    onAdd({ name: name.trim(), address: address.trim(), port: parseInt(port) || 25565 });
    setName(""); setAddress(""); setPort("25565"); setShowAdd(false);
  };

  return (
    <div className="glass-card relative z-10 w-[420px] max-h-[500px] rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold">Favori Sunucular</h2>
        <button onClick={() => setShowAdd(!showAdd)} className="icon-button !h-6 !w-6" title="Sunucu Ekle">
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
        </button>
      </div>

      {showAdd && (
        <div className="mb-3 rounded-xl border border-accent/30 bg-accent-dim/10 p-3 space-y-2">
          <input className="input-field w-full" placeholder="Sunucu adı" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="input-field w-full" placeholder="Adres (ör: mc.sunucu.com)" value={address} onChange={(e) => setAddress(e.target.value)} />
          <div className="flex gap-2">
            <input className="input-field flex-1" placeholder="Port" value={port} onChange={(e) => setPort(e.target.value)} />
            <button onClick={handleAdd} className="play-button shrink-0 rounded-lg px-4 text-xs font-semibold text-white">Ekle</button>
          </div>
        </div>
      )}

      <div className="max-h-[340px] space-y-2 overflow-y-auto">
        {favorites.length === 0 && <div className="py-8 text-center text-sm text-text-dim">Favori sunucu yok. + butonu ile ekleyin.</div>}
        {favorites.map((f) => (
          <div key={f.id} className="flex items-center gap-3 rounded-xl border border-border bg-surface/50 p-3 transition-colors hover:border-accent group">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-dim/30 text-xs font-bold text-accent">{f.name[0]}</div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-text">{f.name}</div>
              <div className="text-[10px] text-text-dim">{f.address}:{f.port} {f.ping ? `• ${f.ping}ms` : ""}</div>
              {f.lastConnected && <div className="text-[10px] text-text-dim/50">Son bağlanma: {new Date(f.lastConnected).toLocaleDateString("tr-TR")}</div>}
            </div>
            <button onClick={() => onConnect(f.address, f.port)} className="icon-button !h-7 !w-7 opacity-0 group-hover:opacity-100" title="Bağlan">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
            </button>
            <button onClick={() => onRemove(f.id)} className="icon-button !h-7 !w-7 opacity-0 group-hover:opacity-100 !text-red-400 hover:!text-red-300" title="Kaldır">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
