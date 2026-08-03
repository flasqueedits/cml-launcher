import RPC from "discord-rpc";
import { logger } from "../logger";

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

export class DiscordService {
  private client: RPC.Client | null = null;
  private connected = false;
  private activityStartTime: number | null = null;

  async connect(clientId: string): Promise<boolean> {
    try {
      if (this.client) {
        this.client.destroy();
        this.client = null;
      }

      this.client = new RPC.Client({ transport: "ipc" });

      this.client.on("ready", () => {
        this.connected = true;
        logger.info("Discord RPC bağlantısı kuruldu");
      });

      this.client.on("disconnect", () => {
        this.connected = false;
        logger.warn("Discord RPC bağlantısı kesildi");
      });

      await this.client.login({ clientId });
      return true;
    } catch (e) {
      this.connected = false;
      logger.warn(`Discord RPC bağlantı hatası: ${String(e)}`);
      return false;
    }
  }

  async setActivity(opts: {
    versionId: string;
    username: string;
    state?: string;
    details?: string;
  }): Promise<void> {
    if (!this.client || !this.connected) return;

    this.activityStartTime = Date.now();

    try {
      this.client.setActivity({
        details: opts.details ?? `Minecraft ${opts.versionId}`,
        state: opts.state ?? "Sunucuda oynuyor",
        startTimestamp: this.activityStartTime,
        largeImageKey: "minecraft_logo",
        largeImageText: `Minecraft ${opts.versionId}`,
        smallImageKey: "cml_launcher",
        smallImageText: "CML Launcher",
        instance: false,
      });
    } catch (e) {
      logger.warn(`Discord activity ayarlama hatası: ${String(e)}`);
    }
  }

  async clearActivity(): Promise<void> {
    if (!this.client || !this.connected) return;
    try {
      this.client.clearActivity();
      this.activityStartTime = null;
    } catch (e) {
      logger.warn(`Discord activity temizleme hatası: ${String(e)}`);
    }
  }

  async getMembers(_guildId?: string): Promise<DiscordMember[]> {
    if (!this.connected) return [];
    return [];
  }

  isConnected(): boolean {
    return this.connected;
  }

  disconnect(): void {
    if (this.client) {
      try {
        this.client.clearActivity();
        this.client.destroy();
      } catch {
        // ignore
      }
      this.client = null;
      this.connected = false;
    }
  }
}
