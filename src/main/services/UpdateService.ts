import { logger } from "../logger";

const CURRENT_VERSION = "1.1.0";
const GITHUB_REPO = "flasqueedits/cml-launcher";

export class UpdateService {
  async checkUpdate(): Promise<{ available: boolean; version: string; url: string; changelog: string; releaseDate: string }> {
    try {
      const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
        headers: { "User-Agent": "CML-Launcher" },
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) return { available: false, version: CURRENT_VERSION, url: "", changelog: "", releaseDate: "" };
      const data = await response.json() as { tag_name?: string; html_url?: string; body?: string; published_at?: string };
      const latestVersion = data.tag_name?.replace(/^v/, "") ?? CURRENT_VERSION;
      const available = latestVersion !== CURRENT_VERSION;
      if (available) logger.info(`Yeni güncelleme mevcut: ${latestVersion}`);
      return { available, version: latestVersion, url: data.html_url ?? "", changelog: data.body ?? "", releaseDate: data.published_at ?? "" };
    } catch {
      return { available: false, version: CURRENT_VERSION, url: "", changelog: "", releaseDate: "" };
    }
  }
}
