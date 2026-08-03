using System.Drawing.Drawing2D;

namespace McLauncher.UI;

public class ModernProgressBar : UserControl
{
    public int CornerRadius { get; set; } = 6;

    private double _fraction;
    public double Fraction
    {
        get => _fraction;
        set
        {
            _fraction = Math.Clamp(value, 0, 1);
            Invalidate();
        }
    }

    public ModernProgressBar()
    {
        SetStyle(ControlStyles.UserPaint | ControlStyles.AllPaintingInWmPaint | ControlStyles.OptimizedDoubleBuffer | ControlStyles.ResizeRedraw, true);
        Height = 12;
        BackColor = Color.Transparent;
    }

    protected override void OnPaint(PaintEventArgs e)
    {
        e.Graphics.SmoothingMode = SmoothingMode.AntiAlias;
        var rect = new RectangleF(0.5f, 0.5f, Width - 1f, Height - 1f);
        using (var track = Theme.RoundedRect(rect, CornerRadius))
        using (var brush = new SolidBrush(Theme.SurfaceAlt))
            e.Graphics.FillPath(brush, track);

        if (_fraction <= 0) return;

        var fillWidth = Math.Max(Height, (float)((Width - 2) * _fraction));
        var fillRect = new RectangleF(1, 1, fillWidth, Height - 2);
        using var fill = Theme.RoundedRect(fillRect, CornerRadius);
        using var grad = new LinearGradientBrush(fillRect, Theme.Accent, Theme.AccentHover, 45f);
        e.Graphics.FillPath(grad, fill);
    }
}