import React from "react";

interface BackupEntry {
  id: string;
  name: string;
  timestamp: string;
  size: number;
  path: string;
}

interface Props {
  gameDir: string;
}

export function AutoBackupPanel({ gameDir }: Props) {
  const [backups, setBackups] = React.useState<BackupEntry[]>([]);
  const [autoBackup, setAutoBackup] = React.useState(false);
  const [interval, setInterval_] = React.useState(60);
  const [lastBackup, setLastBackup] = React.useState<string | null>(null);
  const [msg, setMsg] = React.useState("");

  const loadBackups = async () => {
    try {
      const result = await window.api.listWorlds(gameDir);
      const backupList: BackupEntry[] = result.map((w, i) => ({
        id: String(i),
        name: w.name,
        timestamp: w.lastPlayed,
        size: w.size,
        path: w.folderName,
      }));
      setBackups(backupList);
    } catch {}
  };

  React.useEffect(() => { loadBackups(); }, [gameDir]);

  const handleBackup = async (folderName: string) => {
    try {
      const path = await window.api.backupWorld(gameDir, folderName);
      setMsg(`✅ Yedeklendi: ${path}`);
      setLastBackup(new Date().toLocaleTimeString("tr-TR"));
      loadBackups();
    } catch (e) {
      setMsg(`❌ Hata: ${e}`);
    }
  };

  const handleBackupAll = async () => {
    let count = 0;
    for (const b of backups) {
      try {
        await window.api.backupWorld(gameDir, b.path);
        count++;
      } catch {}
    }
    setMsg(`✅ ${count}/${backups.length} dünya yedeklendi`);
    setLastBackup(new Date().toLocaleTimeString("tr-TR"));
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className="glass-card relative z-10 w-[480px] max-h-[500px] rounded-2xl p-5">
      <h2 className="mb-4 text-base font-semibold">💾 Otomatik Yedekleme</h2>

      {/* Auto Backup Settings */}
      <div className="mb-4 rounded-xl border border-border/30 bg-surface/30 p-3">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-medium">Otomatik Yedekleme</span>
          <button
            onClick={() => setAutoBackup(!autoBackup)}
            className={`relative h-5 w-9 rounded-full transition ${autoBackup ? "bg-accent" : "bg-border"}`}
          >
            <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${autoBackup ? "left-4.5" : "left-0.5"}`} />
          </button>
        </div>

        {autoBackup && (
          <div className="mb-3 flex items-center gap-2">
            <span className="text-[10px] text-text-dim">Aralık:</span>
            {[15, 30, 60, 120].map((m) => (
              <button
                key={m}
                onClick={() => setInterval_(m)}
                className={`rounded px-2 py-0.5 text-[10px] ${interval === m ? "bg-accent text-white" : "bg-surface/50 text-text-dim"}`}
              >
                {m}dk
              </button>
            ))}
          </div>
        )}

        {lastBackup && (
          <div className="text-[10px] text-text-dim">Son yedekleme: {lastBackup}</div>
        )}
      </div>

      {/* Backup All Button */}
      <button
        onClick={handleBackupAll}
        className="play-button mb-4 w-full rounded-lg py-2 text-xs font-semibold text-white"
      >
        💾 Tüm Dünyaları Yedekle ({backups.length})
      </button>

      {/* Status */}
      {msg && <div className="mb-3 rounded-lg bg-surface/50 px-3 py-2 text-xs">{msg}</div>}

      {/* World List */}
      <div className="max-h-[250px] space-y-1 overflow-y-auto">
        {backups.map((backup) => (
          <div key={backup.id} className="flex items-center justify-between rounded-lg bg-surface/30 px-3 py-2">
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium">{backup.name}</div>
              <div className="text-[10px] text-text-dim">{formatSize(backup.size)}</div>
            </div>
            <button
              onClick={() => handleBackup(backup.path)}
              className="shrink-0 rounded-lg bg-surface/50 px-2 py-1 text-[10px] text-text-dim hover:text-text"
            >
              💾 Yedekle
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
