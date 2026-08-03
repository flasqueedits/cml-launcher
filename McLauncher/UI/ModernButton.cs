using System.Drawing.Drawing2D;

namespace McLauncher.UI;

public class ModernButton : Button
{
    public int CornerRadius { get; set; } = 8;
    public bool Accent { get; set; }
    public Color BorderColor { get; set; } = Theme.Border;

    private bool _hover;
    private bool _pressed;

    public ModernButton()
    {
        SetStyle(ControlStyles.UserPaint | ControlStyles.AllPaintingInWmPaint | ControlStyles.OptimizedDoubleBuffer | ControlStyles.ResizeRedraw, true);
        FlatStyle = FlatStyle.Flat;
        FlatAppearance.BorderSize = 0;
        BackColor = Color.Transparent;
        ForeColor = Theme.Text;
        Font = Theme.FontBold;
        Cursor = Cursors.Hand;
        Size = new Size(110, 34);
    }

    protected override void OnMouseEnter(EventArgs e) { _hover = true; Invalidate(); base.OnMouseEnter(e); }
    protected override void OnMouseLeave(EventArgs e) { _hover = false; Invalidate(); base.OnMouseLeave(e); }
    protected override void OnMouseDown(MouseEventArgs mevent) { _pressed = true; Invalidate(); base.OnMouseDown(mevent); }
    protected override void OnMouseUp(MouseEventArgs mevent) { _pressed = false; Invalidate(); base.OnMouseUp(mevent); }

    protected override void OnPaint(PaintEventArgs e)
    {
        e.Graphics.SmoothingMode = SmoothingMode.AntiAlias;
        var rect = new RectangleF(0.5f, 0.5f, Width - 1f, Height - 1f);
        using var path = Theme.RoundedRect(rect, CornerRadius);

        using (var brush = new SolidBrush(FillColor))
            e.Graphics.FillPath(brush, path);

        using (var pen = new Pen(BorderColor, 1f))
            e.Graphics.DrawPath(pen, path);

        TextRenderer.DrawText(e.Graphics, Text, Font, ClientRectangle,
            Enabled ? ForeColor : Theme.TextDim,
            TextFormatFlags.HorizontalCenter | TextFormatFlags.VerticalCenter | TextFormatFlags.EndEllipsis);
    }

    private int Radius => Math.Min(CornerRadius, Math.Min(Height, Width) / 2);

    private Color FillColor
    {
        get
        {
            if (!Enabled) return Theme.SurfaceAlt;
            if (Accent)
            {
                if (_pressed) return Theme.AccentPressed;
                if (_hover) return Theme.AccentHover;
                return Theme.Accent;
            }
            if (_pressed) return Theme.SurfaceAlt;
            if (_hover) return Color.FromArgb(40, 46, 58);
            return Theme.Surface;
        }
    }
}