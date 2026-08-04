import React from "react";

interface ConfigFile {
  name: string;
  path: string;
  content: string;
}

interface Props {
  gameDir: string;
}

export function ConfigEditor({ gameDir }: Props) {
  const [files, setFiles] = React.useState<ConfigFile[]>([]);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [content, setContent] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [msg, setMsg] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const loadConfigs = React.useCallback(async () => {
    if (!gameDir) return;
    setLoading(true);
    const configs = await window.api.listConfigFiles(gameDir);
    setFiles(configs);
    setLoading(false);
  }, [gameDir]);

  React.useEffect(() => { loadConfigs(); }, [loadConfigs]);

  const loadFile = async (filePath: string) => {
    const c = await window.api.readConfigFile(filePath);
    setContent(c);
    setSelected(filePath);
    setMsg("");
  };

  const saveFile = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await window.api.writeConfigFile(selected, content);
      setMsg("Config kaydedildi!");
    } catch (e) {
      setMsg(`Hata: ${e}`);
    }
    setSaving(false);
  };

  return (
    <div className="glass-card relative z-10 w-[560px] max-h-[520px] rounded-2xl p-5">
      <h2 className="mb-4 text-base font-semibold">Config Editör</h2>

      <div className="flex gap-3">
        {/* Dosya listesi */}
        <div className="w-[180px] shrink-0 space-y-1 overflow-y-auto" style={{ maxHeight: "380px" }}>
          {loading && <div className="py-4 text-xs text-text-dim">Yükleniyor...</div>}
          {files.map((f) => (
            <button
              key={f.path}
              onClick={() => loadFile(f.path)}
              className={`w-full rounded-lg px-3 py-1.5 text-left text-xs transition ${
                selected === f.path
                  ? "bg-accent text-white"
                  : "bg-surface/30 text-text-dim hover:bg-surface/50 hover:text-text"
              }`}
            >
              <div className="truncate font-medium">{f.name}</div>
              <div className="truncate text-[10px] opacity-60">{f.path.split(/[\\/]/).slice(-2).join("/")}</div>
            </button>
          ))}
          {!loading && files.length === 0 && (
            <div className="py-4 text-xs text-text-dim">Config dosyası bulunamadı</div>
          )}
        </div>

        {/* Editör */}
        <div className="flex-1 min-w-0">
          {selected ? (
            <>
              <textarea
                className="w-full rounded-lg border border-border bg-surface/50 p-3 font-mono text-xs text-text outline-none focus:border-accent resize-none"
                style={{ height: "320px" }}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                spellCheck={false}
              />
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={saveFile}
                  disabled={saving}
                  className="play-button rounded-lg px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                >
                  {saving ? "Kaydediliyor..." : "Kaydet"}
                </button>
                {msg && <span className="text-xs text-accent">{msg}</span>}
              </div>
            </>
          ) : (
            <div className="flex h-[340px] items-center justify-center text-sm text-text-dim">
              Sol taraftan bir config dosyası seçin
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
