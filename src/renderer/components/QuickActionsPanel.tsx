import React from "react";

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  action: () => void | Promise<void>;
}

export function QuickActionsPanel({ gameDir, onForceUpdate, onRefreshMods, onClearCache, onOpenDir, onRepairJava }: {
  gameDir: string;
  onForceUpdate: () => void;
  onRefreshMods: () => void;
  onClearCache: () => void;
  onOpenDir: () => void;
  onRepairJava: () => void;
}) {
  const [executing, setExecuting] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<{ id: string; ok: boolean; msg: string } | null>(null);

  const run = async (id: string, fn: () => void | Promise<void>) => {
    setExecuting(id);
    setResult(null);
    try { await fn(); setResult({ id, ok: true, msg: "Tamamlandı!" }); }
    catch (e) { setResult({ id, ok: false, msg: String(e) }); }
    finally { setExecuting(null); }
  };

  const actions: QuickAction[] = [
    { id: "force-update", label: "Zorla Güncelle", description: "Tüm dosyaları yeniden indir", icon: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>, color: "text-orange-400", action: onForceUpdate },
    { id: "refresh-mods", label: "Modları Yenile", description: "Mod listesini yeniden tara", icon: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>, color: "text-blue-400", action: onRefreshMods },
    { id: "clear-cache", label: "Önbellek Temizle", description: "Geçici dosyaları sil", icon: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>, color: "text-red-400", action: onClearCache },
    { id: "open-dir", label: "Oyun Klasörünü Aç", description: "Minecraft dizinini aç", icon: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>, color: "text-green-400", action: onOpenDir },
    { id: "repair-java", label: "Java'yı Onar", description: "Java kurulumunu kontrol et", icon: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>, color: "text-yellow-400", action: onRepairJava },
    { id: "diagnostic", label: "Teşhis Raporu", description: "Sistem bilgilerini topla", icon: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>, color: "text-purple-400", action: () => { setResult({ id: "diagnostic", ok: true, msg: `Oyun Klasörü: ${gameDir || 'Ayarlanmamış'}\nNode: ${navigator.userAgent}\nTarih: ${new Date().toLocaleString('tr-TR')}` }); } },
  ];

  return (
    <div className="glass-card flex h-full flex-col rounded-xl border border-border/30 p-4">
      <h2 className="mb-3 font-display text-lg font-bold text-accent">Hızlı Eylemler</h2>
      <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-3">
        {actions.map((a) => (
          <button
            key={a.id}
            onClick={() => run(a.id, a.action)}
            disabled={executing !== null}
            className="glass-card group flex flex-col items-center justify-center gap-2 rounded-xl border border-border/20 p-4 text-center transition-all hover:border-accent/40 hover:bg-white/5 disabled:opacity-50"
          >
            <div className={`${a.color} transition-transform group-hover:scale-110`}>
              {executing === a.id ? (
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
              ) : a.icon}
            </div>
            <div>
              <div className="text-sm font-medium text-white">{a.label}</div>
              <div className="text-[10px] text-white/30">{a.description}</div>
            </div>
          </button>
        ))}
      </div>
      {result && (
        <div className={`mt-3 rounded-lg border p-2 text-xs ${result.ok ? "border-green-500/30 bg-green-500/10 text-green-400" : "border-red-500/30 bg-red-500/10 text-red-400"}`}>
          <pre className="whitespace-pre-wrap">{result.msg}</pre>
        </div>
      )}
    </div>
  );
}
