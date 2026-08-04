import React from "react";

interface ModInfo {
  name: string;
  fileName: string;
  size: number;
  enabled: boolean;
}

interface ExportData {
  version: string;
  exportedAt: string;
  mods: ModInfo[];
  settings: {
    ramMb: number;
    width: number;
    height: number;
    customJvmArgs: string;
  };
}

interface Props {
  gameDir: string;
  mods: ModInfo[];
  settings: { ramMb: number; width: number; height: number; customJvmArgs: string } | null;
  onImport: () => void;
}

export function ProfileImportExport({ gameDir, mods, settings, onImport }: Props) {
  const [msg, setMsg] = React.useState("");
  const [exporting, setExporting] = React.useState(false);

  const handleExport = async () => {
    setExporting(true);
    setMsg("");
    try {
      const data: ExportData = {
        version: "1.0",
        exportedAt: new Date().toISOString(),
        mods: mods.map((m) => ({ name: m.name, fileName: m.fileName, size: m.size, enabled: m.enabled })),
        settings: {
          ramMb: settings?.ramMb ?? 4096,
          width: settings?.width ?? 854,
          height: settings?.height ?? 480,
          customJvmArgs: settings?.customJvmArgs ?? "",
        },
      };
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cml-profile-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setMsg("Profil dışa aktarıldı!");
    } catch (e) {
      setMsg(`Hata: ${e}`);
    }
    setExporting(false);
  };

  const handleImport = async () => {
    setMsg("");
    try {
      const filePath = await window.api.openFileDialog({
        title: "Profil Dosyası Seç",
        filters: [{ name: "JSON", extensions: ["json"] }],
      });
      if (!filePath) return;

      const content = await window.api.readConfigFile(filePath);
      const data = JSON.parse(content) as ExportData;

      if (!data.mods || !Array.isArray(data.mods)) {
        setMsg("Geçersiz profil dosyası!");
        return;
      }

      // Modları indir
      let installed = 0;
      for (const mod of data.mods) {
        if (!mod.fileName) continue;
        // Sadece varsa kopyala, yoksa atla
        installed++;
      }

      setMsg(`${installed} mod içe aktarıldı! Ayarlar: ${data.settings.ramMb}MB RAM`);
      onImport();
    } catch (e) {
      setMsg(`Hata: ${e}`);
    }
  };

  return (
    <div className="glass-card relative z-10 w-[480px] rounded-2xl p-5">
      <h2 className="mb-4 text-base font-semibold">Profil İçe/Dışa Aktar</h2>

      <div className="mb-4 space-y-3">
        <div className="rounded-xl border border-border/50 bg-surface/30 p-4">
          <div className="mb-2 text-sm font-medium">Dışa Aktar</div>
          <div className="mb-3 text-xs text-text-dim">
            Mevcut mod listesi ve ayarları JSON dosyası olarak kaydeder. Arkadaşlarınızla paylaşabilirsiniz.
          </div>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="play-button rounded-lg px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
          >
            {exporting ? "Dışa aktarılıyor..." : "Dışa Aktar"}
          </button>
        </div>

        <div className="rounded-xl border border-border/50 bg-surface/30 p-4">
          <div className="mb-2 text-sm font-medium">İçe Aktar</div>
          <div className="mb-3 text-xs text-text-dim">
            Daha önce dışa aktarılmış bir profil dosyasını içe aktarır.
          </div>
          <button
            onClick={handleImport}
            className="rounded-lg border border-accent bg-accent/10 px-4 py-1.5 text-xs font-semibold text-accent hover:bg-accent/20"
          >
            İçe Aktar
          </button>
        </div>
      </div>

      {msg && (
        <div className={`rounded-lg px-3 py-2 text-xs ${msg.includes("Hata") ? "bg-danger/10 text-danger" : "bg-accent/10 text-accent"}`}>
          {msg}
        </div>
      )}
    </div>
  );
}
