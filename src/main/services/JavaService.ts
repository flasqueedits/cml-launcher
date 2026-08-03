import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readdirSync, statSync } from "node:fs";
import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import AdmZip from "adm-zip";
import { DownloadService } from "./DownloadService";
import type { ProgressInfo } from "../../shared/types";
import { logger } from "../logger";

interface AdoptiumAsset {
  binary: {
    package: { link: string; size: number; checksum?: string };
  };
}

export class JavaService {
  constructor(
    private readonly dl: DownloadService,
    private readonly runtimesDir: string,
  ) {}

  /**
   * Sistemde yüklü Java'yı arar: registry -> ortam değişkenleri -> bilinen
   * kurulum dizinleri. En yeni sürümü döndürür.
   */
  detectInstalledJava(): string | null {
    const candidates: string[] = [];

    // Windows registry (HKLM + HKCU, JRE + JDK)
    for (const hive of ["HKLM", "HKCU"]) {
      for (const key of [
        "SOFTWARE\\JavaSoft\\Java Runtime Environment",
        "SOFTWARE\\JavaSoft\\JDK",
        "SOFTWARE\\Microsoft\\JDK",
      ]) {
        try {
          const out = execFileSync("reg", ["query", `${hive}\\${key}`, "/s"], {
            encoding: "utf8",
            timeout: 5000,
          });
          for (const line of out.split(/\r?\n/)) {
            const m = line.match(/JavaHome\s+REG_SZ\s+(.+)/i);
            if (m) candidates.push(path.join(m[1].trim(), "bin", "javaw.exe"));
          }
        } catch {
          /* anahtar yok */
        }
      }
    }

    // PATH içindeki java
    try {
      const which = process.env.PATH?.split(";") ?? [];
      for (const dir of which) {
        const java = path.join(dir, "java.exe");
        const javaw = path.join(dir, "javaw.exe");
        if (existsSync(java)) candidates.push(java);
        if (existsSync(javaw)) candidates.push(javaw);
      }
    } catch {
      /* PATH bozuk */
    }

    // Bilinen kurulum dizinleri
    const roots = [
      process.env.JAVA_HOME ? path.join(process.env.JAVA_HOME, "bin", "javaw.exe") : "",
      process.env.ProgramFiles,
      process.env["ProgramFiles(x86)"],
      process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, "Programs") : "",
      path.join(process.env.APPDATA ?? "", ".minecraft", "runtime"),
    ].filter(Boolean) as string[];

    for (const root of roots) {
      if (!existsSync(root)) continue;
      if (root.endsWith("javaw.exe") || root.endsWith("java.exe")) {
        candidates.push(root);
        continue;
      }
      const walk = (dir: string, depth: number) => {
        if (depth > 3) return;
        try {
          for (const entry of readdirSync(dir)) {
            const full = path.join(dir, entry);
            if (entry.endsWith("javaw.exe")) candidates.push(full);
            else if (statSync(full).isDirectory()) walk(full, depth + 1);
          }
        } catch {
          /* erişim yok */
        }
      };
      walk(root, 0);
    }

    const unique = [...new Set(candidates)].filter(existsSync);
    unique.sort((a, b) => this.majorOf(a) - this.majorOf(b));
    return unique[unique.length - 1] ?? null;
  }

  /** "1.8.0_382" -> 8, "17.0.9" -> 17 gibi ana sürümü döndürür. */
  majorOf(javaPath: string): number {
    try {
      const out = spawnSync(javaPath, ["-version"], {
        encoding: "utf8",
        timeout: 10000,
        windowsHide: true,
      });
      const match = (out.stderr || out.stdout).match(/version\s+"([^"]+)"/);
      if (!match) return 0;
      const [major = "", minor = ""] = match[1].split(".").slice(0, 2);
      if (major === "1") return parseInt(minor, 10) || 8;
      return parseInt(major, 10) || 0;
    } catch {
      return 0;
    }
  }

  /** Sürüm başına gereken Java: 1.20.5+ -> 21, 1.18+ -> 17, 1.17 -> 16, eski -> 8 */
  requiredJavaMajor(mcVersion: string, resolvedMajor?: number): number {
    if (resolvedMajor && resolvedMajor > 8) return resolvedMajor;
    const m = mcVersion.match(/^(\d+)\.(\d+)/);
    if (!m) return 17;
    const [, big, small] = m.map(Number);
    if (big >= 1 && small >= 20 && mcVersion.startsWith("1.20")) {
      const patch = Number(mcVersion.split(".")[2] ?? 0);
      return patch >= 5 ? 21 : 17;
    }
    if (small >= 18) return 17;
    if (small === 17) return 16;
    return 8;
  }

  async resolveJava(major: number): Promise<string | null> {
    const installed = this.detectInstalledJava();
    if (installed && this.majorOf(installed) === major) return installed;
    return this.findInRuntimes(major);
  }

  findInRuntimes(major: number): string | null {
    const dir = path.join(this.runtimesDir, `jre-${major}`);
    if (!existsSync(dir)) return null;
    const walk = (d: string, depth: number): string | null => {
      if (depth > 4) return null;
      for (const entry of readdirSync(d)) {
        const full = path.join(d, entry);
        if (entry === "java.exe") return full;
        if (statSync(full).isDirectory()) {
          const found = walk(full, depth + 1);
          if (found) return found;
        }
      }
      return null;
    };
    return walk(dir, 0);
  }

  /** Adoptium (Eclipse Temurin) API üzerinden JRE indirip açar. */
  async installJava(major: number, onProgress?: (p: ProgressInfo) => void): Promise<string> {
    const targetDir = path.join(this.runtimesDir, `jre-${major}`);
    if (existsSync(targetDir)) {
      const existing = this.findInRuntimes(major);
      if (existing) return existing;
    }

    onProgress?.({ message: `Java ${major} indiriliyor (Adoptium)...`, fraction: 0, weight: 1 });
    const url = `https://api.adoptium.net/v3/assets/latest/${major}/hotspot?os=windows&architecture=x64&image_type=jre`;
    const assets = JSON.parse(await this.dl.getText(url)) as AdoptiumAsset[];
    const asset = assets[0];
    if (!asset?.binary?.package?.link) throw new Error("Adoptium API'den indirme bağlantısı alınamadı.");

    const zipPath = path.join(this.runtimesDir, `jre-${major}.zip`);
    await this.dl.downloadAll(
      [{ url: asset.binary.package.link, destination: zipPath, size: asset.binary.package.size }],
      (f) => onProgress?.({ message: `Java ${major} indiriliyor...`, fraction: f * 0.6, weight: 0.6 }),
    );

    onProgress?.({ message: `Java ${major} açılıyor...`, fraction: 0.6, weight: 0.2 });
    await mkdir(targetDir, { recursive: true });
    await rm(targetDir, { recursive: true, force: true });
    await mkdir(targetDir, { recursive: true });
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(targetDir, true);

    await rm(zipPath, { force: true });
    const java = this.findInRuntimes(major);
    if (!java) throw new Error("Java açıldı ama java.exe bulunamadı.");
    logger.info(`Java ${major} kuruldu: ${java}`);
    onProgress?.({ message: "Java hazır.", fraction: 1, weight: 1 });
    return java;
  }
}
