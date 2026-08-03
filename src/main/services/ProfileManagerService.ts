import { readFile, writeFile, mkdir } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import type { GameProfile } from "../../shared/types";

export class ProfileManagerService {
  private profiles: GameProfile[] = [];
  private activeId: string = "";
  private filePath: string;
  private activeFilePath: string;

  constructor(private readonly userDataDir: string) {
    this.filePath = path.join(userDataDir, "game-profiles.json");
    this.activeFilePath = path.join(userDataDir, "active-profile.txt");
  }

  async load(): Promise<void> {
    try {
      const raw = await readFile(this.filePath, "utf-8");
      this.profiles = JSON.parse(raw) as GameProfile[];
    } catch {
      this.profiles = [];
    }
    try {
      this.activeId = (await readFile(this.activeFilePath, "utf-8")).trim();
    } catch {
      this.activeId = this.profiles[0]?.id ?? "";
    }
  }

  private async save(): Promise<void> {
    await mkdir(this.userDataDir, { recursive: true });
    await writeFile(this.filePath, JSON.stringify(this.profiles, null, 2));
    await writeFile(this.activeFilePath, this.activeId);
  }

  async list(): Promise<GameProfile[]> {
    await this.load();
    return this.profiles;
  }

  async add(profile: Omit<GameProfile, "id" | "createdAt">): Promise<GameProfile> {
    const newProfile: GameProfile = {
      ...profile,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
    };
    this.profiles.push(newProfile);
    if (this.profiles.length === 1) this.activeId = newProfile.id;
    await this.save();
    return newProfile;
  }

  async remove(id: string): Promise<void> {
    this.profiles = this.profiles.filter((p) => p.id !== id);
    if (this.activeId === id) this.activeId = this.profiles[0]?.id ?? "";
    await this.save();
  }

  async setActive(id: string): Promise<void> {
    this.activeId = id;
    await this.save();
  }

  async getActive(): Promise<GameProfile | null> {
    await this.load();
    return this.profiles.find((p) => p.id === this.activeId) ?? null;
  }
}
