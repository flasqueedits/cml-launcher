import { spawn } from "node:child_process";
import path from "node:path";
import crypto from "node:crypto";
import type {
  LaunchOptions,
  LogLevel,
  ResolvedVersion,
} from "../../shared/types";
import { logger } from "../logger";

/**
 * Connection timed out: getsockopt gibi Java soket/ağ hatalarını önlemek için
 * her başlatmaya eklenen JVM ağ parametreleri.
 */
export const NETWORK_JVM_ARGS = [
  "-Djava.net.preferIPv4Stack=true",
  "-Djava.net.preferIPv6Addresses=false",
  "-Dsun.net.client.defaultConnectTimeout=30000",
  "-Dsun.net.client.defaultReadTimeout=60000",
  "-Dhttp.connectTimeout=30000",
  "-Dhttp.readTimeout=60000",
  "-Dhttps.connectTimeout=30000",
  "-Dhttps.readTimeout=60000",
  "-Djava.net.useSystemProxies=false",
  "-Dfile.encoding=UTF-8",
  "-Dstdout.encoding=UTF-8",
  "-Dstderr.encoding=UTF-8",
  "-Djna.nosys=true",
  "-Dlog4j2.formatMsgNoLookups=true",
];

function offlineUuid(username: string): string {
  const hash = crypto.createHash("md5").update(`OfflinePlayer:${username}`).digest();
  hash[6] = (hash[6] & 0x0f) | 0x30;
  hash[8] = (hash[8] & 0x3f) | 0x80;
  const hex = hash.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function uuidFor(profile: { username: string; uuid?: string }): string {
  return profile.uuid || offlineUuid(profile.username);
}

export class LaunchManager {
  private current: ReturnType<typeof spawn> | null = null;

  get isRunning(): boolean {
    return this.current !== null;
  }

  kill(): void {
    if (this.current) {
      try {
        this.current.kill();
      } catch {
        /* süreç zaten bitti */
      }
    }
  }

  /**
   * JVM ve oyun argümanlarını üretir, javaw.exe'yi spawn eder, çıktıyı loglar.
   * Oyun çıkınca çıkış kodunu döndürür.
   */
  async launch(
    options: LaunchOptions,
    version: ResolvedVersion,
    onLog: (line: string, level: LogLevel) => void,
    onExit: (code: number) => void,
  ): Promise<number> {
    const mcDir = options.gameDir;
    const nativesDir = path.join(mcDir, "versions", version.id, "natives");
    const classpath = this.buildClasspath(mcDir, version);

    const jvmArgs = this.buildJvmArgs(options, version, classpath, nativesDir);
    const gameArgs = this.buildGameArgs(options, version, mcDir);

    logger.info(
      `Başlatılıyor: ${version.id} | java=${options.javaPath} | ram=${options.ramMb}MB`,
    );

    const child = spawn(options.javaPath, [...jvmArgs, version.mainClass, ...gameArgs], {
      cwd: mcDir,
      windowsHide: false,
      env: {
        ...process.env,
        JAVA_HOME: path.dirname(path.dirname(options.javaPath)),
        PATH: `${path.dirname(options.javaPath)};${process.env.PATH ?? ""}`,
      },
    });
    this.current = child;

    return await new Promise<number>((resolve, reject) => {
      let resolved = false;

      child.stdout?.on("data", (chunk: Buffer) => {
        this.emitLines(chunk, (line) => {
          onLog(line, "game");
          logger.gameLine(line);
        });
      });
      child.stderr?.on("data", (chunk: Buffer) => {
        this.emitLines(chunk, (line) => {
          onLog(line, "error");
          logger.gameLine(line);
        });
      });

      child.on("error", (err) => {
        if (resolved) return;
        resolved = true;
        this.current = null;
        reject(
          new Error(
            `Java başlatılamadı: ${options.javaPath}. Yol geçerli mi kontrol edin. (${err.message})`,
          ),
        );
      });

      child.on("exit", (code, signal) => {
        if (resolved) return;
        resolved = true;
        this.current = null;
        onExit(code ?? -1);
        logger.info(`Oyun çıkış kodu: ${code} (sinyal: ${signal ?? "yok"})`);
        resolve(code ?? -1);
      });
    });
  }

  private emitLines(chunk: Buffer, cb: (line: string) => void) {
    const text = chunk.toString("utf8");
    for (const line of text.split(/\r?\n/)) {
      if (line.trim().length > 0) cb(line);
    }
  }

  private buildClasspath(mcDir: string, version: ResolvedVersion): string {
    const entries = version.libraries
      .filter((l) => !(l.extractToNatives && !l.nativesPath)) // native jar'larını classpath'e alma
      .map((l) => path.join(mcDir, "libraries", l.artifactPath));
    entries.push(path.join(mcDir, "versions", version.id, `${version.id}.jar`));
    return entries.join(path.delimiter);
  }

  private buildJvmArgs(
    options: LaunchOptions,
    version: ResolvedVersion,
    classpath: string,
    nativesDir: string,
  ): string[] {
    const args = [
      `-Xms${options.ramMb}M`,
      `-Xmx${options.ramMb}M`,
      ...NETWORK_JVM_ARGS,
      ...(options.jvmArgs ?? []),
      `-Djava.library.path=${nativesDir}`,
    ];
    for (const raw of version.jvmArgs) {
      args.push(this.replacePlaceholders(raw, options, version, nativesDir, classpath));
    }
    args.push("-cp", classpath);
    return args;
  }

  private buildGameArgs(
    options: LaunchOptions,
    version: ResolvedVersion,
    mcDir: string,
  ): string[] {
    let tokens: string[];
    if (version.gameArgs.length > 0) {
      tokens = version.gameArgs.map((a) =>
        this.replacePlaceholders(a, options, version, "", ""),
      );
    } else if (version.minecraftArguments) {
      tokens = this.tokenize(version.minecraftArguments).map((a) =>
        this.replacePlaceholders(a, options, version, "", ""),
      );
    } else {
      tokens = [];
    }

    if (!tokens.includes("--username")) {
      tokens.push(
        "--username", options.username,
        "--version", version.id,
        "--gameDir", mcDir,
        "--assetsDir", path.join(mcDir, "assets"),
        "--assetIndex", version.assetIndexId,
        "--uuid", options.uuid,
        "--accessToken", "0",
        "--userType", "legacy",
        "--versionType", "release",
        "--width", options.width.toString(),
        "--height", options.height.toString(),
      );
    }
    return tokens;
  }

  private replacePlaceholders(
    arg: string,
    options: LaunchOptions,
    version: ResolvedVersion,
    nativesDir: string,
    classpath: string,
  ): string {
    const mcDir = options.gameDir;
    const assets = path.join(mcDir, "assets");
    const map: Record<string, string> = {
      "${auth_player_name}": options.username,
      "${profile_name}": options.username,
      "${version_name}": version.id,
      "${version}": version.id,
      "${game_directory}": mcDir,
      "${base_path}": mcDir,
      "${assets_root}": assets,
      "${game_assets}": assets,
      "${assets_index_name}": version.assetIndexId,
      "${auth_uuid}": options.uuid,
      "${auth_access_token}": "0",
      "${auth_session}": "0",
      "${user_type}": "legacy",
      "${version_type}": "release",
      "${natives_directory}": nativesDir,
      "${launcher_name}": "CML-Launcher",
      "${launcher_version}": "1.0",
      "${classpath}": classpath,
      "${library_directory}": path.join(mcDir, "libraries"),
      "${resolution_width}": options.width.toString(),
      "${resolution_height}": options.height.toString(),
      "${user_properties}": "{}",
      "${clientid}": crypto.randomUUID(),
    };
    return Object.entries(map).reduce(
      (acc, [key, value]) => acc.split(key).join(value),
      arg,
    );
  }

  private tokenize(input: string): string[] {
    const tokens: string[] = [];
    let current = "";
    let inQuote = false;
    for (const c of input) {
      if (c === '"') inQuote = !inQuote;
      else if (/\s/.test(c) && !inQuote) {
        if (current) tokens.push(current);
        current = "";
      } else current += c;
    }
    if (current) tokens.push(current);
    return tokens;
  }
}
