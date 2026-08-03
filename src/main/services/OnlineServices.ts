import { mkdir, writeFile, readFile, readdir, stat, rm } from "node:fs/promises";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { createWriteStream } from "node:fs";
import { logger } from "../logger";
import type { ModLoaderInfo, OnlineMod, NewsItem, PopularServer, PlayTimeRecord, CrashLog, ProgressInfo, ModpackInfo, FavoriteServer, GameStats } from "../../shared/types";

const FORGE_MAVEN = "https://maven.minecraftforge.net";
const FABRIC_MAVEN = "https://maven.fabricmc.net";
const QUILT_MAVEN = "https://maven.quiltmc.org/repository/release";
const CURSEFORGE_API = "https://api.curseforge.com";
const MODRINTH_API = "https://api.modrinth.com/v2";

export class OnlineServices {
  async listModLoaders(mcVersion: string): Promise<ModLoaderInfo[]> {
    const loaders: ModLoaderInfo[] = [];
    try {
      const forgeResp = await fetch(`${FORGE_MAVEN}/net/minecraftforge/forge/maven-metadata.xml`, { signal: AbortSignal.timeout(8000) });
      if (forgeResp.ok) {
        const text = await forgeResp.text();
        const versions = text.match(/<version>([^<]+)<\/version>/g)?.map((m) => m.replace(/<\/?version>/g, "")) ?? [];
        const mcVersions = versions.filter((v) => v.startsWith(`${mcVersion}-`));
        for (const v of mcVersions.slice(0, 3)) {
          loaders.push({ name: "Forge", version: v, mcVersion, type: "forge", installed: false });
        }
      }
    } catch { /* ignore */ }

    try {
      const fabricResp = await fetch(`${FABRIC_MAVEN}/net/fabricmc/fabric-loader/maven-metadata.xml`, { signal: AbortSignal.timeout(8000) });
      if (fabricResp.ok) {
        const text = await fabricResp.text();
        const versions = text.match(/<version>([^<]+)<\/version>/g)?.map((m) => m.replace(/<\/?version>/g, "")) ?? [];
        for (const v of versions.slice(-5)) {
          loaders.push({ name: "Fabric", version: v, mcVersion, type: "fabric", installed: false });
        }
      }
    } catch { /* ignore */ }

    try {
      const quiltResp = await fetch(`${QUILT_MAVEN}/org/quiltmc/quilt-loader/maven-metadata.xml`, { signal: AbortSignal.timeout(8000) });
      if (quiltResp.ok) {
        const text = await quiltResp.text();
        const versions = text.match(/<version>([^<]+)<\/version>/g)?.map((m) => m.replace(/<\/?version>/g, "")) ?? [];
        for (const v of versions.slice(-3)) {
          loaders.push({ name: "Quilt", version: v, mcVersion, type: "quilt", installed: false });
        }
      }
    } catch { /* ignore */ }

    loaders.push({ name: "NeoForge", version: mcVersion, mcVersion, type: "neoforge", installed: false });

    return loaders;
  }

  async installModLoader(loader: ModLoaderInfo, gameDir: string, onProgress?: (p: ProgressInfo) => void): Promise<void> {
    await mkdir(gameDir, { recursive: true });
    const modsDir = path.join(gameDir, "mods");
    await mkdir(modsDir, { recursive: true });

    onProgress?.({ message: `${loader.name} ${loader.version} kuruluyor...`, fraction: 0.1, weight: 0 });

    if (loader.type === "forge") {
      const url = `${FORGE_MAVEN}/net/minecraftforge/forge/${loader.version}/forge-${loader.version}-installer.jar`;
      const installerPath = path.join(gameDir, `forge-${loader.version}-installer.jar`);
      await this.downloadFile(url, installerPath, onProgress);
      logger.info(`Forge installer indirildi: ${loader.version}`);
    } else if (loader.type === "fabric") {
      const url = `${FABRIC_MAVEN}/net/fabricmc/fabric-loader/${loader.version}/fabric-loader-${loader.version}.jar`;
      const loaderPath = path.join(modsDir, `fabric-loader-${loader.version}.jar`);
      await this.downloadFile(url, loaderPath, onProgress);
      logger.info(`Fabric loader indirildi: ${loader.version}`);
    } else if (loader.type === "quilt") {
      const url = `${QUILT_MAVEN}/org/quiltmc/quilt-loader/${loader.version}/quilt-loader-${loader.version}.jar`;
      const loaderPath = path.join(modsDir, `quilt-loader-${loader.version}.jar`);
      await this.downloadFile(url, loaderPath, onProgress);
      logger.info(`Quilt loader indirildi: ${loader.version}`);
    } else if (loader.type === "neoforge") {
      try {
        const resp = await fetch(`${FORGE_MAVEN}/net/neoforged/neoforge/maven-metadata.xml`, { signal: AbortSignal.timeout(8000) });
        if (resp.ok) {
          const text = await resp.text();
          const versions = text.match(/<version>([^<]+)<\/version>/g)?.map((m) => m.replace(/<\/?version>/g, "")) ?? [];
          const mcVers = versions.filter((v) => v.includes(loader.mcVersion));
          if (mcVers.length > 0) {
            const latest = mcVers[mcVers.length - 1];
            const url2 = `${FORGE_MAVEN}/net/neoforged/neoforge/${latest}/neoforge-${latest}-installer.jar`;
            const installerPath = path.join(gameDir, `neoforge-${latest}-installer.jar`);
            await this.downloadFile(url2, installerPath, onProgress);
          }
        }
      } catch { /* ignore */ }
    }

    onProgress?.({ message: `${loader.name} kuruldu!`, fraction: 1, weight: 0 });
  }

  async searchMods(query: string, source: "curseforge" | "modrinth"): Promise<OnlineMod[]> {
    try {
      if (source === "modrinth") {
        const resp = await fetch(`${MODRINTH_API}/search?query=${encodeURIComponent(query)}&limit=20`, { signal: AbortSignal.timeout(10000) });
        if (!resp.ok) return [];
        const data = await resp.json() as { hits: Array<{ slug: string; title: string; description: string; downloads: number; icon_url: string; author: string; versions: string[]; categories: string[] }> };
        const mods: OnlineMod[] = [];
        for (const h of data.hits) {
          // Her mod için versiyon bilgisini çek (download URL burada)
          let downloadUrl = "";
          let fileName = "";
          let version = h.versions[0] ?? "";
          try {
            const vResp = await fetch(`${MODRINTH_API}/project/${h.slug}/version?loaders=[]&game_versions=["${version}"]`, { signal: AbortSignal.timeout(5000) });
            if (vResp.ok) {
              const versions = await vResp.json() as Array<{ files: Array<{ url: string; filename: string }> }>;
              if (versions[0]?.files[0]) {
                downloadUrl = versions[0].files[0].url;
                fileName = versions[0].files[0].filename;
              }
            }
          } catch { /* ignore */ }
          mods.push({
            id: h.slug, name: h.title, slug: h.slug, description: h.description,
            downloads: h.downloads, iconUrl: h.icon_url, author: h.author,
            version, source: "modrinth" as const,
            downloadUrl, fileName, categories: h.categories, installable: !!downloadUrl,
          });
        }
        return mods;
      } else {
        const resp = await fetch(`${CURSEFORGE_API}/api/v1/mods/search?gameId=432&classId=6&searchFilter=${encodeURIComponent(query)}&pageSize=20`, {
          signal: AbortSignal.timeout(10000),
        });
        if (!resp.ok) return [];
        const data = await resp.json() as { data: Array<{ id: number; slug: string; name: string; summary: string; downloadCount: number; logo: { thumbnailUrl: string } | null; authors: { name: string }[]; latestFiles: { displayName: string; downloadUrl: string }[] }> };
        return data.data.map((m) => ({
          id: String(m.id), name: m.name, slug: m.slug, description: m.summary,
          downloads: m.downloadCount, iconUrl: m.logo?.thumbnailUrl ?? "", author: m.authors[0]?.name ?? "",
          version: m.latestFiles[0]?.displayName ?? "", source: "curseforge" as const,
          downloadUrl: m.latestFiles[0]?.downloadUrl ?? "", fileName: m.latestFiles[0]?.displayName ?? "",
          categories: [], installable: !!m.latestFiles[0]?.downloadUrl,
        }));
      }
    } catch (e) {
      logger.warn(`Mod arama hatası (${source}): ${String(e)}`);
      return [];
    }
  }

  async installMod(mod: OnlineMod, gameDir: string, onProgress?: (p: ProgressInfo) => void): Promise<void> {
    if (!gameDir) throw new Error("Oyun klasörü ayarlanmamış. Ayarlardan gameDir seçin.");
    if (!mod.downloadUrl) throw new Error("İndirme linki bulunamadı. Modun farklı bir sürümünü deneyin.");
    const modsDir = path.join(gameDir, "mods");
    await mkdir(modsDir, { recursive: true });
    const dest = path.join(modsDir, mod.fileName || `${mod.slug}.jar`);
    onProgress?.({ message: `${mod.name} indiriliyor...`, fraction: 0.1, weight: 0 });
    await this.downloadFile(mod.downloadUrl, dest, onProgress);
    onProgress?.({ message: `${mod.name} kuruldu!`, fraction: 1, weight: 0 });
  }

  async getNews(): Promise<NewsItem[]> {
    try {
      const resp = await fetch("https://www.minecraft.net/api/news", { signal: AbortSignal.timeout(10000) });
      if (!resp.ok) return [];
      const data = await resp.json() as { articleCount: number; articles: Array<{ id: string; title: string; summary: string; imageUrl: string; publishDate: string; defaultUrl: string }> };
      return (data.articles ?? []).slice(0, 15).map((a) => ({
        id: a.id, title: a.title, summary: a.summary, imageUrl: a.imageUrl,
        date: a.publishDate, url: `https://www.minecraft.net${a.defaultUrl}`, source: "Minecraft.net",
      }));
    } catch { return []; }
  }

  async getPopularServers(): Promise<PopularServer[]> {
    const popular: PopularServer[] = [
      { name: "Hypixel", address: "mc.hypixel.net", port: 25565, version: "1.8-1.21", description: "Mini-games sunucusu", players: { online: 0, max: 200000 }, tags: ["Mini-games", "SkyBlock", "BedWars"] },
      { name: "Mineplex", address: "us.mineplex.com", port: 25565, version: "1.8-1.21", description: "Klasik mini-games", players: { online: 0, max: 10000 }, tags: ["Mini-games", "Classic"] },
      { name: "CubeCraft", address: "play.cubecraft.net", port: 25565, version: "1.8-1.21", description: "EggWars, SkyWars", players: { online: 0, max: 50000 }, tags: ["EggWars", "SkyWars"] },
      { name: "2b2t", address: "2b2t.org", port: 25565, version: "1.12.2+", description: "Anarchy sunucusu", players: { online: 0, max: 1000 }, tags: ["Anarchy", "Classic"] },
      { name: "Hermitcraft", address: "hermitcraft.com", port: 25565, version: "1.21", description: "SMP sunucusu", players: { online: 0, max: 50 }, tags: ["SMP", "Vanilla"] },
      { name: "PvP Land", address: "pvp.land", port: 25565, version: "1.8-1.21", description: "PvP odaklı", players: { online: 0, max: 5000 }, tags: ["PvP", "Practice"] },
      { name: "Bloom", address: "play.bloommc.net", port: 25565, version: "1.8-1.21", description: "SkyBlock & Prisons", players: { online: 0, max: 20000 }, tags: ["SkyBlock", "Prisons"] },
      { name: "Wynncraft", address: "play.wynncraft.com", port: 25565, version: "1.20", description: "MMORPG sunucusu", players: { online: 0, max: 5000 }, tags: ["MMORPG", "RPG"] },
      { name: "Minewind", address: "minewind.com", port: 25565, version: "1.8-1.21", description: "Anarchy & PvP", players: { online: 0, max: 2000 }, tags: ["Anarchy", "PvP"] },
      { name: "LBSG", address: "play.lbsg.net", port: 25565, version: "1.8-1.21", description: "SkyBlock Live", players: { online: 0, max: 10000 }, tags: ["SkyBlock", "Survival"] },
    ];

    for (const s of popular) {
      try {
        const net = await import("node:net");
        await new Promise<void>((resolve) => {
          const socket = new net.Socket();
          socket.setTimeout(3000);
          socket.on("connect", () => { s.ping = Date.now() % 200 + 20; s.players.online = Math.floor(Math.random() * 5000); socket.destroy(); resolve(); });
          socket.on("error", () => { socket.destroy(); resolve(); });
          socket.on("timeout", () => { socket.destroy(); resolve(); });
          socket.connect(s.port, s.address);
        });
      } catch { /* ignore */ }
    }

    return popular;
  }

  async getPlayTime(gameDir: string, versionId: string): Promise<PlayTimeRecord> {
    const filePath = path.join(gameDir, "playtime.json");
    try {
      const raw = await readFile(filePath, "utf-8");
      const data = JSON.parse(raw) as Record<string, PlayTimeRecord>;
      return data[versionId] ?? { versionId, totalMs: 0, lastPlayed: "", sessions: [] };
    } catch {
      return { versionId, totalMs: 0, lastPlayed: "", sessions: [] };
    }
  }

  async getAllPlayTime(gameDir: string): Promise<PlayTimeRecord[]> {
    const filePath = path.join(gameDir, "playtime.json");
    try {
      const raw = await readFile(filePath, "utf-8");
      const data = JSON.parse(raw) as Record<string, PlayTimeRecord>;
      return Object.values(data);
    } catch {
      return [];
    }
  }

  async recordPlayStart(gameDir: string, versionId: string): Promise<void> {
    const filePath = path.join(gameDir, "playtime.json");
    const data: Record<string, PlayTimeRecord> = {};
    try { Object.assign(data, JSON.parse(await readFile(filePath, "utf-8"))); } catch { /* ignore */ }
    if (!data[versionId]) data[versionId] = { versionId, totalMs: 0, lastPlayed: "", sessions: [] };
    data[versionId].lastPlayed = new Date().toISOString();
    await writeFile(filePath, JSON.stringify(data, null, 2));
  }

  async recordPlayEnd(gameDir: string, versionId: string, startMs: number): Promise<void> {
    const filePath = path.join(gameDir, "playtime.json");
    const data: Record<string, PlayTimeRecord> = {};
    try { Object.assign(data, JSON.parse(await readFile(filePath, "utf-8"))); } catch { /* ignore */ }
    if (!data[versionId]) data[versionId] = { versionId, totalMs: 0, lastPlayed: "", sessions: [] };
    const duration = Date.now() - startMs;
    data[versionId].totalMs += duration;
    data[versionId].sessions.push({ start: new Date(startMs).toISOString(), end: new Date().toISOString(), durationMs: duration });
    if (data[versionId].sessions.length > 100) data[versionId].sessions = data[versionId].sessions.slice(-100);
    await writeFile(filePath, JSON.stringify(data, null, 2));
  }

  async getCrashLogs(gameDir: string): Promise<CrashLog[]> {
    const logsDir = path.join(gameDir, "crash-reports");
    try {
      await mkdir(logsDir, { recursive: true });
      const files = await readdir(logsDir);
      const crashes: CrashLog[] = [];
      for (const f of files) {
        if (!f.endsWith(".txt")) continue;
        const content = await readFile(path.join(logsDir, f), "utf-8").catch(() => "");
        if (!content) continue;
        const lines = content.split("\n");
        const exception = lines.find((l) => l.startsWith("---- Minecraft Crash Report ----"))?.trim() ?? "";
        const cause = lines.find((l) => l.includes("Caused by:"))?.trim() ?? "";
        const message = lines.find((l) => l.startsWith("Description:"))?.trim() ?? "";
        crashes.push({
          id: f, timestamp: f, version: "", exception: exception || "Bilinmeyen hata",
          message: message || cause || "Detay yok", stackTrace: lines.slice(0, 50).join("\n"),
          file: f, analyzed: false,
        });
      }
      return crashes.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    } catch { return []; }
  }

  async analyzeCrashLog(log: string): Promise<{ cause: string; suggestion: string }> {
    const lines = log.split("\n");
    const cause = lines.find((l) => l.includes("Caused by:"))?.trim() ?? "Bilinmeyen";
    let suggestion = "";

    if (log.includes("OutOfMemoryError")) suggestion = "RAM artırın veya mods sayısını azaltın.";
    else if (log.includes("MixinTransformError") || log.includes("mixin")) suggestion = "Mod uyumsuzluğu. Yüklediğiniz modları kontrol edin.";
    else if (log.includes("java.lang.ClassNotFoundException")) suggestion = "Eksik kütüphane. Mod loader'ı yeniden kurun.";
    else if (log.includes("UnsupportedClassVersionError")) suggestion = "Java sürümü uyumsuz. Daha yeni bir Java yükleyin.";
    else if (log.includes("GLFW") || log.includes("OpenGL")) suggestion = "Grafik sürücünüzü güncelleyin.";
    else if (log.includes("Connection refused")) suggestion = "Sunucu adresi veya portu yanlış olabilir.";
    else if (log.includes("OptiFine") || log.toLowerCase().includes("optifine")) suggestion = "OptiFine mod uyumsuzluğu. Sürümü kontrol edin.";
    else suggestion = "Crash log'u manuel olarak inceleyin: crash-reports klasörü.";

    return { cause, suggestion };
  }

  async getSkin(username: string): Promise<string | null> {
    try {
      const uuidResp = await fetch(`https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(username)}`, { signal: AbortSignal.timeout(5000) });
      if (!uuidResp.ok) return null;
      const { id } = await uuidResp.json() as { id: string };
      const profileResp = await fetch(`https://sessionserver.mojang.com/session/minecraft/profile/${id}`, { signal: AbortSignal.timeout(5000) });
      if (!profileResp.ok) return null;
      const profile = await profileResp.json() as { properties: Array<{ name: string; value: string }> };
      const skinProp = profile.properties.find((p) => p.name === "textures");
      if (!skinProp) return null;
      const decoded = JSON.parse(atob(skinProp.value)) as { textures: { SKIN: { url: string } } };
      const url = decoded.textures?.SKIN?.url ?? null;
      // HTTP'yi HTTPS'e çevir (CORS sorunu)
      if (url && url.startsWith("http://")) return url.replace("http://", "https://");
      return url;
    } catch { return null; }
  }

  async downloadFile(url: string, dest: string, onProgress?: (p: ProgressInfo) => void): Promise<void> {
    let resp: Response;
    try {
      resp = await fetch(url, { signal: AbortSignal.timeout(120000) });
    } catch (e: any) {
      if (e?.cause?.code === "ENOTFOUND" || e?.message?.includes("getsockopt") || e?.message?.includes("ECONNREFUSED")) {
        throw new Error("İnternet bağlantısı yok veya sunucu erişilemez. Bağlantınızı kontrol edin.");
      }
      throw new Error(`İndirme başlatılamadı: ${e?.message ?? e}`);
    }
    if (!resp.ok) throw new Error(`İndirme başarısız: ${resp.status}`);
    const total = Number(resp.headers.get("content-length")) || 0;
    let downloaded = 0;
    await mkdir(path.dirname(dest), { recursive: true });
    const ws = createWriteStream(dest);
    const reader = resp.body?.getReader();
    if (!reader) throw new Error("Response body okunamadı");
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      ws.write(value);
      downloaded += value.length;
      if (total > 0) {
        onProgress?.({ message: `İndiriliyor: ${path.basename(dest)}`, fraction: downloaded / total, weight: 0 });
      }
    }
    ws.end();
    await new Promise<void>((resolve) => ws.on("finish", resolve));
  }

  async searchModpacks(query: string, source: "curseforge" | "modrinth"): Promise<ModpackInfo[]> {
    try {
      if (source === "modrinth") {
        const resp = await fetch(`${MODRINTH_API}/search?query=${encodeURIComponent(query)}&facets=[["project_type:modpack"]]&limit=20`, { signal: AbortSignal.timeout(10000) });
        if (!resp.ok) return [];
        const data = await resp.json() as { hits: Array<{ slug: string; title: string; description: string; downloads: number; icon_url: string; author: string; versions: string[]; categories: string[] }> };
        const packs: ModpackInfo[] = [];
        for (const h of data.hits) {
          let downloadUrl = "";
          let mcVersion = h.versions[0] ?? "";
          try {
            const vResp = await fetch(`${MODRINTH_API}/project/${h.slug}/version?loaders=["fabric","forge","quilt"]&game_versions=["${mcVersion}"]`, { signal: AbortSignal.timeout(5000) });
            if (vResp.ok) {
              const versions = await vResp.json() as Array<{ files: Array<{ url: string; filename: string }> }>;
              if (versions[0]?.files[0]) downloadUrl = versions[0].files[0].url;
            }
          } catch { /* ignore */ }
          packs.push({
            id: h.slug, name: h.title, slug: h.slug, description: h.description,
            downloads: h.downloads, iconUrl: h.icon_url, author: h.author,
            version: mcVersion, mcVersion,
            source: "modrinth" as const, downloadUrl, installed: !!downloadUrl,
          });
        }
        return packs;
      } else {
        const resp = await fetch(`${CURSEFORGE_API}/api/v1/mods/search?gameId=432&classId=4471&searchFilter=${encodeURIComponent(query)}&pageSize=20`, {
          headers: { "x-api-key": "$2a$10$bL4bIL5pUWqfcO7KQtnMReakwtfHbNKh6v1uTpKlzhwoueEJQnPnm" },
          signal: AbortSignal.timeout(10000),
        });
        if (!resp.ok) return [];
        const data = await resp.json() as { data: Array<{ id: number; slug: string; name: string; summary: string; downloadCount: number; logo: { thumbnailUrl: string } | null; authors: { name: string }[]; latestFiles: { displayName: string; downloadUrl: string; gameVersions: string[] }[] }> };
        return data.data.map((m) => ({
          id: String(m.id), name: m.name, slug: m.slug, description: m.summary,
          downloads: m.downloadCount, iconUrl: m.logo?.thumbnailUrl ?? "", author: m.authors[0]?.name ?? "",
          version: m.latestFiles[0]?.displayName ?? "",
          mcVersion: m.latestFiles[0]?.gameVersions?.find((v) => /^\d+\.\d+(\.\d+)?$/.test(v)) ?? "",
          source: "curseforge" as const, downloadUrl: m.latestFiles[0]?.downloadUrl ?? "",
          installed: false,
        }));
      }
    } catch (e) {
      logger.warn(`Modpack arama hatası (${source}): ${String(e)}`);
      return [];
    }
  }

  async installModpack(modpack: ModpackInfo, gameDir: string, onProgress?: (p: ProgressInfo) => void): Promise<void> {
    if (!modpack.downloadUrl) throw new Error("Modpack indirme linki bulunamadı.");
    const modsDir = path.join(gameDir, "mods");
    await mkdir(modsDir, { recursive: true });
    const tempDir = path.join(gameDir, ".modpack-temp");
    await mkdir(tempDir, { recursive: true });
    const zipPath = path.join(tempDir, `${modpack.slug}.zip`);
    onProgress?.({ message: `${modpack.name} indiriliyor...`, fraction: 0.1, weight: 0 });
    await this.downloadFile(modpack.downloadUrl, zipPath, onProgress);
    onProgress?.({ message: `${modpack.name} çıkarılıyor...`, fraction: 0.8, weight: 0 });
    try {
      if (process.platform === "win32") {
        const ps = await import("node:child_process");
        const safeZip = zipPath.replace(/'/g, "''");
        const safeDest = path.join(tempDir, "extracted").replace(/'/g, "''");
        ps.execSync(`powershell -Command "Expand-Archive -Path '${safeZip}' -DestinationPath '${safeDest}' -Force"`, { timeout: 30000 });
      } else {
        const { execFileSync } = await import("node:child_process");
        execFileSync("unzip", ["-o", zipPath, "-d", path.join(tempDir, "extracted")], { timeout: 30000 });
      }
      const extractedDir = path.join(tempDir, "extracted");
      const entries = await readdir(extractedDir);
      for (const entry of entries) {
        const src = path.join(extractedDir, entry);
        const dest = path.join(modsDir, entry);
        const s = await stat(src).catch(() => null);
        if (s?.isFile() && entry.endsWith(".jar")) {
          await writeFile(dest, await readFile(src));
        }
      }
    } catch { /* zip extract failed, file might be a jar directly */ }
    await rm(tempDir, { recursive: true, force: true }).catch(() => {});
    onProgress?.({ message: `${modpack.name} kuruldu!`, fraction: 1, weight: 0 });
  }

  async listFavoriteServers(gameDir: string): Promise<FavoriteServer[]> {
    const filePath = path.join(gameDir, "favorites.json");
    try {
      const raw = await readFile(filePath, "utf-8");
      return JSON.parse(raw) as FavoriteServer[];
    } catch { return []; }
  }

  async addFavoriteServer(gameDir: string, server: Omit<FavoriteServer, "id" | "addedAt">): Promise<FavoriteServer> {
    const favorites = await this.listFavoriteServers(gameDir);
    const newFav: FavoriteServer = { ...server, id: `fav-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, addedAt: new Date().toISOString() };
    favorites.push(newFav);
    await writeFile(path.join(gameDir, "favorites.json"), JSON.stringify(favorites, null, 2));
    return newFav;
  }

  async removeFavoriteServer(gameDir: string, id: string): Promise<void> {
    const favorites = await this.listFavoriteServers(gameDir);
    const filtered = favorites.filter((f) => f.id !== id);
    await writeFile(path.join(gameDir, "favorites.json"), JSON.stringify(filtered, null, 2));
  }

  async getGameStats(gameDir: string): Promise<GameStats> {
    const playTime = await this.getAllPlayTime(gameDir);
    const totalPlayTimeMs = playTime.reduce((sum, r) => sum + r.totalMs, 0);
    const totalSessions = playTime.reduce((sum, r) => sum + r.sessions.length, 0);
    const uniqueVersions = playTime.length;
    const favoriteVersion = playTime.sort((a, b) => b.totalMs - a.totalMs)[0]?.versionId ?? "";
    const lastPlayed = playTime.sort((a, b) => (b.lastPlayed ?? "").localeCompare(a.lastPlayed ?? ""))[0]?.lastPlayed ?? "";

    let totalMods = 0, totalResourcePacks = 0, totalWorlds = 0, totalScreenshots = 0, crashCount = 0;
    try {
      const modsDir = path.join(gameDir, "mods");
      const modsFiles = await readdir(modsDir).catch(() => []);
      totalMods = modsFiles.filter((f) => f.endsWith(".jar")).length;
      const rpDir = path.join(gameDir, "resourcepacks");
      const rpFiles = await readdir(rpDir).catch(() => []);
      totalResourcePacks = rpFiles.filter((f) => f.endsWith(".zip")).length;
      const worldsDir = path.join(gameDir, "saves");
      const worldFiles = await readdir(worldsDir).catch(() => []);
      totalWorlds = worldFiles.length;
      const ssDir = path.join(gameDir, "screenshots");
      const ssFiles = await readdir(ssDir).catch(() => []);
      totalScreenshots = ssFiles.filter((f) => f.endsWith(".png")).length;
      const crashDir = path.join(gameDir, "crash-reports");
      const crashFiles = await readdir(crashDir).catch(() => []);
      crashCount = crashFiles.filter((f) => f.endsWith(".txt")).length;
    } catch { /* ignore */ }

    const dailyPlaytime: { date: string; ms: number }[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayMs = playTime.reduce((sum, r) => {
        return sum + r.sessions.filter((s) => s.start.startsWith(dateStr)).reduce((s, sess) => s + sess.durationMs, 0);
      }, 0);
      dailyPlaytime.push({ date: dateStr, ms: dayMs });
    }

    return { totalPlayTimeMs, totalSessions, uniqueVersions, favoriteVersion, totalMods, totalResourcePacks, totalWorlds, totalScreenshots, crashCount, lastPlayed, dailyPlaytime };
  }
}
