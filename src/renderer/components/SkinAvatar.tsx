import React from "react";

interface SkinAvatarProps {
  skinUrl: string | null;
  username: string;
  size?: number;
  model?: "classic" | "slim";
  className?: string;
}

function drawMinecraftSkin(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  size: number,
  _model: "classic" | "slim"
) {
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, size, size);

  // 64x64 skin texture - Minecraft skin UV layout
  // Head: 8x8 at (8,8) → center-top
  const headSize = size * 0.35;
  const headX = (size - headSize) / 2;
  ctx.drawImage(img, 8, 8, 8, 8, headSize * 0, headSize * 0, headSize, headSize);

  // Body: 8x12 at (20,20) → below head
  const bodyW = headSize;
  const bodyH = headSize * 1.5;
  const bodyY = headSize;
  ctx.drawImage(img, 20, 20, 8, 12, (size - bodyW) / 2, bodyY, bodyW, bodyH);

  // Arms: 4x12 at (40,20) and (32,20)
  const armW = headSize * 0.5;
  const armH = bodyH;
  ctx.drawImage(img, 40, 20, 4, 12, (size - bodyW) / 2 - armW, bodyY, armW, armH);
  ctx.drawImage(img, 32, 20, 4, 12, (size + bodyW) / 2, bodyY, armW, armH);

  // Legs: 4x12 at (4,20) and (20,20) overlap, use (0,20) and (16,20) for legs
  const legW = bodyW / 2;
  const legH = bodyH * 0.8;
  const legY = bodyY + bodyH;
  ctx.drawImage(img, 4, 20, 4, 12, (size - bodyW) / 2, legY, legW, legH);
  ctx.drawImage(img, 20, 20, 4, 12, size / 2, legY, legW, legH);
}

export function SkinAvatar({ skinUrl, username, size = 64, model = "classic", className = "" }: SkinAvatarProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    if (!skinUrl || !canvasRef.current) return;
    setLoaded(false);
    setError(false);

    let cancelled = false;

    const tryLoad = (useCors: boolean) => {
      const img = new Image();
      if (useCors) img.crossOrigin = "anonymous";
      img.onload = () => {
        if (cancelled) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        drawMinecraftSkin(ctx, img, size, model);
        setLoaded(true);
      };
      img.onerror = () => {
        if (cancelled) return;
        if (useCors) {
          // CORS ile başarısız, cors olmadan dene (fallback)
          tryLoad(false);
        } else {
          setError(true);
        }
      };
      img.src = skinUrl;
    };

    tryLoad(true);
    return () => { cancelled = true; };
  }, [skinUrl, size, model]);

  // Varsayılan avatar (Steve)
  const fallback = (
    <div
      className={`flex items-center justify-center rounded-xl border border-border bg-gradient-to-b from-accent/20 to-surface/80 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 16 16" width={size * 0.6} height={size * 0.6} fill="currentColor" className="text-text-dim">
        <rect x="4" y="0" width="8" height="8" rx="1" fill="#c87b3a" opacity="0.3" />
        <rect x="2" y="8" width="12" height="6" rx="1" fill="#c87b3a" opacity="0.2" />
        <rect x="0" y="8" width="2" height="5" rx="0.5" fill="#c87b3a" opacity="0.2" />
        <rect x="14" y="8" width="2" height="5" rx="0.5" fill="#c87b3a" opacity="0.2" />
        <rect x="4" y="14" width="3" height="2" rx="0.5" fill="#c87b3a" opacity="0.2" />
        <rect x="9" y="14" width="3" height="2" rx="0.5" fill="#c87b3a" opacity="0.2" />
        <circle cx="6" cy="3" r="1" fill="#1a1a2e" />
        <circle cx="10" cy="3" r="1" fill="#1a1a2e" />
        <rect x="6" y="5" width="4" height="1" rx="0.5" fill="#c87b3a" />
      </svg>
    </div>
  );

  if (!skinUrl || error) return fallback;

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={`rounded-xl border border-border ${className}`}
      style={{ imageRendering: "pixelated", width: size, height: size, opacity: loaded ? 1 : 0.3 }}
    />
  );
}
