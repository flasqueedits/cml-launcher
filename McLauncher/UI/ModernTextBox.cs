using System.Runtime.InteropServices;

namespace McLauncher.UI;

public class ModernTextBox : TextBox
{
    private const int ECM_FIRST = 0x1500;
    private const int EM_SETCUEBANNER = ECM_FIRST + 1;

    public ModernTextBox()
    {
        BorderStyle = BorderStyle.None;
        BackColor = Theme.SurfaceAlt;
        ForeColor = Theme.Text;
        Font = Theme.FontUi;
        Height = 32;
    }

    protected override void OnHandleCreated(EventArgs e)
    {
        base.OnHandleCreated(e);
        RefreshPlaceholder();
    }

    protected override void OnTextChanged(EventArgs e)
    {
        base.OnTextChanged(e);
        RefreshPlaceholder();
    }

    private void RefreshPlaceholder()
    {
        if (IsHandleCreated)
            SendMessage(Handle, EM_SETCUEBANNER, TextLength == 0 ? (IntPtr)1 : IntPtr.Zero, PlaceholderText);
    }

    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    private static extern IntPtr SendMessage(IntPtr hWnd, int msg, IntPtr wParam, string lParam);
}