import React from "react";
import type { AppSettings } from "../../shared/types";

interface Props {
  settings: AppSettings | null;
  onSave: (partial: Partial<AppSettings>) => Promise<AppSettings>;
  onClose: () => void;
  onDetectJava: () => Promise<string | null>;
}

export function SettingsPanel({ settings, onSave, onClose, onDetectJava }: Props) {
  const [form, setForm] = React.useState<AppSettings | null>(settings);
  const [saving, setSaving] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);

  React.useEffect(() => setForm(settings), [settings]);
  if (!form) return null;

  const set = <K extends keyof AppSettings,>(key: K, value: AppSettings[K]) => setForm((f) => (f ? { ...f, [key]: value } : f));

  const save = async () => {
    setSaving(true); setMsg(null);
    try { await onSave(form); setMsg("Kaydedildi."); } catch (e) { setMsg(`Hata: ${String(e)}`); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass-card flex max-h-[80vh] w-[500px] flex-col rounded-2xl p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">Ayarlar</h2>
          <button onClick={onClose} className="rounded p-1 text-text-dim hover:bg-surface-2 hover:text-text"><svg className="h-4 w-4" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="2" y1="2" x2="10" y2="10" /><line x1="10" y1="2" x2="2" y2="10" /></svg></button>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto pr-1">
          <Field label="Oyun Klasörü" hint=".minecraft klasörünün konumu"><input className="input-field" value={form.gameDir} onChange={(e) => set("gameDir", e.target.value)} /></Field>
          <Field label="Java" hint="Boş bırakırsan Adoptium'dan indirilir."><div className="flex gap-2"><input className="input-field flex-1" value={form.javaPath} onChange={(e) => set("javaPath", e.target.value)} placeholder="C:\...\bin\java.exe" /><button onClick={async () => { const f = await onDetectJava(); if (f) set("javaPath", f); else setMsg("Java bulunamadı."); }} className="shrink-0 rounded-lg border border-border px-3 text-xs font-medium text-text-dim hover:bg-surface-2 hover:text-text">Bul</button></div></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="RAM (MB)"><input type="number" min={1024} max={32768} step={1024} className="input-field" value={form.ramMb} onChange={(e) => set("ramMb", Number(e.target.value))} /></Field>
            <Field label="Pencere Boyutu"><div className="flex items-center gap-1"><input type="number" className="input-field w-full" value={form.width} onChange={(e) => set("width", Number(e.target.value))} /><span className="text-text-dim">×</span><input type="number" className="input-field w-full" value={form.height} onChange={(e) => set("height", Number(e.target.value))} /></div></Field>
          </div>
          <Field label="Microsoft Client ID" hint="Azure portal → App registrations → Public client"><input className="input-field font-mono text-xs" value={form.clientId} onChange={(e) => set("clientId", e.target.value.trim())} /></Field>
          <Field label="Özel JVM Argümanları" hint="Boşlukla ayırın. Örn: -XX:+UseG1GC -Dfml.ignorePatchInvalidCertificates=true"><textarea className="input-field min-h-[60px] resize-y font-mono text-xs" value={form.customJvmArgs} onChange={(e) => set("customJvmArgs", e.target.value)} placeholder="-XX:+UseG1GC" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 text-sm text-text-dim"><input type="checkbox" checked={form.autoStart} onChange={(e) => set("autoStart", e.target.checked)} className="h-4 w-4 rounded border-border bg-surface-2 accent-accent" /> Otomatik başlat</label>
            <label className="flex items-center gap-2 text-sm text-text-dim"><input type="checkbox" checked={form.forceUpdate} onChange={(e) => set("forceUpdate", e.target.checked)} className="h-4 w-4 rounded border-border bg-surface-2 accent-accent" /> Zorla güncelle</label>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
          <span className="text-xs text-text-dim">{msg ?? ""}</span>
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-lg px-4 py-1.5 text-sm text-text-dim hover:bg-surface-2">Vazgeç</button>
            <button onClick={save} disabled={saving} className="play-button rounded-lg px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Kaydediliyor..." : "Kaydet"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field(props: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-text-dim">{props.label}</label>
      {props.children}
      {props.hint && <p className="mt-1 text-[10px] text-text-dim/60">{props.hint}</p>}
    </div>
  );
}
