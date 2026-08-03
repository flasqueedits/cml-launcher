using System.Drawing.Drawing2D;

namespace McLauncher.UI;

public class ModernPanel : Panel
{
    public int CornerRadius { get; set; } = 12;
    public Color FillColor { get; set; } = Theme.Surface;
    public Color BorderColor { get; set; } = Theme.BorderSoft;

    public ModernPanel()
    {
        SetStyle(ControlStyles.UserPaint | ControlStyles.AllPaintingInWmPaint | ControlStyles.OptimizedDoubleBuffer | ControlStyles.ResizeRedraw, true);
        BackColor = Color.Transparent;
    }

    protected override void OnPaint(PaintEventArgs e)
    {
        e.Graphics.SmoothingMode = SmoothingMode.AntiAlias;
        var rect = new RectangleF(0.5f, 0.5f, Width - 1f, Height - 1f);
        using var path = Theme.RoundedRect(rect, CornerRadius);

        using (var brush = new SolidBrush(FillColor))
            e.Graphics.FillPath(brush, path);

        using (var pen = new Pen(BorderColor, 1f))
            e.Graphics.DrawPath(pen, path);
    }
}