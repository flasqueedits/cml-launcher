import { BrowserWindow } from "electron";
import crypto from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import type { PlayerProfile } from "../../shared/types";
import { logger } from "../logger";

/**
 * Microsoft OAuth 2.0 akışı:
 *
 * 1. Microsoft token    (login.live.com / oauth2/v2.0, PKCE ile)
 * 2. Xbox Live token    (user.auth.xboxlive.com)
 * 3. XSTS token         (xsts.auth.xboxlive.com)
 * 4. Minecraft token    (api.minecraftservices.com)
 * 5. Minecraft profile  (api.minecraftservices.com/minecraft/profile)
 *
 * Electron'da giriş, authorize URL'ini yükleyen gizli bir BrowserWindow ile
 * yapılır; onBeforeRequest filtresi callback URL'ini yakalar.
 */

const AUTH_FILE = "auth.json";
const DEFAULT_CLIENT_ID = "00000000-0000-0000-0000-000000000000"; // Azure App Registration'dan doldurun

interface MicrosoftTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  uhs: string;
}

interface StoredProfile {
  username: string;
  uuid: string;
  tokens?: MicrosoftTokens;
}

export class AuthService {
  private profile: PlayerProfile | null = null;

  constructor(
    private readonly userDataDir: string,
    private getClientId: () => string,
  ) {}

  async load(): Promise<PlayerProfile | null> {
    if (this.profile) return this.profile;
    try {
      const raw = await readFile(path.join(this.userDataDir, AUTH_FILE), "utf-8");
      const stored = JSON.parse(raw) as StoredProfile;
      if (stored.tokens && Date.now() < stored.tokens.expiresAt) {
        this.profile = {
          username: stored.username,
          uuid: stored.uuid,
          type: "microsoft",
        };
      }
    } catch {
      /* oturum yok */
    }
    return this.profile;
  }

  get current(): PlayerProfile | null {
    return this.profile;
  }

  async loginOffline(username: string): Promise<PlayerProfile> {
    const clean = username.trim().replace(/[^\w]/g, "");
    if (clean.length < 3 || clean.length > 16) {
      throw new Error("Kullanıcı adı 3-16 karakter arası olmalıdır.");
    }
    const uuid = crypto
      .createHash("md5")
      .update(`OfflinePlayer:${clean}`)
      .digest()
      .toString("hex")
      .replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, "$1-$2-$3-$4-$5");
    this.profile = { username: clean, uuid, type: "offline" };
    return this.profile;
  }

  async loginMicrosoft(): Promise<PlayerProfile> {
    const clientId = this.getClientId();
    if (clientId === DEFAULT_CLIENT_ID) {
      throw new Error(
        "Microsoft girişi için önce Azure App Registration oluşturun ve Client ID'yi ayarlara yazın. (Azure portal -> App registrations -> Yeni kayıt -> 'Public client/native' seçin, redirect URI: http://localhost/callback)",
      );
    }

    // 1) PKCE parametreleri
    const verifier = crypto.randomBytes(32).toString("base64url");
    const challenge = crypto
      .createHash("sha256")
      .update(verifier)
      .digest("base64url");

    const redirectUri = "http://localhost/callback";
    const scopes = "XboxLive.signin offline_access";
    const authUrl =
      "https://login.live.com/oauth20_authorize.srf?" +
      new URLSearchParams({
        client_id: clientId,
        response_type: "code",
        redirect_uri: redirectUri,
        scope: scopes,
        code_challenge: challenge,
        code_challenge_method: "S256",
        response_mode: "query",
      });

    // 2) Electron penceresi ile authorize + callback yakalama
    const code = await new Promise<string>((resolve, reject) => {
      const win = new BrowserWindow({
        width: 520,
        height: 640,
        title: "Microsoft ile Giriş",
        autoHideMenuBar: true,
        webPreferences: { nodeIntegration: false, contextIsolation: true },
      });
      const timeout = setTimeout(() => {
        win.destroy();
        reject(new Error("Giriş zaman aşımına uğradı."));
      }, 5 * 60 * 1000);

      win.webContents.session.webRequest.onBeforeRequest({ urls: [`${redirectUri}*`] }, (details, cb) => {
        try {
          const url = new URL(details.url);
          const authCode = url.searchParams.get("code");
          const err = url.searchParams.get("error");
          clearTimeout(timeout);
          win.destroy();
          if (err) {
            reject(new Error(`Giriş iptal edildi: ${err}`));
          } else if (authCode) {
            resolve(authCode);
          } else {
            reject(new Error("Callback'te kod bulunamadı."));
          }
        } finally {
          cb({ cancel: true });
        }
      });

      win.on("closed", () => clearTimeout(timeout));
      win.loadURL(authUrl).catch((e) => {
        clearTimeout(timeout);
        win.destroy();
        reject(e);
      });
    });

    // 3) Microsoft token
    const msRes = await fetch("https://login.live.com/oauth20_token.srf", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
        code_verifier: verifier,
        scope: scopes,
      }),
    });
    if (!msRes.ok) {
      throw new Error(`Microsoft token alınamadı (${msRes.status}).`);
    }
    const ms = (await msRes.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
    };

    // 4) Xbox Live token
    const xbl = await this.postJson(
      "https://user.auth.xboxlive.com/user/authenticate",
      {
        Properties: {
          AuthMethod: "RPS",
          SiteName: "user.auth.xboxlive.com",
          RpsTicket: `d=${ms.access_token}`,
        },
        RelyingParty: "http://auth.xboxlive.com",
        TokenType: "JWT",
      },
      "Xbox Live",
    );

    // 5) XSTS token
    const xsts = await this.postJson(
      "https://xsts.auth.xboxlive.com/xsts/authorize",
      {
        Properties: {
          SandboxId: "RETAIL",
          UserTokens: [xbl.Token],
        },
        RelyingParty: "rp://api.minecraftservices.com/",
        TokenType: "JWT",
      },
      "XSTS",
    );
    const uhs = xsts.DisplayClaims.xui[0].uhs as string;

    // 6) Minecraft token
    const mcToken = await this.postJson(
      "https://api.minecraftservices.com/authentication/login_with_xbox",
      {
        identityToken: `XBL3.0 x=${uhs};${xsts.Token}`,
      },
      "Minecraft",
    );

    // 7) Minecraft profil
    const profileRes = await fetch("https://api.minecraftservices.com/minecraft/profile", {
      headers: { Authorization: `Bearer ${mcToken.access_token}` },
    });
    if (profileRes.status === 404) {
      throw new Error("Bu hesaba bağlı bir Minecraft sahibi yok.");
    }
    const mcProfile = (await profileRes.json()) as {
      name: string;
      id: string;
    };

    const stored: StoredProfile = {
      username: mcProfile.name,
      uuid: mcProfile.id,
      tokens: {
        accessToken: mcToken.access_token,
        refreshToken: ms.refresh_token ?? "",
        expiresAt: Date.now() + mcToken.expires_in * 1000,
        uhs,
      },
    };
    await this.save(stored);

    this.profile = {
      username: stored.username,
      uuid: stored.uuid,
      type: "microsoft",
    };
    logger.info(`Microsoft girişi tamam: ${this.profile.username}`);
    return this.profile;
  }

  async logout(): Promise<void> {
    this.profile = null;
    await writeFile(path.join(this.userDataDir, AUTH_FILE), "{}").catch(() => {});
  }

  private async save(stored: StoredProfile): Promise<void> {
    await mkdir(this.userDataDir, { recursive: true });
    await writeFile(path.join(this.userDataDir, AUTH_FILE), JSON.stringify(stored, null, 2));
  }

  private async postJson(url: string, body: unknown, stage: string) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `${stage} kimlik doğrulaması başarısız (${res.status}). Bu hesap Xbox Live'da değil olabilir. ${text.slice(0, 200)}`,
      );
    }
    return (await res.json()) as any;
  }
}
