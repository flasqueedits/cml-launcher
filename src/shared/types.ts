export type LogLevel = "info" | "warn" | "error" | "game" | "debug";

export interface MinecraftRelease {
  id: string;
  type: string;
  url: string;
  releaseTime: string;
}

export interface MinecraftLibrary {
  name: string;
  artifactPath: string;
  url: string;
  sha1?: string;
  size?: number;
  nativesPath?: string;
  nativesUrl?: string;
  extractToNatives: boolean;
  extractExclude?: string[];
}

export interface ResolvedVersion {
  id: string;
  mainClass: string;
  javaMajor: number;
  libraries: MinecraftLibrary[];
  jvmArgs: string[];
  gameArgs: string[];
  minecraftArguments?: string;
  clientUrl: string;
  clientSha1?: string;
  clientSize?: number;
  assetIndexId: string;
  assetIndexUrl: string;
  assetIndexSha1?: string;
  assetIndexSize?: number;
}

export interface PlayerProfile {
  username: string;
  uuid: string;
  type: "microsoft" | "offline";
}

export interface AppSettings {
  gameDir: string;
  javaPath: string;
  ramMb: number;
  width: number;
  height: number;
  clientId: string;
  fastPlay: boolean;
  autoStart: boolean;
  forceUpdate: boolean;
  customJvmArgs: string;
}

export interface ProgressInfo {
  message: string;
  fraction: number;
  weight: number;
}

export interface DiscordMember {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  status: "online" | "idle" | "dnd" | "offline";
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
}

export interface ServerInfo {
  id: string;
  name: string;
  address: string;
  port: number;
  version?: string;
  icon?: string;
  description?: string;
  ping?: number;
  online?: boolean;
  players?: { online: number; max: number };
}

export interface ResourcePack {
  name: string;
  fileName: string;
  size: number;
  enabled: boolean;
}

export interface ShaderPack {
  name: string;
  fileName: string;
  size: number;
  enabled: boolean;
}

export interface LocalServer {
  name: string;
  port: number;
  maxPlayers: number;
  gamemode: string;
  difficulty: string;
  motd: string;
  version: string;
  running: boolean;
  javaPath: string;
  gameDir: string;
  ramMb: number;
}

export interface ModInfo {
  name: string;
  fileName: string;
  size: number;
  enabled: boolean;
  modId?: string;
  version?: string;
  description?: string;
}

export interface ScreenshotInfo {
  fileName: string;
  size: number;
  takenAt: string;
  filePath: string;
}

export interface WorldInfo {
  name: string;
  folderName: string;
  version: string;
  lastPlayed: string;
  size: number;
  isLocked: boolean;
}

export interface GameProfile {
  id: string;
  name: string;
  username: string;
  uuid: string;
  type: "microsoft" | "offline";
  avatar?: string;
  createdAt: string;
}

export interface ModLoaderInfo {
  name: string;
  version: string;
  mcVersion: string;
  type: "forge" | "fabric" | "quilt" | "neoforge";
  installed: boolean;
}

export interface OnlineMod {
  id: string;
  name: string;
  slug: string;
  description: string;
  downloads: number;
  iconUrl: string;
  author: string;
  version: string;
  source: "curseforge" | "modrinth";
  downloadUrl: string;
  fileName: string;
  categories: string[];
  installable: boolean;
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  imageUrl: string;
  date: string;
  url: string;
  source: string;
}

export interface PopularServer {
  name: string;
  address: string;
  port: number;
  version: string;
  description: string;
  players: { online: number; max: number };
  tags: string[];
  ping?: number;
}

export interface PlayTimeRecord {
  versionId: string;
  totalMs: number;
  lastPlayed: string;
  sessions: { start: string; end: string; durationMs: number }[];
}

export interface CrashLog {
  id: string;
  timestamp: string;
  version: string;
  exception: string;
  message: string;
  stackTrace: string;
  file: string;
  analyzed: boolean;
  suggestion?: string;
}

export type PanelTab = "play" | "quick-play" | "servers" | "server-create" | "resource-packs" | "shader-packs" | "mods" | "mod-downloader" | "mod-loaders" | "modpacks" | "screenshots" | "worlds" | "profiles" | "skins" | "news" | "server-browser" | "playtime" | "game-stats" | "favorites" | "crash-logs" | "updates" | "settings" | "motd" | "backup" | "chat" | "achievements";

export interface ModpackInfo {
  id: string;
  name: string;
  slug: string;
  description: string;
  downloads: number;
  iconUrl: string;
  author: string;
  version: string;
  mcVersion: string;
  source: "curseforge" | "modrinth";
  downloadUrl: string;
  installed: boolean;
  installedVersion?: string;
}

export interface FavoriteServer {
  id: string;
  name: string;
  address: string;
  port: number;
  addedAt: string;
  lastConnected?: string;
  ping?: number;
}

export interface GameStats {
  totalPlayTimeMs: number;
  totalSessions: number;
  uniqueVersions: number;
  favoriteVersion: string;
  totalMods: number;
  totalResourcePacks: number;
  totalWorlds: number;
  totalScreenshots: number;
  crashCount: number;
  lastPlayed: string;
  dailyPlaytime: { date: string; ms: number }[];
}

export interface LauncherUpdate {
  available: boolean;
  version: string;
  url: string;
  changelog: string;
  releaseDate: string;
}

export interface Api {
  getSettings(): Promise<AppSettings>;
  saveSettings(s: Partial<AppSettings>): Promise<AppSettings>;
  listVersions(forceRefresh?: boolean): Promise<MinecraftRelease[]>;
  getProfile(): Promise<PlayerProfile | null>;
  loginMicrosoft(): Promise<PlayerProfile>;
  loginOffline(username: string): Promise<PlayerProfile>;
  logout(): Promise<void>;
  detectJava(): Promise<string | null>;
  resolveVersion(versionId: string): Promise<ResolvedVersion>;
  ensureInstalled(versionId: string, onProgress?: (p: ProgressInfo) => void): Promise<void>;
  launch(options: LaunchOptions, onLog: (line: string, level: LogLevel) => void, onExit: (code: number) => void): Promise<number>;
  installJava(major: number, onProgress?: (p: ProgressInfo) => void): Promise<string>;
  discordConnect(): Promise<boolean>;
  discordSetActivity(opts: { versionId: string; username: string; state?: string; details?: string }): Promise<void>;
  discordClearActivity(): Promise<void>;
  discordGetMembers(): Promise<DiscordMember[]>;
  discordIsConnected(): Promise<boolean>;
  openFolder(path: string): Promise<void>;
  listServers(): Promise<ServerInfo[]>;
  addServer(server: Omit<ServerInfo, "id">): Promise<ServerInfo>;
  removeServer(id: string): Promise<void>;
  pingServer(address: string, port: number): Promise<ServerInfo>;
  listResourcePacks(gameDir: string): Promise<ResourcePack[]>;
  toggleResourcePack(gameDir: string, fileName: string, enabled: boolean): Promise<void>;
  removeResourcePack(gameDir: string, fileName: string): Promise<void>;
  listShaderPacks(gameDir: string): Promise<ShaderPack[]>;
  toggleShaderPack(gameDir: string, fileName: string, enabled: boolean): Promise<void>;
  removeShaderPack(gameDir: string, fileName: string): Promise<void>;
  listMods(gameDir: string): Promise<ModInfo[]>;
  toggleMod(gameDir: string, fileName: string, enabled: boolean): Promise<void>;
  removeMod(gameDir: string, fileName: string): Promise<void>;
  listScreenshots(gameDir: string): Promise<ScreenshotInfo[]>;
  removeScreenshot(gameDir: string, fileName: string): Promise<void>;
  openScreenshot(gameDir: string, fileName: string): Promise<void>;
  listWorlds(gameDir: string): Promise<WorldInfo[]>;
  removeWorld(gameDir: string, folderName: string): Promise<void>;
  backupWorld(gameDir: string, folderName: string): Promise<string>;
  listGameProfiles(): Promise<GameProfile[]>;
  addGameProfile(profile: Omit<GameProfile, "id" | "createdAt">): Promise<GameProfile>;
  removeGameProfile(id: string): Promise<void>;
  setActiveGameProfile(id: string): Promise<void>;
  getActiveGameProfile(): Promise<GameProfile | null>;
  checkLauncherUpdate(): Promise<{ available: boolean; version: string; url: string; changelog: string; releaseDate: string }>;
  startLocalServer(config: LocalServer): Promise<void>;
  stopLocalServer(): Promise<void>;
  getLocalServerStatus(): Promise<{ running: boolean; logs: string[] }>;
  listModLoaders(mcVersion: string): Promise<ModLoaderInfo[]>;
  installModLoader(loader: ModLoaderInfo, gameDir: string): Promise<void>;
  searchMods(query: string, source: "curseforge" | "modrinth"): Promise<OnlineMod[]>;
  installMod(mod: OnlineMod, gameDir: string, onProgress?: (p: ProgressInfo) => void): Promise<void>;
  getNews(): Promise<NewsItem[]>;
  getPopularServers(): Promise<PopularServer[]>;
  getPlayTime(versionId: string): Promise<PlayTimeRecord>;
  getAllPlayTime(): Promise<PlayTimeRecord[]>;
  getCrashLogs(gameDir: string): Promise<CrashLog[]>;
  analyzeCrashLog(log: string): Promise<{ cause: string; suggestion: string }>;
  getSkin(username: string): Promise<string | null>;
  setSkin(gameDir: string, skinPath: string, model: "classic" | "slim"): Promise<string>;
  listSkins(gameDir: string): Promise<string[]>;
  openFileDialog(options?: { title?: string; filters?: { name: string; extensions: string[] }[] }): Promise<string | null>;
  sendNotification(title: string, body: string): Promise<void>;
  searchModpacks(query: string, source: "curseforge" | "modrinth"): Promise<ModpackInfo[]>;
  installModpack(modpack: ModpackInfo, gameDir: string): Promise<void>;
  listFavoriteServers(gameDir: string): Promise<FavoriteServer[]>;
  addFavoriteServer(gameDir: string, server: Omit<FavoriteServer, "id" | "addedAt">): Promise<FavoriteServer>;
  removeFavoriteServer(gameDir: string, id: string): Promise<void>;
  getGameStats(gameDir: string): Promise<GameStats>;
  windowMinimize(): void;
  windowMaximize(): void;
  windowClose(): void;
}

export interface LaunchOptions {
  username: string;
  uuid: string;
  versionId: string;
  javaPath: string;
  gameDir: string;
  ramMb: number;
  width: number;
  height: number;
  jvmArgs?: string[];
}
