import React from "react";

interface Props {
  username: string;
  onUsernameChange: (u: string) => void;
  gameDir: string;
}

export function SkinManager({ username, onUsernameChange, gameDir }: Props) {
  const [skinUrl, setSkinUrl] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [model, setModel] = React.useState<"classic" | "slim">("classic");
  const [selectedFile, setSelectedFile] = React.useState<string | null>(null);
  const [selectedPreview, setSelectedPreview] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [msg, setMsg] = React.useState("");
  const [localSkins, setLocalSkins] = React.useState<string[]>([]);
  const [activeTab, setActiveTab] = React.useState<"mojang" | "local">("mojang");

  const fetchSkin = async () => {
    if (!username.trim()) return;
    setLoading(true);
    const url = await window.api.getSkin(username.trim());
    setSkinUrl(url);
    setLoading(false);
  };

  const loadLocalSkins = async () => {
    if (!gameDir) return;
    const skins = await window.api.listSkins(gameDir);
    setLocalSkins(skins);
  };

  React.useEffect(() => { if (username.trim() && activeTab === "mojang") fetchSkin(); }, [username, activeTab]);
  React.useEffect(() => { loadLocalSkins(); }, [gameDir]);

  const handleSelectFile = async () => {
    const filePath = await window.api.openFileDialog({
      title: "Skin Dosyası Seç",
      filters: [{ name: "PNG Resimleri", extensions: ["png"] }],
    });
    if (filePath) {
      setSelectedFile(filePath);
      setSelectedPreview(`file://${filePath}`);
      setMsg("");
    }
  };

  const handleSaveSkin = async () => {
    if (!selectedFile || !gameDir) return;
    setSaving(true);
    setMsg("");
    try {
      await window.api.setSkin(gameDir, selectedFile, model);
      setMsg("✅ Skin kaydedildi!");
      setSelectedFile(null);
      setSelectedPreview(null);
      loadLocalSkins();
    } catch (e) {
      setMsg(`❌ Hata: ${e}`);
    }
    setSaving(false);
  };

  return (
    <div className="glass-card relative z-10 w-[480px] max-h-[520px] rounded-2xl p-5">
      <h2 className="mb-4 text-base font-semibold">Skin Yöneticisi</h2>

      {/* Tab Bar */}
      <div className="mb-4 flex gap-1 rounded-lg bg-surface/50 p-1">
        <button
          onClick={() => setActiveTab("mojang")}
          className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition ${activeTab === "mojang" ? "bg-accent text-white" : "text-text-dim hover:text-text"}`}
        >
          🌐 Mojang Skin
        </button>
        <button
          onClick={() => setActiveTab("local")}
          className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition ${activeTab === "local" ? "bg-accent text-white" : "text-text-dim hover:text-text"}`}
        >
          📁 Skin Ekle
        </button>
      </div>

      {/* Mojang Tab */}
      {activeTab === "mojang" && (
        <>
          <div className="mb-4 flex gap-2">
            <input
              className="input-field flex-1"
              placeholder="Minecraft kullanıcı adı"
              value={username}
              onChange={(e) => onUsernameChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchSkin()}
            />
            <button onClick={fetchSkin} className="play-button shrink-0 rounded-lg px-3 text-xs font-semibold text-white">
              Göster
            </button>
          </div>
          <div className="flex items-center justify-center">
            {loading && <div className="py-12 text-sm text-text-dim">Yükleniyor...</div>}
            {!loading && !skinUrl && <div className="py-12 text-sm text-text-dim">Skin bulunamadı.</div>}
            {skinUrl && (
              <div className="text-center">
                <img src={skinUrl} alt="Skin" className="mx-auto rounded-xl border border-border" style={{ imageRendering: "pixelated", maxHeight: "280px" }} />
                <div className="mt-3 text-xs text-text-dim">{username}</div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Local Skin Tab */}
      {activeTab === "local" && (
        <>
          {/* Model Seçimi */}
          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-medium text-text-dim">Skin Modeli</label>
            <div className="flex gap-2">
              <button
                onClick={() => setModel("classic")}
                className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition ${model === "classic" ? "border-accent bg-accent/20 text-accent" : "border-border bg-surface/50 text-text-dim hover:border-border/80"}`}
              >
                🧑 Classic (Steve)
              </button>
              <button
                onClick={() => setModel("slim")}
                className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition ${model === "slim" ? "border-accent bg-accent/20 text-accent" : "border-border bg-surface/50 text-text-dim hover:border-border/80"}`}
              >
                🧍 Slim (Alex)
              </button>
            </div>
          </div>

          {/* Dosya Seç */}
          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-medium text-text-dim">Skin Dosyası (PNG)</label>
            <div className="flex gap-2">
              <button
                onClick={handleSelectFile}
                className="flex-1 rounded-lg border border-border bg-surface/50 px-3 py-2 text-left text-xs text-text-dim hover:border-border/80"
              >
                {selectedFile ? selectedFile.split(/[\\/]/).pop() : "📁 Dosya seç..."}
              </button>
              {selectedFile && (
                <button onClick={() => { setSelectedFile(null); setSelectedPreview(null); }} className="rounded-lg border border-border bg-surface/50 px-3 text-xs text-text-dim hover:border-danger/50 hover:text-danger">
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Önizleme + Kaydet */}
          {selectedPreview && (
            <div className="mb-4 flex items-center gap-4 rounded-xl border border-border/50 bg-surface/30 p-3">
              <img src={selectedPreview} alt="Önizleme" className="h-[120px] rounded-lg border border-border" style={{ imageRendering: "pixelated" }} />
              <div className="flex-1">
                <div className="mb-2 text-xs text-text-dim">Önizleme</div>
                <div className="mb-1 text-[10px] text-text-dim">Model: {model === "classic" ? "Classic (Steve)" : "Slim (Alex)"}</div>
                <button
                  onClick={handleSaveSkin}
                  disabled={saving}
                  className="play-button rounded-lg px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                >
                  {saving ? "Kaydediliyor..." : "💾 Kaydet"}
                </button>
              </div>
            </div>
          )}

          {/* Durum Mesajı */}
          {msg && <div className="mb-3 rounded-lg bg-surface/50 px-3 py-2 text-xs">{msg}</div>}

          {/* Kayıtlı Skinler */}
          {localSkins.length > 0 && (
            <div>
              <label className="mb-2 block text-xs font-medium text-text-dim">Kayıtlı Skinler ({localSkins.length})</label>
              <div className="max-h-[120px] space-y-1 overflow-y-auto">
                {localSkins.map((skin) => (
                  <div key={skin} className="flex items-center justify-between rounded-lg bg-surface/30 px-3 py-1.5">
                    <span className="text-[11px] text-text-dim">{skin}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
