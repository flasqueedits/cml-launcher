using System.Drawing.Drawing2D;
using System.Runtime.InteropServices;

namespace McLauncher.UI;

public class ModernComboBox : ComboBox
{
    private const int WM_PAINT = 0x000F;
    private bool _hover;
    private bool _dropped;

    public ModernComboBox()
    {
        DrawMode = DrawMode.OwnerDrawFixed;
        DropDownStyle = ComboBoxStyle.DropDownList;
        FlatStyle = FlatStyle.Flat;
        ItemHeight = 26;
        BackColor = Theme.SurfaceAlt;
        ForeColor = Theme.Text;
        Font = Theme.FontUi;
        SetStyle(ControlStyles.OptimizedDoubleBuffer | ControlStyles.UserPaint | ControlStyles.AllPaintingInWmPaint, true);
    }

    protected override void OnMouseEnter(EventArgs e) { _hover = true; Invalidate(); base.OnMouseEnter(e); }
    protected override void OnMouseLeave(EventArgs e) { _hover = false; Invalidate(); base.OnMouseLeave(e); }
    protected override void OnDropDown(EventArgs e) { _dropped = true; Invalidate(); base.OnDropDown(e); }
    protected override void OnDropDownClosed(EventArgs e) { _dropped = false; Invalidate(); base.OnDropDownClosed(e); }

    protected override void OnDrawItem(DrawItemEventArgs e)
    {
        e.Graphics.SmoothingMode = SmoothingMode.AntiAlias;
        e.DrawBackground();
        if (e.Index < 0) return;

        var rect = e.Bounds;
        using (var bg = new SolidBrush((e.State & DrawItemState.Selected) != 0 ? Theme.AccentSoft : Theme.SurfaceAlt))
            e.Graphics.FillRectangle(bg, rect);

        var text = GetItemText(Items[e.Index]);
        TextRenderer.DrawText(e.Graphics, text, Font, rect, Theme.Text, TextFormatFlags.Left | TextFormatFlags.VerticalCenter | TextFormatFlags.EndEllipsis);
        e.DrawFocusRectangle();
    }

    protected override void OnPaint(PaintEventArgs e)
    {
        e.Graphics.SmoothingMode = SmoothingMode.AntiAlias;
        var rect = new RectangleF(0.5f, 0.5f, Width - 1f, Height - 1f);
        using var path = Theme.RoundedRect(rect, 4);
        using var brush = new SolidBrush(Theme.SurfaceAlt);
        e.Graphics.FillPath(brush, path);
        using var pen = new Pen(_dropped || _hover ? Theme.Accent : Theme.BorderSoft, 1f);
        e.Graphics.DrawPath(pen, path);

        if (SelectedItem != null)
        {
            var text = GetItemText(SelectedItem);
            TextRenderer.DrawText(e.Graphics, text, Font,
                new Rectangle(8, 0, Width - 28, Height),
                Enabled ? Theme.Text : Theme.TextDim,
                TextFormatFlags.Left | TextFormatFlags.VerticalCenter | TextFormatFlags.EndEllipsis);
        }

        var arrowX = Width - 14;
        var arrowY = Height / 2;
        using var arrowPen = new Pen(Enabled ? Theme.TextDim : Color.FromArgb(70, 76, 88), 1.6f);
        e.Graphics.DrawLine(arrowPen, arrowX - 4, arrowY - 2, arrowX, arrowY + 2);
        e.Graphics.DrawLine(arrowPen, arrowX, arrowY + 2, arrowX + 4, arrowY - 2);
    }

    private Color Country => _dropped ? Theme.Accent : _hover ? Theme.Accent : Theme.BorderSoft;
}