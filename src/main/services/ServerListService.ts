import { readFile, writeFile, mkdir } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import type { ServerInfo } from "../../shared/types";
import { DownloadService } from "./DownloadService";

const TIMEOUT_MS = 5000;

export class ServerListService {
  private servers: ServerInfo[] = [];
  private filePath: string;

  constructor(private readonly userDataDir: string) {
    this.filePath = path.join(userDataDir, "servers.json");
  }

  async load(): Promise<ServerInfo[]> {
    try {
      const raw = await readFile(this.filePath, "utf-8");
      this.servers = JSON.parse(raw) as ServerInfo[];
    } catch {
      this.servers = [];
    }
    return this.servers;
  }

  private async save(): Promise<void> {
    await mkdir(this.userDataDir, { recursive: true });
    await writeFile(this.filePath, JSON.stringify(this.servers, null, 2));
  }

  async addServer(server: Omit<ServerInfo, "id">): Promise<ServerInfo> {
    const newServer: ServerInfo = { ...server, id: randomUUID() };
    this.servers.push(newServer);
    await this.save();
    return newServer;
  }

  async removeServer(id: string): Promise<void> {
    this.servers = this.servers.filter((s) => s.id !== id);
    await this.save();
  }

  async pingServer(address: string, port: number): Promise<ServerInfo> {
    const net = await import("node:net");
    return new Promise<ServerInfo>((resolve) => {
      const startTime = Date.now();
      const socket = new net.Socket();

      socket.setTimeout(TIMEOUT_MS);

      socket.on("connect", () => {
        const ping = Date.now() - startTime;
        socket.destroy();
        resolve({
          id: "",
          name: `${address}:${port}`,
          address,
          port,
          ping,
          online: true,
          players: { online: 0, max: 0 },
          description: "Çalışıyor",
        });
      });

      socket.on("timeout", () => {
        socket.destroy();
        resolve({
          id: "",
          name: `${address}:${port}`,
          address,
          port,
          online: false,
          description: "Zaman aşımı",
        });
      });

      socket.on("error", () => {
        socket.destroy();
        resolve({
          id: "",
          name: `${address}:${port}`,
          address,
          port,
          online: false,
          description: "Bağlantı hatası",
        });
      });

      socket.connect(port, address);
    });
  }
}
