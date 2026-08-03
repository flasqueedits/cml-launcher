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
  private currentClientId: string = "";
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  async connect(clientId: string): Promise<boolean> {
    if (!clientId || clientId === "00000000-0000-0000-0000-000000000000") {
      logger.warn("Discord RPC: Geçersiz clientId, bağlantı atlandı");
      return false;
    }

    try {
      if (this.client) {
        this.client.destroy();
        this.client = null;
      }

      this.currentClientId = clientId;
      this.client = new RPC.Client({ transport: "ipc" });

      this.client.on("ready", () => {
        this.connected = true;
        this.reconnectAttempts = 0;
        logger.info("Discord RPC bağlantısı kuruldu");
      });

      this.client.on("disconnect", () => {
        this.connected = false;
        logger.warn("Discord RPC bağlantısı kesildi, yeniden bağlanmaya çalışılıyor...");
        this.scheduleReconnect();
      });

      await this.client.login({ clientId });
      return true;
    } catch (e) {
      this.connected = false;
      const msg = String(e);
      if (msg.includes("ECONNREFUSED") || msg.includes("ENOENT") || msg.includes("not found")) {
        logger.warn("Discord RPC: Discord masaüstü uygulaması çalışmıyor veya RPC Kanalı bulunamadı");
      } else {
        logger.warn(`Discord RPC bağlantı hatası: ${msg}`);
      }
      this.scheduleReconnect();
      return false;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.warn("Discord RPC: Maksimum yeniden bağlantı denemesi aşıldı");
      return;
    }
    const delay = Math.min(5000 * Math.pow(2, this.reconnectAttempts), 60000);
    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => {
      if (!this.connected && this.currentClientId) {
        logger.info(`Discord RPC: Yeniden bağlanılıyor (deneme ${this.reconnectAttempts})...`);
        this.connect(this.currentClientId);
      }
    }, delay);
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
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.maxReconnectAttempts = 0;
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
