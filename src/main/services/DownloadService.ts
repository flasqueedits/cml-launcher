import { createReadStream, createWriteStream, statSync } from "node:fs";
import { mkdir, rename, unlink } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { pipeline } from "node:stream/promises";
import { logger } from "../logger";

export interface DownloadTask {
  url: string;
  destination: string;
  size?: number;
  sha1?: string;
}

const CONCURRENCY = 8;
const MAX_ATTEMPTS = 3;

class RetryError extends Error {
  constructor(
    public readonly url: string,
    attempts: number,
    cause?: unknown,
  ) {
    super(`İndirme başarısız (${attempts} deneme): ${url}`, { cause });
  }
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function sha1Of(file: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha1");
    const stream = createReadStream(file);
    stream.on("data", (d) => hash.update(d));
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", reject);
  });
}

export class DownloadService {
  async getText(url: string, retries = 3): Promise<string> {
    let attempt = 0;
    for (;;) {
      try {
        const res = await fetch(url, {
          headers: { "user-agent": "CML-Launcher/1.0" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.text();
      } catch (e) {
        attempt++;
        if (attempt >= retries) throw new RetryError(url, attempt, e);
        await delay(500 * 2 ** attempt);
      }
    }
  }

  private async downloadOne(task: DownloadTask): Promise<void> {
    await mkdir(path.dirname(task.destination), { recursive: true });
    const tmp = task.destination + ".part";

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const res = await fetch(task.url, {
          headers: { "user-agent": "CML-Launcher/1.0" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        if (!res.body) throw new Error("Yanıt gövdesi boş");

        await pipeline(res.body, createWriteStream(tmp));

        if (task.sha1) {
          const got = await sha1Of(tmp);
          if (got.toLowerCase() !== task.sha1.toLowerCase()) {
            throw new Error(`SHA1 uyuşmazlığı: ${path.basename(task.destination)}`);
          }
        }

        await rename(tmp, task.destination);
        return;
      } catch (e) {
        await unlink(tmp).catch(() => {});
        if (attempt >= MAX_ATTEMPTS) throw new RetryError(task.url, attempt, e);
        logger.warn(`İndirme tekrar deneniyor (${attempt}/${MAX_ATTEMPTS}): ${task.url} -> ${e}`);
        await delay(800 * 2 ** attempt);
      }
    }
  }

  needsDownload(task: DownloadTask): boolean {
    try {
      const s = statSync(task.destination);
      if (task.size !== undefined && s.size !== task.size) return true;
      return false;
    } catch {
      return true;
    }
  }

  async downloadAll(
    tasks: DownloadTask[],
    onProgress?: (fraction: number) => void,
  ): Promise<void> {
    const pending = tasks.filter((t) => this.needsDownload(t));
    if (pending.length === 0) {
      onProgress?.(1);
      return;
    }

    const totalBytes = pending.reduce((acc, t) => acc + (t.size ?? 0), 0);
    let completedBytes = 0;
    let cursor = 0;
    let failed = 0;

    const worker = async () => {
      for (;;) {
        const idx = cursor++;
        if (idx >= pending.length) return;
        const task = pending[idx];
        try {
          await this.downloadOne(task);
          completedBytes += statSync(task.destination).size;
        } catch {
          failed++;
        }
        if (totalBytes > 0) {
          onProgress?.(Math.min(1, completedBytes / totalBytes));
        } else {
          onProgress?.((idx + 1) / pending.length);
        }
      }
    };

    const workers = Array.from(
      { length: Math.min(CONCURRENCY, pending.length) },
      worker,
    );
    await Promise.all(workers);

    if (failed > 0) {
      throw new Error(
        `${failed}/${pending.length} dosya indirilemedi. Bağlantınızı kontrol edin ve tekrar deneyin.`,
      );
    }
  }
}
