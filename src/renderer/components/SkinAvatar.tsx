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
  model: "classic" | "slim"
) {
  const s = size;
  ctx.imageSmoothingEnabled = false;

  // Arka plan (şeffaf)
  ctx.clearRect(0, 0, s, s);

  // Kafa (önden) - 8x8 piksel, 0,0 konumundan
  const headScale = s / 16;
  ctx.drawImage(img, 8, 8, 8, 8, s * 0.25, 0, s * 0.5, s * 0.5);

  // Vücut (önden) - 8x12 piksel
  ctx.drawImage(img, 20, 20, 8, 12, s * 0.25, s * 0.5, s * 0.5, s * 0.375);

  // Sol kol (önden) - 4x12 piksel (classic) veya 3x12 (slim)
  const armW = model === "slim" ? 3 : 4;
  const armX = model === "slim" ? 44 : 40;
  ctx.drawImage(img, armX, 20, armW, 12, s * 0.0625, s * 0.5, s * 0.1875, s * 0.375);

  // Sağ kol (önden)
  ctx.drawImage(img, armX + 4, 20, armW, 12, s * 0.75, s * 0.5, s * 0.1875, s * 0.375);

  // Sol bacak (önden) - 4x12 piksel
  ctx.drawImage(img, 4, 20, 4, 12, s * 0.25, s * 0.875, s * 0.25, s * 0.125);

  // Sağ bacak (önden)
  ctx.drawImage(img, 20, 20, 4, 12, s * 0.5, s * 0.875, s * 0.25, s * 0.125);
}

export function SkinAvatar({ skinUrl, username, size = 64, model = "classic", className = "" }: SkinAvatarProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    if (!skinUrl || !canvasRef.current) return;
    setLoaded(false);
    setError(false);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      drawMinecraftSkin(ctx, img, size, model);
      setLoaded(true);
    };
    img.onerror = () => setError(true);
    img.src = skinUrl;
  }, [skinUrl, size, model]);

  if (!skinUrl || error) {
    // Varsayılan avatar (Steve)
    return (
      <div
        className={`flex items-center justify-center rounded-xl border border-border bg-surface/80 ${className}`}
        style={{ width: size, height: size }}
      >
        <svg viewBox="0 0 16 16" width={size * 0.6} height={size * 0.6} fill="currentColor" className="text-text-dim">
          <rect x="4" y="0" width="8" height="8" rx="1" />
          <rect x="2" y="8" width="12" height="6" rx="1" />
          <rect x="0" y="8" width="2" height="5" rx="0.5" />
          <rect x="14" y="8" width="2" height="5" rx="0.5" />
          <rect x="4" y="14" width="3" height="2" rx="0.5" />
          <rect x="9" y="14" width="3" height="2" rx="0.5" />
          <circle cx="6" cy="3" r="1" fill="#1a1a2e" />
          <circle cx="10" cy="3" r="1" fill="#1a1a2e" />
          <rect x="6" y="5" width="4" height="1" rx="0.5" fill="#c87b3a" />
        </svg>
      </div>
    );
  }

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
