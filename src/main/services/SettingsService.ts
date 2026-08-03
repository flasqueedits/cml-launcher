import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import type { AppSettings } from "../../shared/types";

const DEFAULTS: AppSettings = {
  gameDir: "",
  javaPath: "",
  ramMb: 4096,
  width: 854,
  height: 480,
  clientId: "00000000-0000-0000-0000-000000000000",
  fastPlay: false,
  autoStart: false,
  forceUpdate: false,
  customJvmArgs: "",
};

export class SettingsService {
  constructor(private readonly userDataDir: string) {}

  async load(): Promise<AppSettings> {
    try {
      const raw = await readFile(path.join(this.userDataDir, "settings.json"), "utf-8");
      return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<AppSettings>) };
    } catch {
      return { ...DEFAULTS };
    }
  }

  async save(partial: Partial<AppSettings>): Promise<AppSettings> {
    const current = await this.load();
    const next = { ...current, ...partial };
    await mkdir(this.userDataDir, { recursive: true });
    await writeFile(
      path.join(this.userDataDir, "settings.json"),
      JSON.stringify(next, null, 2),
    );
    return next;
  }
}