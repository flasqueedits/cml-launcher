import { ipcMain, BrowserWindow, dialog, shell, Notification } from "electron";
import path from "node:path";
import fs from "node:fs/promises";
import type { AppSettings, LaunchOptions, LocalServer, ModLoaderInfo, OnlineMod, ModpackInfo, FavoriteServer } from "../shared/types";
import { DownloadService } from "./services/DownloadService";
import { VersionManager } from "./services/VersionManager";
import { JavaService } from "./services/JavaService";
import { LaunchManager } from "./services/LaunchManager";
import { AuthService } from "./services/AuthService";
import { SettingsService } from "./services/SettingsService";
import { DiscordService } from "./services/DiscordService";
import { ServerListService } from "./services/ServerListService";
import { ModManagerService } from "./services/ModManagerService";
import { ProfileManagerService } from "./services/ProfileManagerService";
import { UpdateService } from "./services/UpdateService";
import { OnlineServices } from "./services/OnlineServices";
import { getResourcesDir } from "./logger";

export class IpcBridge {
  private downloader = new DownloadService();
  private versions: VersionManager;
  private java: JavaService;
  private launcher = new LaunchManager();
  private auth: AuthService;
  private settings: SettingsService;
  private discord: DiscordService;
  private servers: ServerListService;
  private mods: ModManagerService;
  private profiles: ProfileManagerService;
  private updater: UpdateService;
  private online: OnlineServices;
  private settingsCache: AppSettings;
  private playStartTime = 0;

  constructor(private readonly userDataDir: string) {
    this.settings = new SettingsService(userDataDir);
    this.versions = new VersionManager(this.downloader, getResourcesDir());
    this.java = new JavaService(this.downloader, path.join(userDataDir, "runtimes"));
    this.discord = new DiscordService();
    this.servers = new ServerListService(userDataDir);
    this.mods = new ModManagerService();
    this.profiles = new ProfileManagerService(userDataDir);
    this.updater = new UpdateService();
    this.online = new OnlineServices();
    this.auth = new AuthService(userDataDir, () => this.settingsCache?.clientId ?? "");
    this.settingsCache = defaults;
  }

  async init(): Promise<void> {
    this.settingsCache = await this.settings.load();
    await this.servers.load();
    await this.profiles.load();
  }

  register() {
    ipcMain.handle("settings:get", () => this.settings.load());
    ipcMain.handle("settings:save", async (_e, partial: Partial<AppSettings>) => {
      this.settingsCache = await this.settings.save(partial);
      return this.settingsCache;
    });

    ipcMain.handle("versions:list", (_e, force?: boolean) => this.versions.listVersions(!!force));
    ipcMain.handle("versions:resolve", (_e, id: string) => this.versions.resolve(id));

    ipcMain.handle("profile:get", () => this.auth.load());
    ipcMain.handle("profile:logout", () => this.auth.logout());
    ipcMain.handle("profile:login-offline", (_e, username: string) => this.auth.loginOffline(username));
    ipcMain.handle("profile:login-microsoft", () => this.auth.loginMicrosoft());

    ipcMain.handle("java:detect", () => this.java.detectInstalledJava());
    ipcMain.handle("java:install", async (_e, major: number) => {
      const win = this.mainWindow();
      return await this.java.installJava(major, (p) => this.send(win, "progress", p));
    });

    ipcMain.handle("game:ensure", async (_e, versionId: string) => {
      const win = this.mainWindow();
      await this.versions.ensureInstalled(versionId, (p) => this.send(win, "progress", p));
    });

    ipcMain.handle("game:launch", async (e, options: LaunchOptions) => {
      const win = BrowserWindow.fromWebContents(e.sender) ?? this.mainWindow();
      const version = await this.versions.resolve(options.versionId);
      this.playStartTime = Date.now();
      await this.online.recordPlayStart(options.gameDir, options.versionId).catch(() => {});
      await this.discord.setActivity({ versionId: options.versionId, username: options.username, state: "Oyunda", details: `Minecraft ${options.versionId} oynuyor` });
      return await this.launcher.launch(options, version, (line, level) => this.send(win, "game-log", { line, level }), async (code) => {
        await this.online.recordPlayEnd(options.gameDir, options.versionId, this.playStartTime).catch(() => {});
        await this.discord.clearActivity();
        this.send(win, "game-exit", code);
      });
    });

    ipcMain.handle("game:kill", () => this.launcher.kill());

    ipcMain.handle("discord:connect", async () => {
      const clientId = this.settingsCache.clientId || "00000000-0000-0000-0000-000000000000";
      return await this.discord.connect(clientId);
    });
    ipcMain.handle("discord:set-activity", async (_e, opts) => { await this.discord.setActivity(opts); });
    ipcMain.handle("discord:clear-activity", async () => { await this.discord.clearActivity(); });
    ipcMain.handle("discord:get-members", async () => await this.discord.getMembers());
    ipcMain.handle("discord:is-connected", async () => this.discord.isConnected());

    ipcMain.handle("shell:open-path", (_e, p: string) => { shell.openPath(p); });

    ipcMain.handle("servers:list", () => this.servers.load());
    ipcMain.handle("servers:add", (_e, server) => this.servers.addServer(server));
    ipcMain.handle("servers:remove", (_e, id: string) => this.servers.removeServer(id));
    ipcMain.handle("servers:ping", (_e, address: string, port: number) => this.servers.pingServer(address, port));

    ipcMain.handle("mods:resource-packs", (_e, gameDir: string) => this.mods.listResourcePacks(gameDir));
    ipcMain.handle("mods:toggle-resource-pack", (_e, gameDir: string, fileName: string, enabled: boolean) => this.mods.toggleResourcePack(gameDir, fileName, enabled));
    ipcMain.handle("mods:remove-resource-pack", (_e, gameDir: string, fileName: string) => this.mods.removeResourcePack(gameDir, fileName));

    ipcMain.handle("mods:shader-packs", (_e, gameDir: string) => this.mods.listShaderPacks(gameDir));
    ipcMain.handle("mods:toggle-shader-pack", (_e, gameDir: string, fileName: string, enabled: boolean) => this.mods.toggleShaderPack(gameDir, fileName, enabled));
    ipcMain.handle("mods:remove-shader-pack", (_e, gameDir: string, fileName: string) => this.mods.removeShaderPack(gameDir, fileName));

    ipcMain.handle("mods:mods", (_e, gameDir: string) => this.mods.listMods(gameDir));
    ipcMain.handle("mods:toggle-mod", (_e, gameDir: string, fileName: string, enabled: boolean) => this.mods.toggleMod(gameDir, fileName, enabled));
    ipcMain.handle("mods:remove-mod", (_e, gameDir: string, fileName: string) => this.mods.removeMod(gameDir, fileName));

    ipcMain.handle("screenshots:list", (_e, gameDir: string) => this.mods.listScreenshots(gameDir));
    ipcMain.handle("screenshots:remove", (_e, gameDir: string, fileName: string) => this.mods.removeScreenshot(gameDir, fileName));
    ipcMain.handle("screenshots:open", (_e, gameDir: string, fileName: string) => this.mods.openScreenshot(gameDir, fileName));

    ipcMain.handle("worlds:list", (_e, gameDir: string) => this.mods.listWorlds(gameDir));
    ipcMain.handle("worlds:remove", (_e, gameDir: string, folderName: string) => this.mods.removeWorld(gameDir, folderName));
    ipcMain.handle("worlds:backup", (_e, gameDir: string, folderName: string) => this.mods.backupWorld(gameDir, folderName));

    ipcMain.handle("game-profiles:list", () => this.profiles.list());
    ipcMain.handle("game-profiles:add", (_e, profile) => this.profiles.add(profile));
    ipcMain.handle("game-profiles:remove", (_e, id: string) => this.profiles.remove(id));
    ipcMain.handle("game-profiles:set-active", (_e, id: string) => this.profiles.setActive(id));
    ipcMain.handle("game-profiles:get-active", () => this.profiles.getActive());

    ipcMain.handle("updater:check", () => this.updater.checkUpdate());

    ipcMain.handle("mod-loaders:list", (_e, mcVersion: string) => this.online.listModLoaders(mcVersion));
    ipcMain.handle("mod-loaders:install", async (_e, loader: ModLoaderInfo, gameDir: string) => {
      const win = this.mainWindow();
      await this.online.installModLoader(loader, gameDir, (p) => this.send(win, "progress", p));
    });

    ipcMain.handle("mod-downloader:search", (_e, query: string, source: "curseforge" | "modrinth") => this.online.searchMods(query, source));
    ipcMain.handle("mod-downloader:install", async (_e, mod: OnlineMod, gameDir: string) => {
      const win = this.mainWindow();
      await this.online.installMod(mod, gameDir, (p) => this.send(win, "progress", p));
    });

    ipcMain.handle("news:get", () => this.online.getNews());
    ipcMain.handle("server-browser:get", () => this.online.getPopularServers());

    ipcMain.handle("playtime:get", (_e, gameDir: string, versionId: string) => this.online.getPlayTime(gameDir, versionId));
    ipcMain.handle("playtime:get-all", (_e, gameDir: string) => this.online.getAllPlayTime(gameDir));

    ipcMain.handle("crash-logs:list", (_e, gameDir: string) => this.online.getCrashLogs(gameDir));
    ipcMain.handle("crash-logs:analyze", (_e, log: string) => this.online.analyzeCrashLog(log));

    ipcMain.handle("skins:get", (_e, username: string) => this.online.getSkin(username));

    ipcMain.handle("skins:set", async (_e, gameDir: string, skinPath: string, model: "classic" | "slim") => {
      const skinsDir = path.join(gameDir, "skins");
      await fs.mkdir(skinsDir, { recursive: true });
      const ext = path.extname(skinPath) || ".png";
      const destName = `skin_${model}_${Date.now()}${ext}`;
      const dest = path.join(skinsDir, destName);
      await fs.copyFile(skinPath, dest);
      // Also keep a "current.png" symlink-like copy
      const currentDest = path.join(skinsDir, "current.png");
      await fs.copyFile(skinPath, currentDest);
      return dest;
    });

    ipcMain.handle("dialog:open-file", async (_e, options?: { title?: string; filters?: { name: string; extensions: string[] }[] }) => {
      const win = this.mainWindow();
      if (!win) return null;
      const result = await dialog.showOpenDialog(win, {
        title: options?.title || "Dosya Seç",
        filters: options?.filters || [{ name: "PNG Resimleri", extensions: ["png"] }, { name: "Tüm Dosyalar", extensions: ["*"] }],
        properties: ["openFile"],
      });
      if (result.canceled || result.filePaths.length === 0) return null;
      return result.filePaths[0];
    });

    ipcMain.handle("skins:list", async (_e, gameDir: string) => {
      const skinsDir = path.join(gameDir, "skins");
      try {
        const files = await fs.readdir(skinsDir);
        return files.filter((f) => /\.(png|jpg|jpeg)$/i.test(f));
      } catch { return []; }
    });

    ipcMain.handle("modpacks:search", (_e, query: string, source: "curseforge" | "modrinth") => this.online.searchModpacks(query, source));
    ipcMain.handle("modpacks:install", async (_e, modpack: ModpackInfo, gameDir: string) => {
      const win = this.mainWindow();
      await this.online.installModpack(modpack, gameDir, (p) => this.send(win, "progress", p));
    });

    ipcMain.handle("favorites:list", (_e, gameDir: string) => this.online.listFavoriteServers(gameDir));
    ipcMain.handle("favorites:add", (_e, gameDir: string, server: Omit<FavoriteServer, "id" | "addedAt">) => this.online.addFavoriteServer(gameDir, server));
    ipcMain.handle("favorites:remove", (_e, gameDir: string, id: string) => this.online.removeFavoriteServer(gameDir, id));

    ipcMain.handle("game-stats:get", (_e, gameDir: string) => this.online.getGameStats(gameDir));

    ipcMain.handle("local-server:start", (_e, config: LocalServer) => this.mods.startLocalServer(config));
    ipcMain.handle("local-server:stop", () => this.mods.stopLocalServer());
    ipcMain.handle("local-server:status", () => this.mods.getLocalServerStatus());

    ipcMain.handle("notifications:send", (_e, title: string, body: string) => {
      new Notification({ title, body, silent: false }).show();
    });

    ipcMain.handle("window:minimize", (e) => BrowserWindow.fromWebContents(e.sender)?.minimize());
    ipcMain.handle("window:maximize", (e) => {
      const win = BrowserWindow.fromWebContents(e.sender);
      if (!win) return;
      if (win.isMaximized()) win.unmaximize(); else win.maximize();
    });
    ipcMain.handle("window:close", (e) => {
      const win = BrowserWindow.fromWebContents(e.sender);
      if (!win) return;
      if (this.launcher.isRunning) {
        const choice = dialog.showMessageBoxSync(win, { type: "warning", title: "Oyun çalışıyor", message: "Oyun hâlâ çalışıyor. Kapatmak oyunu da kapatır.", buttons: ["Kapat", "Vazgeç"], defaultId: 1, cancelId: 1 });
        if (choice !== 0) return;
        this.launcher.kill();
      }
      this.mods.stopLocalServer().catch(() => {});
      this.discord.disconnect();
      win.close();
    });
  }

  dispose() {
    for (const channel of [
      "settings:get", "settings:save", "versions:list", "versions:resolve",
      "profile:get", "profile:logout", "profile:login-offline", "profile:login-microsoft",
      "java:detect", "java:install", "game:ensure", "game:launch", "game:kill",
      "discord:connect", "discord:set-activity", "discord:clear-activity", "discord:get-members", "discord:is-connected",
      "shell:open-path", "servers:list", "servers:add", "servers:remove", "servers:ping",
      "mods:resource-packs", "mods:toggle-resource-pack", "mods:remove-resource-pack",
      "mods:shader-packs", "mods:toggle-shader-pack", "mods:remove-shader-pack",
      "mods:mods", "mods:toggle-mod", "mods:remove-mod",
      "screenshots:list", "screenshots:remove", "screenshots:open",
      "worlds:list", "worlds:remove", "worlds:backup",
      "game-profiles:list", "game-profiles:add", "game-profiles:remove", "game-profiles:set-active", "game-profiles:get-active",
      "updater:check", "local-server:start", "local-server:stop", "local-server:status",
      "mod-loaders:list", "mod-loaders:install",
      "mod-downloader:search", "mod-downloader:install",
      "news:get", "server-browser:get", "playtime:get", "playtime:get-all",
      "crash-logs:list", "crash-logs:analyze",
      "skins:get", "skins:set", "skins:list", "dialog:open-file", "modpacks:search", "modpacks:install",
      "favorites:list", "favorites:add", "favorites:remove", "game-stats:get",
      "notifications:send",
      "window:minimize", "window:maximize", "window:close",
    ]) {
      ipcMain.removeHandler(channel);
    }
  }

  private mainWindow(): BrowserWindow | undefined {
    return BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0];
  }

  private send(win: BrowserWindow | undefined, channel: string, payload: unknown) {
    if (win && !win.isDestroyed()) win.webContents.send(channel, payload);
  }
}

const defaults: AppSettings = {
  gameDir: "", javaPath: "", ramMb: 4096, width: 854, height: 480,
  clientId: "00000000-0000-0000-0000-000000000000",
  fastPlay: false, autoStart: false, forceUpdate: false, customJvmArgs: "",
};
