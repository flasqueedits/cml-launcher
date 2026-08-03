declare module "discord-rpc" {
  interface ClientOptions {
    transport: "ipc" | "websocket";
  }

  interface Activity {
    details?: string;
    state?: string;
    startTimestamp?: number | Date;
    endTimestamp?: number | Date;
    largeImageKey?: string;
    largeImageText?: string;
    smallImageKey?: string;
    smallImageText?: string;
    instance?: boolean;
  }

  class Client {
    constructor(options: ClientOptions);
    on(event: "ready", callback: () => void): void;
    on(event: "disconnect", callback: () => void): void;
    login(options: { clientId: string }): Promise<void>;
    setActivity(activity: Activity): Promise<void>;
    clearActivity(applicationId?: string): Promise<void>;
    destroy(): void;
  }
}
