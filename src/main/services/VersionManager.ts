import path from "node:path";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import AdmZip from "adm-zip";
import { DownloadService } from "./DownloadService";
import type {
  MinecraftLibrary,
  MinecraftRelease,
  ProgressInfo,
  ResolvedVersion,
} from "../../shared/types";
import { logger } from "../logger";

const LIBRARIES_BASE = "https://libraries.minecraft.net/";
const RESOURCES_BASE = "https://resources.download.minecraft.net/";

interface Rule {
  action: "allow" | "disallow";
  os?: { name?: string; arch?: string };
  features?: Record<string, boolean>;
}

type ArgNode = string | { rules?: Rule[]; value: string | string[] };

interface VersionLibrary {
  name?: string;
  url?: string;
  downloads?: {
    artifact?: { path?: string; url?: string; sha1?: string; size?: number };
    classifiers?: {
      "natives-windows"?: { path?: string; url?: string; sha1?: string; size?: number };
    };
  };
  natives?: Record<string, string>;
  extract?: { exclude?: string[] };
  rules?: Rule[];
}

interface VersionRoot {
  id?: string;
  mainClass?: string;
  inheritsFrom?: string;
  minecraftArguments?: string;
  javaVersion?: { majorVersion?: number };
  assetIndex?: { id?: string; url?: string; sha1?: string; size?: number };
  downloads?: { client?: { url?: string; sha1?: string; size?: number } };
  libraries?: VersionLibrary[];
  arguments?: { game?: ArgNode[]; jvm?: ArgNode[] };
}

interface IndexEntry {
  hash: string;
  size: number;
}

interface AssetIndex {
  objects?: Record<string, IndexEntry>;
  virtual?: boolean;
}

export class VersionManager {
  constructor(private readonly dl: DownloadService, private readonly mcDir: string) {}

  async listVersions(forceRefresh = false): Promise<MinecraftRelease[]> {
    const cachePath = path.join(this.mcDir, "version_manifest_v2.json");
    if (!forceRefresh) {
      try {
        const cached = await readFile(cachePath, "utf-8");
        const parsed = JSON.parse(cached) as { versions?: MinecraftRelease[] };
        if (parsed.versions) return parsed.versions;
      } catch {
        /* önbellek yok, yeniden indir */
      }
    }
    const text = await this.dl.getText(
      "https://piston-meta.mojang.com/mc/game/version_manifest_v2.json",
    );
    const manifest = JSON.parse(text) as { versions: MinecraftRelease[] };
    await mkdir(path.dirname(cachePath), { recursive: true });
    await writeFile(cachePath, text);
    return manifest.versions;
  }

  async resolve(versionId: string): Promise<ResolvedVersion> {
    const root = await this.loadVersionRoot(versionId);
    let version = this.parseRoot(root, versionId);

    const visited = new Set([versionId]);
    let parentId = root.inheritsFrom;
    while (parentId && !visited.has(parentId)) {
      visited.add(parentId);
      const parent = await this.loadVersionRoot(parentId);
      version = this.merge(this.parseRoot(parent, parentId), version);
      parentId = parent.inheritsFrom;
    }
    return version;
  }

  private async loadVersionRoot(versionId: string): Promise<VersionRoot> {
    const localPath = path.join(this.mcDir, "versions", versionId, `${versionId}.json`);
    try {
      return JSON.parse(await readFile(localPath, "utf-8")) as VersionRoot;
    } catch {
      /* lokal dosya yok */
    }
    const releases = await this.listVersions();
    const release = releases.find((r) => r.id === versionId);
    if (!release) throw new Error(`Sürüm bulunamadı: ${versionId}`);
    const json = await this.dl.getText(release.url);
    await mkdir(path.dirname(localPath), { recursive: true });
    await writeFile(localPath, json);
    return JSON.parse(json) as VersionRoot;
  }

  private parseRoot(root: VersionRoot, id: string): ResolvedVersion {
    const libraries = (root.libraries ?? [])
      .filter((lib) => this.allowed(lib.rules))
      .map((lib) => this.parseLibrary(lib))
      .filter((l): l is MinecraftLibrary => l !== null);

    return {
      id,
      mainClass: root.mainClass ?? "",
      javaMajor: root.javaVersion?.majorVersion ?? 8,
      libraries,
      jvmArgs: this.flattenArgs(root.arguments?.jvm),
      gameArgs: this.flattenArgs(root.arguments?.game),
      minecraftArguments: root.minecraftArguments,
      clientUrl: root.downloads?.client?.url ?? "",
      clientSha1: root.downloads?.client?.sha1,
      clientSize: root.downloads?.client?.size,
      assetIndexId: root.assetIndex?.id ?? id,
      assetIndexUrl: root.assetIndex?.url ?? "",
      assetIndexSha1: root.assetIndex?.sha1,
      assetIndexSize: root.assetIndex?.size,
    };
  }

  private merge(parent: ResolvedVersion, child: ResolvedVersion): ResolvedVersion {
    const libsByName = new Map<string, MinecraftLibrary>();
    parent.libraries.forEach((l) => libsByName.set(l.name, l));
    child.libraries.forEach((l) => libsByName.set(l.name, l));

    const childHasArgs = child.gameArgs.length > 0 || !!child.minecraftArguments;
    return {
      id: child.id,
      mainClass: child.mainClass || parent.mainClass,
      javaMajor: child.javaMajor !== 8 ? child.javaMajor : parent.javaMajor,
      libraries: [...libsByName.values()],
      jvmArgs: [...new Set([...parent.jvmArgs, ...child.jvmArgs])],
      gameArgs: childHasArgs ? child.gameArgs : parent.gameArgs,
      minecraftArguments: childHasArgs ? child.minecraftArguments : parent.minecraftArguments,
      clientUrl: child.clientUrl || parent.clientUrl,
      clientSha1: child.clientSha1 || parent.clientSha1,
      clientSize: child.clientSize ?? parent.clientSize,
      assetIndexId: child.assetIndexId || parent.assetIndexId,
      assetIndexUrl: child.assetIndexUrl || parent.assetIndexUrl,
      assetIndexSha1: child.assetIndexSha1 || parent.assetIndexSha1,
      assetIndexSize: child.assetIndexSize ?? parent.assetIndexSize,
    };
  }

  private flattenArgs(nodes?: ArgNode[]): string[] {
    const out: string[] = [];
    for (const node of nodes ?? []) {
      if (typeof node === "string") {
        out.push(node);
      } else if (this.allowed(node.rules)) {
        const v = node.value;
        if (Array.isArray(v)) out.push(...v);
        else out.push(v);
      }
    }
    return out;
  }

  private allowed(rules?: Rule[]): boolean {
    if (!rules || rules.length === 0) return true;
    let allowed = false;
    for (const rule of rules) {
      const osOk = !rule.os || (rule.os.name !== undefined ? rule.os.name === "windows" : true);
      const archOk =
        !rule.os?.arch || rule.os.arch === (process.arch === "x64" ? "x86_64" : "x86");
      const featureOk = !rule.features;
      if (osOk && archOk && featureOk) allowed = rule.action === "allow";
    }
    return allowed;
  }

  private parseLibrary(lib: VersionLibrary): MinecraftLibrary | null {
    if (!lib.name) return null;
    const artifact = lib.downloads?.artifact;
    const nativesC = lib.downloads?.classifiers?.["natives-windows"];

    let artifactPath = artifact?.path;
    let artifactUrl = artifact?.url;
    if (!artifactPath) {
      artifactPath = this.nameToPath(lib.name);
      artifactUrl = artifactUrl ?? (lib.url ? `${lib.url}${artifactPath}` : LIBRARIES_BASE + artifactPath);
    }

    const result: MinecraftLibrary = {
      name: lib.name,
      artifactPath,
      url: artifactUrl!,
      sha1: artifact?.sha1,
      size: artifact?.size,
      extractToNatives: !!lib.natives?.["windows"] || !!nativesC,
    };

    if (nativesC) {
      const nativesPath = nativesC.path ?? this.nameToPath(lib.name + ":natives-windows");
      result.nativesUrl = nativesC.url ?? LIBRARIES_BASE + nativesPath;
      result.nativesPath = nativesPath;
      result.extractExclude = lib.extract?.exclude;
    } else if (lib.natives?.["windows"]) {
      result.extractExclude = lib.extract?.exclude;
    }
    return result;
  }

  private nameToPath(name: string): string {
    const parts = name.split(":");
    if (parts.length < 3) return name.replace(/\./g, "/") + ".jar";
    const [group, artifact, version] = parts;
    return `${group.replace(/\./g, "/")}/${artifact}/${version}/${artifact}-${version}.jar`;
  }

  async ensureInstalled(versionId: string, onProgress?: (p: ProgressInfo) => void): Promise<void> {
    const version = await this.resolve(versionId);

    const tasks = [
      {
        url: version.clientUrl,
        destination: path.join(this.mcDir, "versions", version.id, `${version.id}.jar`),
        sha1: version.clientSha1,
        size: version.clientSize,
      },
    ];

    version.libraries.forEach((lib) => {
      tasks.push({
        url: lib.url,
        destination: path.join(this.mcDir, "libraries", lib.artifactPath),
        sha1: lib.sha1,
        size: lib.size,
      });
    });

    version.libraries
      .filter((l) => l.extractToNatives && l.nativesPath)
      .forEach((l) => {
        tasks.push({
          url: l.nativesUrl!,
          destination: path.join(this.mcDir, "libraries", l.nativesPath!),
          sha1: undefined,
          size: undefined,
        });
      });

    const assetsIndexPath = path.join(this.mcDir, "assets", "indexes", `${version.assetIndexId}.json`);
    tasks.push({
      url: version.assetIndexUrl,
      destination: assetsIndexPath,
      sha1: version.assetIndexSha1,
      size: version.assetIndexSize,
    });

    await this.dl.downloadAll(tasks, (f) =>
      onProgress?.({ message: "Sürüm dosyaları indiriliyor...", fraction: f * 0.6, weight: 0.6 }),
    );

    await this.extractNatives(version);

    const index = JSON.parse(
      (await readFile(assetsIndexPath, "utf-8").catch(() => "{}")) || "{}",
    ) as AssetIndex;
    const objects = Object.entries(index.objects ?? {});
    const assetTasks = objects.map(([, e]) => ({
      url: `${RESOURCES_BASE}${e.hash.slice(0, 2)}/${e.hash}`,
      destination: path.join(this.mcDir, "assets", "objects", e.hash.slice(0, 2), e.hash),
      size: e.size,
    }));

    await this.dl.downloadAll(assetTasks, (f) =>
      onProgress?.({
        message: "Oyun dosyaları (assets) indiriliyor...",
        fraction: 0.6 + f * 0.4,
        weight: 0.4,
      }),
    );

    if (index.virtual) await this.buildVirtualAssets(version.assetIndexId, index);

    onProgress?.({ message: "Hazır.", fraction: 1, weight: 1 });
  }

  private async extractNatives(version: ResolvedVersion): Promise<void> {
    const nativesDir = path.join(this.mcDir, "versions", version.id, "natives");
    const libsDir = path.join(this.mcDir, "libraries");

    for (const lib of version.libraries.filter((l) => l.extractToNatives)) {
      const zipPath = lib.nativesPath
        ? path.join(libsDir, lib.nativesPath)
        : path.join(libsDir, lib.artifactPath);
      let zip: AdmZip;
      try {
        zip = new AdmZip(zipPath);
      } catch {
        logger.warn(`Native zip açılamadı: ${zipPath}`);
        continue;
      }
      for (const entry of zip.getEntries()) {
        if (entry.isDirectory) continue;
        if (entry.entryName.startsWith("META-INF")) continue;
        if (lib.extractExclude?.some((e) => entry.entryName.startsWith(e))) continue;
        const target = path.join(nativesDir, entry.entryName.replace(/\//g, path.sep));
        zip.extractEntryTo(entry, target, false, true);
      }
    }
  }

  private async buildVirtualAssets(indexId: string, index: AssetIndex): Promise<void> {
    for (const [legacyPath, entry] of Object.entries(index.objects ?? {})) {
      const src = path.join(this.mcDir, "assets", "objects", entry.hash.slice(0, 2), entry.hash);
      const dest = path.join(this.mcDir, "assets", "virtual", indexId, legacyPath);
      try {
        const raw = await readFile(src);
        await mkdir(path.dirname(dest), { recursive: true });
        await writeFile(dest, raw);
      } catch {
        logger.warn(`Sanal asset kopyalanamadı: ${legacyPath}`);
      }
    }
  }
}
