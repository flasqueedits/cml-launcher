import { contextBridge, ipcRenderer } from "electron";
import type {
  Api, AppSettings, DiscordMember, GameProfile, LaunchOptions,
  LocalServer, LogLevel, ModInfo, OnlineMod, ModLoaderInfo,
  NewsItem, PopularServer, PlayTimeRecord, CrashLog, ModpackInfo, FavoriteServer, GameStats,
  ResourcePack, ScreenshotInfo, ServerInfo, ShaderPack, WorldInfo, ProgressInfo,
} from "../shared/types";

const api: Api = {
  getSettings: () => ipcRenderer.invoke("settings:get"),
  saveSettings: (s: Partial<AppSettings>) => ipcRenderer.invoke("settings:save", s),
  listVersions: (force?: boolean) => ipcRenderer.invoke("versions:list", force),
  getProfile: () => ipcRenderer.invoke("profile:get"),
  loginMicrosoft: () => ipcRenderer.invoke("profile:login-microsoft"),
  loginOffline: (username: string) => ipcRenderer.invoke("profile:login-offline", username),
  logout: () => ipcRenderer.invoke("profile:logout"),
  detectJava: () => ipcRenderer.invoke("java:detect"),
  resolveVersion: (id: string) => ipcRenderer.invoke("versions:resolve", id),
  ensureInstalled: (versionId: string, onProgress?: (p: ProgressInfo) => void) => {
    return new Promise<void>((resolve, reject) => {
      const listener = (_e: unknown, p: ProgressInfo) => onProgress?.(p);
      ipcRenderer.on("progress", listener);
      ipcRenderer.invoke("game:ensure", versionId)
        .then(() => { ipcRenderer.removeListener("progress", listener); resolve(); })
        .catch((err) => { ipcRenderer.removeListener("progress", listener); reject(err); });
    });
  },
  launch: (options: LaunchOptions, onLog: (line: string, level: LogLevel) => void, onExit: (code: number) => void) => {
    const logListener = (_e: unknown, data: { line: string; level: LogLevel }) => onLog(data.line, data.level);
    const exitListener = (_e: unknown, code: number) => { ipcRenderer.removeListener("game-log", logListener); ipcRenderer.removeListener("game-exit", exitListener); onExit(code); };
    ipcRenderer.on("game-log", logListener);
    ipcRenderer.on("game-exit", exitListener);
    return ipcRenderer.invoke("game:launch", options).catch((err) => { ipcRenderer.removeListener("game-log", logListener); ipcRenderer.removeListener("game-exit", exitListener); throw err; });
  },
  installJava: (major: number, onProgress?: (p: ProgressInfo) => void) => {
    return new Promise<string>((resolve, reject) => {
      const listener = (_e: unknown, p: ProgressInfo) => onProgress?.(p);
      ipcRenderer.on("progress", listener);
      ipcRenderer.invoke("java:install", major)
        .then((p) => { ipcRenderer.removeListener("progress", listener); resolve(p); })
        .catch((err) => { ipcRenderer.removeListener("progress", listener); reject(err); });
    });
  },
  discordConnect: () => ipcRenderer.invoke("discord:connect"),
  discordSetActivity: (opts) => ipcRenderer.invoke("discord:set-activity", opts),
  discordClearActivity: () => ipcRenderer.invoke("discord:clear-activity"),
  discordGetMembers: () => ipcRenderer.invoke("discord:get-members"),
  discordIsConnected: () => ipcRenderer.invoke("discord:is-connected"),
  openFolder: (p: string) => ipcRenderer.invoke("shell:open-path", p),
  listServers: () => ipcRenderer.invoke("servers:list"),
  addServer: (server) => ipcRenderer.invoke("servers:add", server),
  removeServer: (id: string) => ipcRenderer.invoke("servers:remove", id),
  pingServer: (address: string, port: number) => ipcRenderer.invoke("servers:ping", address, port),
  listResourcePacks: (gameDir: string) => ipcRenderer.invoke("mods:resource-packs", gameDir),
  toggleResourcePack: (gameDir: string, fileName: string, enabled: boolean) => ipcRenderer.invoke("mods:toggle-resource-pack", gameDir, fileName, enabled),
  removeResourcePack: (gameDir: string, fileName: string) => ipcRenderer.invoke("mods:remove-resource-pack", gameDir, fileName),
  listShaderPacks: (gameDir: string) => ipcRenderer.invoke("mods:shader-packs", gameDir),
  toggleShaderPack: (gameDir: string, fileName: string, enabled: boolean) => ipcRenderer.invoke("mods:toggle-shader-pack", gameDir, fileName, enabled),
  removeShaderPack: (gameDir: string, fileName: string) => ipcRenderer.invoke("mods:remove-shader-pack", gameDir, fileName),
  listMods: (gameDir: string) => ipcRenderer.invoke("mods:mods", gameDir),
  toggleMod: (gameDir: string, fileName: string, enabled: boolean) => ipcRenderer.invoke("mods:toggle-mod", gameDir, fileName, enabled),
  removeMod: (gameDir: string, fileName: string) => ipcRenderer.invoke("mods:remove-mod", gameDir, fileName),
  listScreenshots: (gameDir: string) => ipcRenderer.invoke("screenshots:list", gameDir),
  removeScreenshot: (gameDir: string, fileName: string) => ipcRenderer.invoke("screenshots:remove", gameDir, fileName),
  openScreenshot: (gameDir: string, fileName: string) => ipcRenderer.invoke("screenshots:open", gameDir, fileName),
  listWorlds: (gameDir: string) => ipcRenderer.invoke("worlds:list", gameDir),
  removeWorld: (gameDir: string, folderName: string) => ipcRenderer.invoke("worlds:remove", gameDir, folderName),
  backupWorld: (gameDir: string, folderName: string) => ipcRenderer.invoke("worlds:backup", gameDir, folderName),
  listGameProfiles: () => ipcRenderer.invoke("game-profiles:list"),
  addGameProfile: (profile) => ipcRenderer.invoke("game-profiles:add", profile),
  removeGameProfile: (id: string) => ipcRenderer.invoke("game-profiles:remove", id),
  setActiveGameProfile: (id: string) => ipcRenderer.invoke("game-profiles:set-active", id),
  getActiveGameProfile: () => ipcRenderer.invoke("game-profiles:get-active"),
  checkLauncherUpdate: () => ipcRenderer.invoke("updater:check"),
  listModLoaders: (mcVersion: string) => ipcRenderer.invoke("mod-loaders:list", mcVersion),
  installModLoader: (loader: ModLoaderInfo, gameDir: string) => {
    return new Promise<void>((resolve, reject) => {
      const listener = (_e: unknown, p: ProgressInfo) => {};
      ipcRenderer.on("progress", listener);
      ipcRenderer.invoke("mod-loaders:install", loader, gameDir)
        .then(() => { ipcRenderer.removeListener("progress", listener); resolve(); })
        .catch((err) => { ipcRenderer.removeListener("progress", listener); reject(err); });
    });
  },
  searchMods: (query: string, source: "curseforge" | "modrinth") => ipcRenderer.invoke("mod-downloader:search", query, source),
  installMod: (mod: OnlineMod, gameDir: string) => {
    return new Promise<void>((resolve, reject) => {
      const listener = (_e: unknown, p: ProgressInfo) => {};
      ipcRenderer.on("progress", listener);
      ipcRenderer.invoke("mod-downloader:install", mod, gameDir)
        .then(() => { ipcRenderer.removeListener("progress", listener); resolve(); })
        .catch((err) => { ipcRenderer.removeListener("progress", listener); reject(err); });
    });
  },
  getNews: () => ipcRenderer.invoke("news:get"),
  getPopularServers: () => ipcRenderer.invoke("server-browser:get"),
  getPlayTime: (gameDir: string, versionId: string) => ipcRenderer.invoke("playtime:get", gameDir, versionId),
  getAllPlayTime: (gameDir: string) => ipcRenderer.invoke("playtime:get-all", gameDir),
  getCrashLogs: (gameDir: string) => ipcRenderer.invoke("crash-logs:list", gameDir),
  analyzeCrashLog: (log: string) => ipcRenderer.invoke("crash-logs:analyze", log),
  getSkin: (username: string) => ipcRenderer.invoke("skins:get", username),
  setSkin: (gameDir: string, skinPath: string, model: "classic" | "slim") => ipcRenderer.invoke("skins:set", gameDir, skinPath, model),
  listSkins: (gameDir: string) => ipcRenderer.invoke("skins:list", gameDir),
  openFileDialog: (options?: { title?: string; filters?: { name: string; extensions: string[] }[] }) => ipcRenderer.invoke("dialog:open-file", options),
  searchModpacks: (query: string, source: "curseforge" | "modrinth") => ipcRenderer.invoke("modpacks:search", query, source),
  installModpack: (modpack: ModpackInfo, gameDir: string) => {
    return new Promise<void>((resolve, reject) => {
      const listener = (_e: unknown, p: ProgressInfo) => {};
      ipcRenderer.on("progress", listener);
      ipcRenderer.invoke("modpacks:install", modpack, gameDir)
        .then(() => { ipcRenderer.removeListener("progress", listener); resolve(); })
        .catch((err) => { ipcRenderer.removeListener("progress", listener); reject(err); });
    });
  },
  listFavoriteServers: (gameDir: string) => ipcRenderer.invoke("favorites:list", gameDir),
  addFavoriteServer: (gameDir: string, server: Omit<FavoriteServer, "id" | "addedAt">) => ipcRenderer.invoke("favorites:add", gameDir, server),
  removeFavoriteServer: (gameDir: string, id: string) => ipcRenderer.invoke("favorites:remove", gameDir, id),
  getGameStats: (gameDir: string) => ipcRenderer.invoke("game-stats:get", gameDir),
  sendNotification: (title: string, body: string) => ipcRenderer.invoke("notifications:send", title, body),
  startLocalServer: (config: LocalServer) => ipcRenderer.invoke("local-server:start", config),
  stopLocalServer: () => ipcRenderer.invoke("local-server:stop"),
  getLocalServerStatus: () => ipcRenderer.invoke("local-server:status"),
  windowMinimize: () => ipcRenderer.invoke("window:minimize"),
  windowMaximize: () => ipcRenderer.invoke("window:maximize"),
  windowClose: () => ipcRenderer.invoke("window:close"),
};

contextBridge.exposeInMainWorld("api", api);
