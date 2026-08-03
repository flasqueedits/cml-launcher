import React from "react";
import type { PlayerProfile } from "../../shared/types";

interface Props {
  profile: PlayerProfile | null;
  onLoginMicrosoft: () => void;
  onLoginOffline: () => void;
  onLogout: () => void;
  busy: boolean;
}

export function ProfileCard({ profile, onLoginMicrosoft, onLoginOffline, onLogout, busy }: Props) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-2 pl-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-2 font-semibold text-accent">
        {profile ? profile.username[0]?.toUpperCase() : "?"}
      </div>
      <div className="min-w-0 flex-1">
        {profile ? (
          <>
            <div className="truncate text-sm font-semibold">{profile.username}</div>
            <div className="text-[10px] uppercase tracking-wide text-text-dim">
              {profile.type === "microsoft" ? "Microsoft hesabı" : "Offline (cracked)"}
            </div>
          </>
        ) : (
          <>
            <div className="text-sm font-semibold text-text-dim">Giriş yapılmadı</div>
            <div className="text-[10px] text-text-dim">Microsoft veya offline giriş</div>
          </>
        )}
      </div>
      {profile ? (
        <button
          onClick={onLogout}
          disabled={busy}
          className="no-drag rounded-lg px-3 py-1.5 text-xs font-medium text-text-dim hover:bg-surface-2 hover:text-danger disabled:opacity-50"
        >
          Çıkış
        </button>
      ) : (
        <div className="flex flex-col gap-1">
          <button
            onClick={onLoginMicrosoft}
            disabled={busy}
            className="rounded-lg bg-[#00a4ef] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#23b4f5] disabled:opacity-50"
          >
            Microsoft ile Giriş
          </button>
          <button
            onClick={onLoginOffline}
            disabled={busy}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-text-dim transition-colors hover:bg-surface-2 hover:text-text disabled:opacity-50"
          >
            Offline Giriş
          </button>
        </div>
      )}
    </div>
  );
}