import { useCallback, useEffect, useRef, useState } from "react";
import type {
  AppSettings,
  MinecraftRelease,
  PlayerProfile,
  LogLevel,
  DiscordMember,
} from "../shared/types";

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  useEffect(() => {
    window.api.getSettings().then(setSettings);
  }, []);
  const save = useCallback(
    async (partial: Partial<AppSettings>) => {
      const next = await window.api.saveSettings(partial);
      setSettings(next);
      return next;
    },
    [],
  );
  return { settings, save };
}

export function useProfile() {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  useEffect(() => {
    window.api.getProfile().then(setProfile);
  }, []);
  const loginMicrosoft = useCallback(async () => {
    setProfile(await window.api.loginMicrosoft());
  }, []);
  const loginOffline = useCallback(async (username: string) => {
    setProfile(await window.api.loginOffline(username));
  }, []);
  const logout = useCallback(async () => {
    await window.api.logout();
    setProfile(null);
  }, []);
  return { profile, loginMicrosoft, loginOffline, logout };
}

export function useVersions() {
  const [versions, setVersions] = useState<MinecraftRelease[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const list = await window.api.listVersions();
        setVersions(
          list.filter((v) => !v.type.includes("old_")).sort((a, b) => b.releaseTime.localeCompare(a.releaseTime)),
        );
      } catch (e) {
        setError(String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { versions, loading, error };
}

export type GameLog = { id: number; level: LogLevel; text: string };

export function useGameLog() {
  const [logs, setLogs] = useState<GameLog[]>([]);
  const idRef = useRef(0);

  const clear = useCallback(() => setLogs([]), []);

  const push = useCallback((line: string, level: LogLevel) => {
    setLogs((prev) => {
      const next = [...prev, { id: ++idRef.current, level, text: line }];
      return next.length > 400 ? next.slice(next.length - 400) : next;
    });
  }, []);

  return { logs, clear, push };
}

export function useJava() {
  const [javaPath, setJavaPath] = useState<string>("");
  useEffect(() => {
    window.api.detectJava().then((p) => setJavaPath(p ?? ""));
  }, []);
  return { javaPath, setJavaPath };
}

export function useDiscord() {
  const [connected, setConnected] = useState(false);
  const [members, setMembers] = useState<DiscordMember[]>([]);

  const connect = useCallback(async () => {
    const ok = await window.api.discordConnect();
    setConnected(ok);
    return ok;
  }, []);

  const refreshMembers = useCallback(async () => {
    const m = await window.api.discordGetMembers();
    setMembers(m);
  }, []);

  useEffect(() => {
    window.api.discordIsConnected().then(setConnected);
  }, []);

  return { connected, members, connect, refreshMembers };
}
