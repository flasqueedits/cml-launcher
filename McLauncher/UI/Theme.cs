using System.Drawing.Drawing2D;

namespace McLauncher.UI;

public static class Theme
{
    public static readonly Color BackgroundTop = Color.FromArgb(19, 24, 34);
    public static readonly Color Background = Color.FromArgb(13, 16, 23);
    public static readonly Color Surface = Color.FromArgb(22, 28, 38);
    public static readonly Color SurfaceAlt = Color.FromArgb(26, 33, 44);
    public static readonly Color Border = Color.FromArgb(45, 55, 68);
    public static readonly Color BorderSoft = Color.FromArgb(35, 43, 54);
    public static readonly Color Text = Color.FromArgb(232, 238, 246);
    public static readonly Color TextDim = Color.FromArgb(146, 156, 168);
    public static readonly Color Accent = Color.FromArgb(76, 175, 140);
    public static readonly Color AccentHover = Color.FromArgb(96, 205, 168);
    public static readonly Color AccentPressed = Color.FromArgb(60, 150, 120);
    public static readonly Color AccentSoft = Color.FromArgb(76, 175, 140, 40);
    public static readonly Color Danger = Color.FromArgb(230, 92, 92);
    public static readonly Color HeaderGlow = Color.FromArgb(40, 76, 175, 140);

    public static readonly Font FontUi = new("Segoe UI", 9.5f);
    public static readonly Font FontBold = new("Segoe UI Semibold", 9.5f);
    public static readonly Font FontTitle = new("Segoe UI", 20f, FontStyle.Bold);
    public static readonly Font FontSmall = new("Segoe UI", 8.5f);
    public static readonly Font FontMono = new("Consolas", 9f);

    public static GraphicsPath RoundedRect(RectangleF bounds, float radius)
    {
        var path = new GraphicsPath();
        float d = Math.Min(radius * 2, Math.Min(bounds.Width, bounds.Height));
        path.AddArc(bounds.X, bounds.Y, d, d, 180, 90);
        path.AddArc(bounds.Right - d, bounds.Y, d, d, 270, 90);
        path.AddArc(bounds.Right - d, bounds.Bottom - d, d, d, 0, 90);
        path.AddArc(bounds.X, bounds.Bottom - d, d, d, 90, 90);
        path.CloseFigure();
        return path;
    }
}
