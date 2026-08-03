import React from "react";
import type { ProgressInfo, PanelTab, ServerInfo, ResourcePack, ShaderPack, LocalServer, ModInfo, ScreenshotInfo, WorldInfo, GameProfile, ModLoaderInfo, OnlineMod, NewsItem, PopularServer, PlayTimeRecord, CrashLog, ModpackInfo, FavoriteServer, GameStats } from "../shared/types";
import { useSettings, useProfile, useVersions, useGameLog, useDiscord } from "./hooks";
import { TitleBar } from "./components/TitleBar";
import { CenterCard } from "./components/CenterCard";
import { DiscordMembers } from "./components/DiscordMembers";
import { LogPanel } from "./components/LogPanel";
import { SettingsPanel } from "./components/SettingsPanel";
import { ServerListPanel } from "./components/ServerListPanel";
import { ServerCreatePanel } from "./components/ServerCreatePanel";
import { ResourcePackPanel } from "./components/ResourcePackPanel";
import { ShaderPackPanel } from "./components/ShaderPackPanel";
import { ModManagerPanel } from "./components/ModManagerPanel";
import { ScreenshotGallery } from "./components/ScreenshotGallery";
import { WorldManager } from "./components/WorldManager";
import { ProfileManager } from "./components/ProfileManager";
import { ModLoaderInstaller } from "./components/ModLoaderInstaller";
import { ModDownloader } from "./components/ModDownloader";
import { SkinManager } from "./components/SkinManager";
import { NewsFeed } from "./components/NewsFeed";
import { ServerBrowser } from "./components/ServerBrowser";
import { PlayTimeStats } from "./components/PlayTimeStats";
import { CrashLogAnalyzer } from "./components/CrashLogAnalyzer";
import { ModpackManager } from "./components/ModpackManager";
import { FavoriteServers } from "./components/FavoriteServers";
import { GameStatsPanel } from "./components/GameStatsPanel";
import { LauncherUpdatePanel } from "./components/LauncherUpdatePanel";
import { QuickPlay } from "./components/QuickPlay";
import { ThemeCustomizer } from "./components/ThemeCustomizer";
import { CommandPalette } from "./components/CommandPalette";
import { ServerMOTDPanel } from "./components/ServerMOTDPanel";
import { AutoBackupPanel } from "./components/AutoBackupPanel";
import { ChatPanel } from "./components/ChatPanel";
import { AchievementTracker } from "./components/AchievementTracker";
import { ConsoleFilterPanel } from "./components/ConsoleFilterPanel";
import { PerformanceMonitor } from "./components/PerformanceMonitor";
import { ModUpdateChecker } from "./components/ModUpdateChecker";
import { QuickActionsPanel } from "./components/QuickActionsPanel";
import { KeyboardShortcutsHelp } from "./components/KeyboardShortcutsHelp";
import { ServerPingHistory } from "./components/ServerPingHistory";

function FrostParticles() {
  const particles = React.useMemo(() => Array.from({ length: 30 }, (_, i) => ({ id: i, left: `${Math.random() * 100}%`, delay: `${Math.random() * 8}s`, size: `${1 + Math.random() * 2}px`, opacity: 0.2 + Math.random() * 0.4 })), []);
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {particles.map((p) => (<div key={p.id} className="frost-particle" style={{ left: p.left, animationDelay: p.delay, width: p.size, height: p.size, opacity: p.opacity }} />))}
    </div>
  );
}

function NavIcon({ tab, active, onClick, title, children }: { tab: PanelTab; active: PanelTab; onClick: (t: PanelTab) => void; title: string; children: React.ReactNode }) {
  return (
    <button onClick={() => onClick(tab)} className={`icon-button ${active === tab ? "!border-accent !text-accent" : ""}`} title={title}>{children}</button>
  );
}

export default function App() {
  const { settings, save } = useSettings();
  const { profile, loginMicrosoft, loginOffline, logout } = useProfile();
  const { versions, loading } = useVersions();
  const { logs, clear, push } = useGameLog();
  const { connected: dcConnected, members, connect: dcConnect } = useDiscord();

  const [selected, setSelected] = React.useState("");
  const [showSettings, setShowSettings] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [running, setRunning] = React.useState(false);
  const [progress, setProgress] = React.useState<ProgressInfo | null>(null);
  const [status, setStatus] = React.useState("Hazır.");
  const [offlineName, setOfflineName] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [showLog, setShowLog] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<PanelTab>("play");

  // Error otomatik temizleme
  React.useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(t);
  }, [error]);

  const [servers, setServers] = React.useState<ServerInfo[]>([]);
  const [resourcePacks, setResourcePacks] = React.useState<ResourcePack[]>([]);
  const [shaderPacks, setShaderPacks] = React.useState<ShaderPack[]>([]);
  const [mods, setMods] = React.useState<ModInfo[]>([]);
  const [screenshots, setScreenshots] = React.useState<ScreenshotInfo[]>([]);
  const [worlds, setWorlds] = React.useState<WorldInfo[]>([]);
  const [gameProfiles, setGameProfiles] = React.useState<GameProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = React.useState("");
  const [localServerRunning, setLocalServerRunning] = React.useState(false);
  const [localServerLogs, setLocalServerLogs] = React.useState<string[]>([]);

  const [modLoaders, setModLoaders] = React.useState<ModLoaderInfo[]>([]);
  const [installingLoader, setInstallingLoader] = React.useState<string | null>(null);
  const [onlineMods, setOnlineMods] = React.useState<OnlineMod[]>([]);
  const [installingMod, setInstallingMod] = React.useState<string | null>(null);
  const [skinUsername, setSkinUsername] = React.useState("");
  const [news, setNews] = React.useState<NewsItem[]>([]);
  const [popularServers, setPopularServers] = React.useState<PopularServer[]>([]);
  const [playTimeRecords, setPlayTimeRecords] = React.useState<PlayTimeRecord[]>([]);
  const [crashLogs, setCrashLogs] = React.useState<CrashLog[]>([]);

  const [modpacks, setModpacks] = React.useState<ModpackInfo[]>([]);
  const [installingModpack, setInstallingModpack] = React.useState<string | null>(null);
  const [favoriteServers, setFavoriteServers] = React.useState<FavoriteServer[]>([]);
  const [gameStats, setGameStats] = React.useState<GameStats | null>(null);
  const [launcherUpdate, setLauncherUpdate] = React.useState<{ available: boolean; version: string; url: string; changelog: string; releaseDate: string } | null>(null);
  const [checkingUpdate, setCheckingUpdate] = React.useState(false);
  const [showCommandPalette, setShowCommandPalette] = React.useState(false);
  const [showThemeCustomizer, setShowThemeCustomizer] = React.useState(false);
  const [showShortcuts, setShowShortcuts] = React.useState(false);
  const [accentColor, setAccentColor] = React.useState("#c87b3a");

  React.useEffect(() => { if (versions.length > 0 && !selected) { const r = versions.find((v) => v.type === "release"); setSelected(r?.id ?? versions[0].id); } }, [versions, selected]);
  React.useEffect(() => { if (!profile && offlineName) setOfflineName(""); }, [profile]);
  React.useEffect(() => { if (!dcConnected) dcConnect(); }, [dcConnected, dcConnect]);

  const gameDir = settings?.gameDir ?? "";
  const loadData = React.useCallback(async () => {
    if (!gameDir) return;
    if (activeTab === "servers") setServers(await window.api.listServers());
    if (activeTab === "resource-packs") setResourcePacks(await window.api.listResourcePacks(gameDir));
    if (activeTab === "shader-packs") setShaderPacks(await window.api.listShaderPacks(gameDir));
    if (activeTab === "mods") setMods(await window.api.listMods(gameDir));
    if (activeTab === "screenshots") setScreenshots(await window.api.listScreenshots(gameDir));
    if (activeTab === "worlds") setWorlds(await window.api.listWorlds(gameDir));
    if (activeTab === "profiles") { const p = await window.api.listGameProfiles(); setGameProfiles(p); const a = await window.api.getActiveGameProfile(); setActiveProfileId(a?.id ?? ""); }
    if (activeTab === "mod-loaders" && selected) setModLoaders(await window.api.listModLoaders(selected));
    if (activeTab === "news") { const n = await window.api.getNews(); setNews(n); }
    if (activeTab === "server-browser") { const s = await window.api.getPopularServers(); setPopularServers(s); }
    if (activeTab === "playtime") setPlayTimeRecords(await window.api.getAllPlayTime(gameDir));
    if (activeTab === "crash-logs") setCrashLogs(await window.api.getCrashLogs(gameDir));
    if (activeTab === "favorites") setFavoriteServers(await window.api.listFavoriteServers(gameDir));
    if (activeTab === "game-stats") setGameStats(await window.api.getGameStats(gameDir));
  }, [activeTab, gameDir, selected]);

  React.useEffect(() => { loadData(); }, [loadData]);

  const handleOfflineLogin = async () => { const name = offlineName.trim(); if (!name) return; try { await loginOffline(name); setStatus(`Offline: ${name}`); } catch (e) { setStatus(`Hata: ${String(e)}`); } };

  const play = async () => {
    if (busy || running) return;
    if (!selected) { setError("Sürüm seçin."); return; }
    if (!profile) { if (offlineName.trim().length < 3) { setError("Giriş yapın veya 3+ karakterli offline adı girin."); return; } await handleOfflineLogin(); }
    const username = profile?.username ?? offlineName.trim();
    const uuid = profile?.uuid ?? "";
    let javaPath = settings?.javaPath?.trim() ?? "";
    let gd = gameDir;
    if (!gd) { const mc = await window.api.getSettings(); if (!mc.gameDir) { setError("Oyun klasörü ayarlanmamış."); return; } gd = mc.gameDir; }
    setBusy(true); setError(null); clear();
    try {
      const version = await window.api.resolveVersion(selected);
      if (!javaPath) { const d = await window.api.detectJava(); if (d) javaPath = d; }
      if (!javaPath) { const major = version.javaMajor > 8 ? version.javaMajor : 17; setStatus(`Java ${major} kuruluyor...`); javaPath = await window.api.installJava(major, (p) => { setProgress(p); setStatus(p.message); }); }
      setStatus(`${selected} indiriliyor...`); await window.api.ensureInstalled(selected, (p) => { setProgress(p); setStatus(p.message); });
      setProgress(null); setStatus(`${selected} başlatılıyor...`);
      const jvmArgs = settings?.customJvmArgs ? settings.customJvmArgs.split(/\s+/).filter(Boolean) : [];
      const exitCode = await window.api.launch({ username, uuid, versionId: selected, javaPath, gameDir: gd, ramMb: settings?.ramMb ?? 4096, width: settings?.width ?? 854, height: settings?.height ?? 480, jvmArgs }, (line, level) => push(line, level), (code) => { setStatus(code === 0 ? "Kapandı." : `Hata kodu: ${code}`); });
      setStatus(exitCode === 0 ? "Kapandı." : `Hata kodu: ${exitCode}.`);
    } catch (e) { setError(String(e)); setStatus("Hata."); } finally { setBusy(false); setRunning(false); setProgress(null); }
  };

  // Klavye kısayolları
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "k") { e.preventDefault(); setShowCommandPalette((v) => !v); return; }
      if (e.ctrlKey && e.key === ",") { e.preventDefault(); setShowSettings(true); return; }
      if (e.ctrlKey && e.key === "Enter") { e.preventDefault(); play(); return; }
      if (e.ctrlKey && e.key >= "1" && e.key <= "9") {
        e.preventDefault();
        const tabs: PanelTab[] = ["play", "quick-play", "servers", "mods", "resource-packs", "shader-packs", "skins", "worlds", "news"];
        const idx = parseInt(e.key) - 1;
        if (tabs[idx]) setActiveTab(tabs[idx]);
        return;
      }
      if (e.ctrlKey && e.key === "q") { e.preventDefault(); setActiveTab("quick-play"); return; }
      if (e.ctrlKey && e.key === "t") { e.preventDefault(); setShowThemeCustomizer((v) => !v); return; }
      if (e.ctrlKey && e.key === "/") { e.preventDefault(); setShowShortcuts((v) => !v); return; }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [busy, running, selected, profile, offlineName, settings]);

  const connectToServer = async (address: string, port: number) => {
    if (busy || running) return;
    const username = profile?.username ?? offlineName.trim();
    if (!username || username.length < 3) { setError("Sunucuya bağlanmak için giriş yapın."); return; }
    if (!profile) await handleOfflineLogin();
    let javaPath = settings?.javaPath?.trim() ?? "";
    let gd = gameDir;
    if (!gd) { const mc = await window.api.getSettings(); if (!mc.gameDir) { setError("Oyun klasörü ayarlanmamış."); return; } gd = mc.gameDir; }
    setBusy(true); setError(null); clear();
    try {
      const versionId = selected || versions.find((v) => v.type === "release")?.id;
      if (!versionId) { setError("Sürüm seçin."); setBusy(false); return; }
      const version = await window.api.resolveVersion(versionId);
      if (!javaPath) { const d = await window.api.detectJava(); if (d) javaPath = d; }
      if (!javaPath) { const major = version.javaMajor > 8 ? version.javaMajor : 17; javaPath = await window.api.installJava(major, (p) => { setProgress(p); setStatus(p.message); }); }
      await window.api.ensureInstalled(versionId, (p) => { setProgress(p); setStatus(p.message); });
      setProgress(null);
      const jvmArgs = settings?.customJvmArgs ? settings.customJvmArgs.split(/\s+/).filter(Boolean) : [];
      await window.api.launch({ username: offlineName.trim() || (profile?.username ?? ""), uuid: profile?.uuid ?? "", versionId, javaPath, gameDir: gd, ramMb: settings?.ramMb ?? 4096, width: settings?.width ?? 854, height: settings?.height ?? 480, jvmArgs }, (line, level) => push(line, level), (code) => { setStatus(code === 0 ? "Kapandı." : `Hata kodu: ${code}`); });
    } catch (e) { setError(String(e)); } finally { setBusy(false); setRunning(false); setProgress(null); }
  };

  const startLocalServer = async (config: LocalServer) => {
    try { await window.api.startLocalServer(config); setLocalServerRunning(true);
      const iv = setInterval(async () => { const s = await window.api.getLocalServerStatus(); setLocalServerRunning(s.running); setLocalServerLogs(s.logs); if (!s.running) clearInterval(iv); }, 2000);
    } catch (e) { setError(String(e)); }
  };

  const handleInstallLoader = async (loader: ModLoaderInfo) => {
    if (!gameDir || !settings?.javaPath) { setError("Oyun klasörü ve Java ayarlanmalı."); return; }
    setInstallingLoader(loader.name);
    try {
      await window.api.installModLoader(loader, gameDir);
      setStatus(`${loader.name} kuruldu!`);
    } catch (e) { setError(String(e)); } finally { setInstallingLoader(null); }
  };

  const handleSearchMods = async (query: string, source: "curseforge" | "modrinth") => {
    if (!selected || !query.trim()) return;
    const results = await window.api.searchMods(query, source);
    setOnlineMods(results);
  };

  const handleInstallMod = async (mod: OnlineMod) => {
    if (!gameDir) { setError("Oyun klasörü ayarlanmamış."); return; }
    setInstallingMod(mod.id);
    try {
      await window.api.installMod(mod, gameDir);
      setStatus(`${mod.name} kuruldu!`);
    } catch (e) { setError(String(e)); } finally { setInstallingMod(null); }
  };

  const handleAddToServerList = async (address: string, port: number, name: string) => {
    try {
      await window.api.addServer({ name, address, port, ping: 0, players: { online: 0, max: 0 }, version: "" });
      setStatus(`${name} listeye eklendi.`);
    } catch (e) { setError(String(e)); }
  };

  const handleSearchModpacks = async (query: string, source: "curseforge" | "modrinth") => {
    if (!query.trim()) return;
    const results = await window.api.searchModpacks(query, source);
    setModpacks(results);
  };

  const handleInstallModpack = async (modpack: ModpackInfo) => {
    if (!gameDir) { setError("Oyun klasörü ayarlanmamış."); return; }
    setInstallingModpack(modpack.id);
    try {
      await window.api.installModpack(modpack, gameDir);
      setStatus(`${modpack.name} kuruldu!`);
    } catch (e) { setError(String(e)); } finally { setInstallingModpack(null); }
  };

  const handleAddFavorite = async (server: Omit<FavoriteServer, "id" | "addedAt">) => {
    try {
      await window.api.addFavoriteServer(gameDir, server);
      loadData();
    } catch (e) { setError(String(e)); }
  };

  const handleRemoveFavorite = async (id: string) => {
    try {
      await window.api.removeFavoriteServer(gameDir, id);
      loadData();
    } catch (e) { setError(String(e)); }
  };

  const handleCheckUpdate = async () => {
    setCheckingUpdate(true);
    try {
      const result = await window.api.checkLauncherUpdate();
      setLauncherUpdate(result);
    } catch (e) { setError(String(e)); } finally { setCheckingUpdate(false); }
  };

  return (
    <div className="bg-minecraft flex h-full flex-col">
      <FrostParticles /><TitleBar />
      <div className="relative z-10 flex min-h-0 flex-1">
        <DiscordMembers members={members} connected={dcConnected} onConnect={dcConnect} />
        <main className="relative flex min-h-0 flex-1 items-center justify-center">
          {activeTab === "play" && <CenterCard settings={settings} profile={profile} versions={versions} selected={selected} onSelect={setSelected} busy={busy} running={running} progress={progress} status={status} offlineName={offlineName} onOfflineNameChange={setOfflineName} onPlay={play} onSettings={() => setShowSettings(true)} onAutoStart={(v) => save({ autoStart: v })} onForceUpdate={(v) => save({ forceUpdate: v })} onRefresh={() => { setStatus("Yenileniyor..."); window.api.listVersions(true).then(() => setStatus("Hazır.")); }} onOpenFolder={async () => { const mc = settings?.gameDir || (await window.api.getSettings()).gameDir; if (mc) window.api.openFolder(mc); }} onShowLog={() => setShowLog(!showLog)} showLog={showLog} />}
          {activeTab === "servers" && <ServerListPanel servers={servers} busy={busy} onAdd={async (a, p, n) => { const r = await window.api.pingServer(a, p); await window.api.addServer({ ...r, name: n, address: a, port: p }); loadData(); }} onRemove={async (id) => { await window.api.removeServer(id); loadData(); }} onPing={async (a, p) => { await window.api.pingServer(a, p); loadData(); }} onConnect={connectToServer} />}
          {activeTab === "server-create" && <ServerCreatePanel gameDir={gameDir} javaPath={settings?.javaPath ?? ""} running={localServerRunning} logs={localServerLogs} onStart={startLocalServer} onStop={async () => { await window.api.stopLocalServer(); setLocalServerRunning(false); }} />}
          {activeTab === "resource-packs" && <ResourcePackPanel packs={resourcePacks} onToggle={async (fn, en) => { await window.api.toggleResourcePack(gameDir, fn, en); loadData(); }} onRemove={async (fn) => { await window.api.removeResourcePack(gameDir, fn); loadData(); }} onRefresh={loadData} />}
          {activeTab === "shader-packs" && <ShaderPackPanel packs={shaderPacks} onToggle={async (fn, en) => { await window.api.toggleShaderPack(gameDir, fn, en); loadData(); }} onRemove={async (fn) => { await window.api.removeShaderPack(gameDir, fn); loadData(); }} onRefresh={loadData} />}
          {activeTab === "mods" && <ModManagerPanel mods={mods} onToggle={async (fn, en) => { await window.api.toggleMod(gameDir, fn, en); loadData(); }} onRemove={async (fn) => { await window.api.removeMod(gameDir, fn); loadData(); }} onRefresh={loadData} />}
          {activeTab === "screenshots" && <ScreenshotGallery screenshots={screenshots} onRemove={async (fn) => { await window.api.removeScreenshot(gameDir, fn); loadData(); }} onOpen={async (fn) => { await window.api.openScreenshot(gameDir, fn); }} onRefresh={loadData} />}
          {activeTab === "worlds" && <WorldManager worlds={worlds} onRemove={async (fn) => { await window.api.removeWorld(gameDir, fn); loadData(); }} onBackup={async (fn) => { try { const path = await window.api.backupWorld(gameDir, fn); setStatus(`Yedeklendi: ${path}`); } catch (e) { setError(String(e)); } }} onRefresh={loadData} />}
          {activeTab === "profiles" && <ProfileManager profiles={gameProfiles} activeId={activeProfileId} onAdd={async (name, username, type) => { await window.api.addGameProfile({ name, username, uuid: "", type }); loadData(); }} onRemove={async (id) => { await window.api.removeGameProfile(id); loadData(); }} onSetActive={async (id) => { await window.api.setActiveGameProfile(id); loadData(); }} />}
          {activeTab === "mod-loaders" && <ModLoaderInstaller loaders={modLoaders} onInstall={handleInstallLoader} mcVersion={selected} onMcVersionChange={setSelected} installing={installingLoader} />}
          {activeTab === "mod-downloader" && <ModDownloader mods={onlineMods} onSearch={handleSearchMods} onInstall={handleInstallMod} installing={installingMod} />}
          {activeTab === "skins" && <SkinManager username={skinUsername} onUsernameChange={setSkinUsername} gameDir={gameDir} />}
          {activeTab === "news" && <NewsFeed news={news} onRefresh={loadData} />}
          {activeTab === "server-browser" && <ServerBrowser servers={popularServers} onRefresh={loadData} onAdd={handleAddToServerList} />}
          {activeTab === "playtime" && <PlayTimeStats records={playTimeRecords} />}
          {activeTab === "crash-logs" && <CrashLogAnalyzer logs={crashLogs} onRefresh={loadData} />}
          {activeTab === "modpacks" && <ModpackManager modpacks={modpacks} onSearch={handleSearchModpacks} onInstall={handleInstallModpack} installing={installingModpack} />}
          {activeTab === "favorites" && <FavoriteServers favorites={favoriteServers} onAdd={handleAddFavorite} onRemove={handleRemoveFavorite} onConnect={connectToServer} />}
          {activeTab === "game-stats" && <GameStatsPanel stats={gameStats} />}
          {activeTab === "updates" && <LauncherUpdatePanel onCheck={handleCheckUpdate} update={launcherUpdate} checking={checkingUpdate} />}
          {activeTab === "quick-play" && <QuickPlay versions={versions} lastPlayed={playTimeRecords[0]?.versionId ?? ""} onSelect={setSelected} onPlay={play} busy={busy} running={running} />}
          {activeTab === "motd" && <ServerMOTDPanel servers={servers} onRefresh={loadData} onPing={async (a, p) => window.api.pingServer(a, p)} />}
          {activeTab === "backup" && <AutoBackupPanel gameDir={gameDir} />}
          {activeTab === "chat" && <ChatPanel currentServer={servers[0] ?? null} username={profile?.username ?? offlineName} />}
          {activeTab === "achievements" && <AchievementTracker />}
          {activeTab === "console" && <ConsoleFilterPanel logs={logs.map((l) => ({ line: l.text, level: l.level }))} />}
          {activeTab === "perf" && <PerformanceMonitor running={running} />}
          {activeTab === "mod-updates" && <ModUpdateChecker gameDir={gameDir} />}
          {activeTab === "quick-actions" && <QuickActionsPanel gameDir={gameDir} onForceUpdate={() => { setStatus("Zorla güncelleme başlatılıyor..."); window.api.listVersions(true).then(() => setStatus("Güncellendi.")); }} onRefreshMods={loadData} onClearCache={() => { setStatus("Önbellek temizlendi!"); }} onOpenDir={() => { settings?.gameDir && window.api.openFolder(settings.gameDir); }} onRepairJava={() => { window.api.detectJava().then((f) => { if (f) save({ javaPath: f }); }); setStatus("Java kontrol edildi."); }} />}
          {activeTab === "ping-history" && <ServerPingHistory servers={servers} onRefresh={loadData} onPing={async (a, p) => window.api.pingServer(a, p)} />}
          <LogPanel lines={logs} running={running} visible={showLog} onClose={() => setShowLog(false)} />
          {error && <div className="glass-card absolute bottom-4 left-1/2 z-40 -translate-x-1/2 rounded-lg border border-danger/40 px-4 py-2 text-sm text-danger">{error}</div>}
        </main>
      </div>
      <div className="relative z-20 flex items-center justify-center gap-1.5 border-t border-border/30 bg-transparent py-2">
        <NavIcon tab="play" active={activeTab} onClick={setActiveTab} title="Oyna"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg></NavIcon>
        <NavIcon tab="quick-play" active={activeTab} onClick={setActiveTab} title="Hızlı Başlat"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg></NavIcon>
        <NavIcon tab="servers" active={activeTab} onClick={setActiveTab} title="Sunucular"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="8" rx="2" /><rect x="2" y="14" width="20" height="8" rx="2" /><line x1="6" y1="6" x2="6.01" y2="6" /><line x1="6" y1="18" x2="6.01" y2="18" /></svg></NavIcon>
        <NavIcon tab="server-create" active={activeTab} onClick={setActiveTab} title="Sunucu Oluştur"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg></NavIcon>
        <NavIcon tab="mods" active={activeTab} onClick={setActiveTab} title="Modlar"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg></NavIcon>
        <NavIcon tab="resource-packs" active={activeTab} onClick={setActiveTab} title="Texture"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg></NavIcon>
        <NavIcon tab="shader-packs" active={activeTab} onClick={setActiveTab} title="Shader"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg></NavIcon>
        <NavIcon tab="screenshots" active={activeTab} onClick={setActiveTab} title="Screenshots"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg></NavIcon>
        <NavIcon tab="worlds" active={activeTab} onClick={setActiveTab} title="Dünyalar"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg></NavIcon>
        <NavIcon tab="profiles" active={activeTab} onClick={setActiveTab} title="Profiller"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg></NavIcon>
        <NavIcon tab="mod-loaders" active={activeTab} onClick={setActiveTab} title="Mod Loader Kur"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="7.5 4.21 12 6.81 16.5 4.21" /><polyline points="7.5 19.79 7.5 14.6 3 12" /><polyline points="21 12 16.5 14.6 16.5 19.79" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg></NavIcon>
        <NavIcon tab="mod-downloader" active={activeTab} onClick={setActiveTab} title="Mod İndirici"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" /></svg></NavIcon>
        <NavIcon tab="skins" active={activeTab} onClick={setActiveTab} title="Skin"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /><rect x="2" y="2" width="20" height="20" rx="5" /></svg></NavIcon>
        <NavIcon tab="news" active={activeTab} onClick={setActiveTab} title="Haberler"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" /><line x1="10" y1="6" x2="18" y2="6" /><line x1="10" y1="10" x2="18" y2="10" /><line x1="10" y1="14" x2="14" y2="14" /></svg></NavIcon>
        <NavIcon tab="server-browser" active={activeTab} onClick={setActiveTab} title="Sunucu Keşfet"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" /></svg></NavIcon>
        <NavIcon tab="playtime" active={activeTab} onClick={setActiveTab} title="Oyun Süresi"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg></NavIcon>
        <NavIcon tab="crash-logs" active={activeTab} onClick={setActiveTab} title="Crash Log"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg></NavIcon>
        <NavIcon tab="modpacks" active={activeTab} onClick={setActiveTab} title="Modpack"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg></NavIcon>
        <NavIcon tab="favorites" active={activeTab} onClick={setActiveTab} title="Favoriler"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg></NavIcon>
        <NavIcon tab="game-stats" active={activeTab} onClick={setActiveTab} title="İstatistikler"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg></NavIcon>
        <NavIcon tab="motd" active={activeTab} onClick={setActiveTab} title="Sunucu MOTD"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12.55a11 11 0 0 1 14.08 0" /><path d="M1.42 9a16 16 0 0 1 21.16 0" /><path d="M8.53 16.11a6 6 0 0 1 6.95 0" /><line x1="12" y1="20" x2="12.01" y2="20" /></svg></NavIcon>
        <NavIcon tab="backup" active={activeTab} onClick={setActiveTab} title="Yedekleme"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg></NavIcon>
        <NavIcon tab="chat" active={activeTab} onClick={setActiveTab} title="Sohbet"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg></NavIcon>
        <NavIcon tab="achievements" active={activeTab} onClick={setActiveTab} title="Başarılar"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" /></svg></NavIcon>
        <NavIcon tab="console" active={activeTab} onClick={setActiveTab} title="Konsol Filtresi"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" /></svg></NavIcon>
        <NavIcon tab="perf" active={activeTab} onClick={setActiveTab} title="Performans"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg></NavIcon>
        <NavIcon tab="mod-updates" active={activeTab} onClick={setActiveTab} title="Mod Güncellemeleri"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg></NavIcon>
        <NavIcon tab="quick-actions" active={activeTab} onClick={setActiveTab} title="Hızlı Eylemler"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg></NavIcon>
        <NavIcon tab="ping-history" active={activeTab} onClick={setActiveTab} title="Ping Geçmişi"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg></NavIcon>
        <NavIcon tab="updates" active={activeTab} onClick={() => { setActiveTab("updates"); handleCheckUpdate(); }} title="Güncelleme"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg></NavIcon>
        <NavIcon tab="settings" active={activeTab} onClick={() => setShowSettings(true)} title="Ayarlar"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg></NavIcon>
      </div>
      {showSettings && <SettingsPanel settings={settings} onSave={save} onClose={() => setShowSettings(false)} onDetectJava={async () => { const f = await window.api.detectJava(); if (f) await save({ javaPath: f }); return f; }} />}
      <CommandPalette visible={showCommandPalette} onClose={() => setShowCommandPalette(false)} onTabChange={(t) => { setActiveTab(t); setShowCommandPalette(false); }} onAction={(id) => {
        if (id === "action-play") play();
        else if (id === "action-settings") setShowSettings(true);
        else if (id === "action-theme") setShowThemeCustomizer(true);
        else if (id === "action-java") { window.api.detectJava().then((f) => { if (f) save({ javaPath: f }); }); }
        else if (id === "action-open-dir") { settings?.gameDir && window.api.openFolder(settings.gameDir); }
        else if (id === "action-logout") logout();
        else if (id === "action-shortcuts") setShowShortcuts(true);
        setShowCommandPalette(false);
      }} />
      {showThemeCustomizer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setShowThemeCustomizer(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <ThemeCustomizer currentAccent={accentColor} onThemeChange={setAccentColor} onClose={() => setShowThemeCustomizer(false)} />
        </div>
      )}
      {showShortcuts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setShowShortcuts(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <KeyboardShortcutsHelp onClose={() => setShowShortcuts(false)} />
        </div>
      )}
    </div>
  );
}
