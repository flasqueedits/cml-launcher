import { readdir, stat, rename, unlink, mkdir, writeFile, copyFile } from "node:fs/promises";
import path from "node:path";
import type { ResourcePack, ShaderPack, LocalServer, ModInfo, ScreenshotInfo, WorldInfo } from "../../shared/types";
import { spawn, type ChildProcess } from "node:child_process";
import { logger } from "../logger";

export class ModManagerService {
  private localServerProcess: ChildProcess | null = null;
  private serverLogs: string[] = [];

  private async listFiles(dir: string, extensions: string[]): Promise<{ name: string; fileName: string; size: number }[]> {
    try {
      await mkdir(dir, { recursive: true });
      const files = await readdir(dir);
      const result: { name: string; fileName: string; size: number }[] = [];
      for (const f of files) {
        if (!extensions.some((ext) => f.endsWith(ext))) continue;
        const s = await stat(path.join(dir, f)).catch(() => null);
        if (!s) continue;
        result.push({ name: f.replace(/\.(zip|jar|disabled)$/i, ""), fileName: f, size: s.size });
      }
      return result;
    } catch {
      return [];
    }
  }

  private async toggleFile(dir: string, fileName: string, enabled: boolean): Promise<void> {
    const src = path.join(dir, fileName);
    const dst = path.join(dir, enabled ? fileName.replace(/\.disabled$/, "") : `${fileName}.disabled`);
    try { await rename(src, dst); } catch { /* already in correct state */ }
  }

  private async removeFile(dir: string, fileName: string): Promise<void> {
    try { await unlink(path.join(dir, fileName)); } catch {
      try { await unlink(path.join(dir, `${fileName}.disabled`)); } catch { /* not found */ }
    }
  }

  async listMods(gameDir: string): Promise<ModInfo[]> {
    const dir = path.join(gameDir, "mods");
    const files = await this.listFiles(dir, [".jar", ".zip"]);
    return files.map((f) => ({ ...f, enabled: !f.fileName.endsWith(".disabled") }));
  }

  async toggleMod(gameDir: string, fileName: string, enabled: boolean): Promise<void> {
    await this.toggleFile(path.join(gameDir, "mods"), fileName, enabled);
  }

  async removeMod(gameDir: string, fileName: string): Promise<void> {
    await this.removeFile(path.join(gameDir, "mods"), fileName);
  }

  async listResourcePacks(gameDir: string): Promise<ResourcePack[]> {
    const dir = path.join(gameDir, "resourcepacks");
    const files = await this.listFiles(dir, [".zip"]);
    return files.map((f) => ({ ...f, enabled: !f.fileName.endsWith(".disabled") }));
  }

  async toggleResourcePack(gameDir: string, fileName: string, enabled: boolean): Promise<void> {
    await this.toggleFile(path.join(gameDir, "resourcepacks"), fileName, enabled);
  }

  async removeResourcePack(gameDir: string, fileName: string): Promise<void> {
    await this.removeFile(path.join(gameDir, "resourcepacks"), fileName);
  }

  async listShaderPacks(gameDir: string): Promise<ShaderPack[]> {
    const dir = path.join(gameDir, "shaderpacks");
    const files = await this.listFiles(dir, [".zip", ".jar"]);
    return files.map((f) => ({ ...f, enabled: !f.fileName.endsWith(".disabled") }));
  }

  async toggleShaderPack(gameDir: string, fileName: string, enabled: boolean): Promise<void> {
    await this.toggleFile(path.join(gameDir, "shaderpacks"), fileName, enabled);
  }

  async removeShaderPack(gameDir: string, fileName: string): Promise<void> {
    await this.removeFile(path.join(gameDir, "shaderpacks"), fileName);
  }

  async listScreenshots(gameDir: string): Promise<ScreenshotInfo[]> {
    const dir = path.join(gameDir, "screenshots");
    try {
      await mkdir(dir, { recursive: true });
      const files = await readdir(dir);
      const result: ScreenshotInfo[] = [];
      for (const f of files) {
        if (!f.endsWith(".png") && !f.endsWith(".jpg")) continue;
        const s = await stat(path.join(dir, f)).catch(() => null);
        if (!s) continue;
        result.push({
          fileName: f,
          size: s.size,
          takenAt: s.mtime.toISOString(),
          filePath: path.join(dir, f),
        });
      }
      return result.sort((a, b) => b.takenAt.localeCompare(a.takenAt));
    } catch {
      return [];
    }
  }

  async removeScreenshot(gameDir: string, fileName: string): Promise<void> {
    await this.removeFile(path.join(gameDir, "screenshots"), fileName);
  }

  async openScreenshot(gameDir: string, fileName: string): Promise<void> {
    const { shell } = await import("electron");
    await shell.openPath(path.join(gameDir, "screenshots", fileName));
  }

  async listWorlds(gameDir: string): Promise<WorldInfo[]> {
    const dir = path.join(gameDir, "saves");
    try {
      await mkdir(dir, { recursive: true });
      const entries = await readdir(dir, { withFileTypes: true });
      const result: WorldInfo[] = [];
      for (const e of entries) {
        if (!e.isDirectory()) continue;
        const levelDat = path.join(dir, e.name, "level.dat");
        const s = await stat(path.join(dir, e.name)).catch(() => null);
        let version = "Bilinmiyor";
        let lastPlayed = "";
        try {
          const levelData = await import("node:fs").then((fs) => fs.readFileSync(levelDat));
          const text = levelData.toString("utf-8");
          const versionMatch = text.match(/Version:(\w+)/);
          if (versionMatch) version = versionMatch[1];
          const lastMatch = text.match(/LastPlayed:(\w+)/);
          if (lastMatch) lastPlayed = lastMatch[1];
        } catch { /* no level.dat */ }
        result.push({
          name: e.name,
          folderName: e.name,
          version,
          lastPlayed: lastPlayed || (s?.mtime.toISOString() ?? ""),
          size: s?.size ?? 0,
          isLocked: false,
        });
      }
      return result;
    } catch {
      return [];
    }
  }

  async removeWorld(gameDir: string, folderName: string): Promise<void> {
    const dir = path.join(gameDir, "saves", folderName);
    const fs = await import("node:fs/promises");
    await fs.rm(dir, { recursive: true, force: true });
  }

  async backupWorld(gameDir: string, folderName: string): Promise<string> {
    const src = path.join(gameDir, "saves", folderName);
    const backupDir = path.join(gameDir, "backups", "worlds");
    await mkdir(backupDir, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const dst = path.join(backupDir, `${folderName}_${timestamp}`);
    const fs = await import("node:fs/promises");
    await fs.cp(src, dst, { recursive: true });
    logger.info(`Dünya yedeklendi: ${folderName} -> ${dst}`);
    return dst;
  }

  async startLocalServer(config: LocalServer): Promise<void> {
    if (this.localServerProcess) throw new Error("Zaten çalışan bir sunucu var.");
    const serverDir = path.join(config.gameDir, "servers", config.name);
    await mkdir(serverDir, { recursive: true });

    const props = [
      `server-port=${config.port}`, `max-players=${config.maxPlayers}`,
      `gamemode=${config.gamemode}`, `difficulty=${config.difficulty}`,
      `motd=${config.motd}`, `online-mode=false`, `level-name=world`,
      `spawn-protection=0`, `view-distance=10`, `pvp=true`, `allow-flight=true`,
    ];
    await writeFile(path.join(serverDir, "server.properties"), props.join("\n"));
    await writeFile(path.join(serverDir, "eula.txt"), "eula=true\n");

    logger.info(`Yerel sunucu başlatılıyor: ${config.name}`);
    this.localServerProcess = spawn(config.javaPath, [
      `-Xms${config.ramMb}M`, `-Xmx${config.ramMb}M`,
      "-Djava.net.preferIPv4Stack=true", "-jar", "server.jar", "nogui",
    ], { cwd: serverDir, windowsHide: false });

    this.serverLogs = [];
    this.localServerProcess.stdout?.on("data", (chunk: Buffer) => {
      const line = chunk.toString("utf8").trim();
      if (line) { this.serverLogs.push(line); if (this.serverLogs.length > 500) this.serverLogs.shift(); }
    });
    this.localServerProcess.stderr?.on("data", (chunk: Buffer) => {
      const line = chunk.toString("utf8").trim();
      if (line) { this.serverLogs.push(line); if (this.serverLogs.length > 500) this.serverLogs.shift(); }
    });
    this.localServerProcess.on("exit", (code) => {
      this.localServerProcess = null;
      this.serverLogs.push(`Sunucu durduruldu (kod: ${code})`);
    });
  }

  async stopLocalServer(): Promise<void> {
    if (this.localServerProcess) { this.localServerProcess.kill(); this.localServerProcess = null; }
  }

  getLocalServerStatus(): { running: boolean; logs: string[] } {
    return { running: this.localServerProcess !== null, logs: [...this.serverLogs] };
  }
}
