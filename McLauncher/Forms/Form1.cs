using System.Diagnostics;
using System.Drawing.Drawing2D;
using System.Runtime.InteropServices;
using McLauncher.Models;
using McLauncher.Services;
using McLauncher.UI;

namespace McLauncher.Forms;

public sealed class Form1 : Form
{
    private readonly DownloadService _dl = new();
    private readonly MojangApiService _api;
    private readonly MinecraftService _minecraft;
    private readonly ModLoaderService _loaders;
    private readonly CancellationTokenSource _cts = new();

    private ModernPanel _titleBar = null!;
    private Label _lblTitle = null!;
    private ModernButton _btnMinimize = null!;
    private ModernButton _btnClose = null!;

    private ModernTextBox _txtUsername = null!;
    private ModernComboBox _cmbVersion = null!;
    private ModernComboBox _cmbLoader = null!;
    private ModernComboBox _cmbLoaderVersion = null!;
    private ModernTextBox _txtJava = null!;
    private ModernComboBox _cmbRam = null!;
    private ModernButton _btnPlay = null!;
    private ModernProgressBar _progress = null!;
    private Label _lblProgress = null!;
    private Label _lblStatus = null!;
    private TextBox _log = null!;

    private string _minecraftDir = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), ".minecraft");

    private bool _busy;
    private bool _launched;

    public Form1()
    {
        _api = new MojangApiService(_dl);
        _minecraft = new MinecraftService(_dl, _api);
        _loaders = new ModLoaderService(_dl);

        BuildUi();
        Shown += async (_, _) => await OnShownAsync();
        FormClosing += (_, _) => _cts.Cancel();
    }

    private void BuildUi()
    {
        Text = "McLauncher";
        BackColor = Theme.Background;
        ClientSize = new Size(1060, 640);
        MinimumSize = new Size(900, 560);
        StartPosition = FormStartPosition.CenterScreen;
        Font = Theme.FontUi;
        AutoScaleMode = AutoScaleMode.Dpi;
        DoubleBuffered = true;

        // ---------------- Başlık çubuğu ----------------
        _titleBar = new ModernPanel
        {
            Dock = DockStyle.Top,
            Height = 48,
            CornerRadius = 0,
            FillColor = Theme.Surface,
            BorderColor = Theme.BorderSoft,
        };

        _lblTitle = new Label
        {
            Text = "  CML — McLauncher",
            Font = Theme.FontBold,
            ForeColor = Theme.Text,
            AutoSize = true,
            Location = new Point(18, 13),
        };

        _btnMinimize = new ModernButton
        {
            Text = "—",
            Size = new Size(40, 28),
            Location = new Point(Width - 92, 10),
            Anchor = AnchorStyles.Top | AnchorStyles.Right,
            CornerRadius = 6,
        };
        _btnMinimize.Click += (_, _) => WindowState = FormWindowState.Minimized;

        _btnClose = new ModernButton
        {
            Text = "✕",
            Size = new Size(40, 28),
            Location = new Point(Width - 46, 10),
            Anchor = AnchorStyles.Top | AnchorStyles.Right,
            CornerRadius = 6,
        };
        _btnClose.Click += (_, _) => Close();

        foreach (var c in new Control[] { _lblTitle, _btnMinimize, _btnClose })
            c.MouseDown += TitleBar_MouseDown;

        _titleBar.Controls.AddRange(new Control[] { _lblTitle, _btnMinimize, _btnClose });

        // ---------------- İçerik ----------------
        var content = new Panel
        {
            Dock = DockStyle.Fill,
            BackColor = Theme.Background,
            Padding = new Padding(28),
        };

        var layout = new TableLayoutPanel
        {
            Dock = DockStyle.Fill,
            ColumnCount = 1,
            RowCount = 8,
            BackColor = Color.Transparent,
        };
        layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 54));
        layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 76));
        layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 104));
        layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 76));
        layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 66));
        layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 46));
        layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 30));
        layout.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
        layout.Margin = new Padding(0);

        content.Controls.Add(layout);
        Controls.Add(content);
        Controls.Add(_titleBar);

        // ---- Satır 0: hoş geldin ----
        var welcome = new Label
        {
            Text = "Cracked / Offline Mod Başlatıcı — giriş yapmadan oyna",
            Font = Theme.FontTitle,
            ForeColor = Theme.Text,
            Dock = DockStyle.Fill,
            TextAlign = ContentAlignment.MiddleLeft,
        };
        layout.Controls.Add(welcome, 0, 0);

        // ---- Satır 1: kullanıcı adı ----
        _txtUsername = new ModernTextBox
        {
            PlaceholderText = "Kullanıcı adı (örn: Steve)",
            Dock = DockStyle.Fill,
        };
        layout.Controls.Add(WithHint(_txtUsername, "Sunucular bu adla kaydeder — herhangi bir isim kullanabilirsin."), 0, 1);

        // ---- Satır 2: sürüm + mod yükleyici ----
        var row = new TableLayoutPanel
        {
            Dock = DockStyle.Fill,
            ColumnCount = 3,
            RowCount = 1,
            BackColor = Color.Transparent,
        };
        row.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 36f));
        row.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 24f));
        row.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 40f));

        _cmbVersion = new ModernComboBox();
        _cmbLoader = new ModernComboBox { Enabled = false };
        _cmbLoaderVersion = new ModernComboBox { Enabled = false };

        row.Controls.Add(WithLabel("Minecraft Sürümü", _cmbVersion), 0, 0);
        row.Controls.Add(WithLabel("Mod Yükleyici", _cmbLoader), 1, 0);
        row.Controls.Add(WithLabel("Yükleyici Sürümü", _cmbLoaderVersion), 2, 0);
        layout.Controls.Add(row, 0, 2);

        // ---- Satır 3: Java + RAM ----
        var row2 = new TableLayoutPanel
        {
            Dock = DockStyle.Fill,
            ColumnCount = 4,
            RowCount = 1,
            BackColor = Color.Transparent,
        };
        row2.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 52f));
        row2.ColumnStyles.Add(new ColumnStyle(SizeType.Absolute, 110));
        row2.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 24f));
        row2.ColumnStyles.Add(new ColumnStyle(SizeType.Absolute, 130));

        var javaBox = new ModernTextBox { PlaceholderText = "javaw.exe yolu (örn: C:\\Program Files\\Java\\jdk-17\\bin\\javaw.exe)" };
        _txtJava = javaBox;

        var btnBrowse = new ModernButton { Text = "Gözat", Dock = DockStyle.Fill };
        btnBrowse.Click += (_, _) => BrowseJava();

        var lblRam = new Label
        {
            Text = "RAM (MB)",
            Dock = DockStyle.Fill,
            TextAlign = ContentAlignment.MiddleLeft,
            ForeColor = Theme.TextDim,
        };
        _cmbRam = new ModernComboBox
        {
            Items = { 1024, 2048, 3072, 4096, 5120, 6144, 8192, 12288, 16384 },
            SelectedIndex = 3,
        };

        row2.Controls.Add(javaBox, 0, 0);
        row2.Controls.Add(btnBrowse, 1, 0);
        row2.Controls.Add(lblRam, 2, 0);
        row2.Controls.Add(_cmbRam, 3, 0);
        layout.Controls.Add(row2, 0, 3);

        // ---- Satır 4: başlat butonu ----
        _btnPlay = new ModernButton
        {
            Text = "OYUNU BAŞLAT",
            Font = new Font("Segoe UI Semibold", 12f),
            Accent = true,
            Dock = DockStyle.Fill,
            CornerRadius = 10,
        };
        _btnPlay.Click += async (_, _) => await PlayAsync();
        layout.Controls.Add(_btnPlay, 0, 4);

        // ---- Satır 5: progress ----
        _progress = new ModernProgressBar { Dock = DockStyle.Fill };
        layout.Controls.Add(_progress, 0, 5);

        // ---- Satır 6: durum ----
        _lblStatus = new Label
        {
            Dock = DockStyle.Fill,
            ForeColor = Theme.TextDim,
            Font = Theme.FontSmall,
            TextAlign = ContentAlignment.MiddleLeft,
        };
        _lblProgress = new Label
        {
            AutoSize = true,
            ForeColor = Theme.Accent,
            Font = Theme.FontBold,
            TextAlign = ContentAlignment.MiddleRight,
            Text = "0%",
            Anchor = AnchorStyles.Right,
        };
        layout.Controls.Add(WithProgressPair(), 0, 6);

        // ---- Satır 7: log ----
        _log = new TextBox
        {
            Multiline = true,
            ReadOnly = true,
            ScrollBars = ScrollBars.Vertical,
            BackColor = Color.FromArgb(9, 11, 16),
            ForeColor = Color.FromArgb(170, 180, 192),
            Font = Theme.FontMono,
            BorderStyle = BorderStyle.None,
            Dock = DockStyle.Fill,
        };
        layout.Controls.Add(_log, 0, 7);

        _cmbLoader.Items.AddRange(new object[] { ModLoaderService.Vanilla, ModLoaderService.Fabric, ModLoaderService.Quilt, ModLoaderService.Forge });
        _cmbLoader.SelectedIndex = 0;
        _cmbVersion.SelectedIndexChanged += async (_, _) => await LoadLoaderVersionsAsync();
        _cmbLoader.SelectedIndexChanged += async (_, _) => await LoadLoaderVersionsAsync();

        Paint += (_, e) => DrawBackgroundGlow(e.Graphics);
    }

    private Control WithLabel(string text, Control control)
    {
        var panel = new Panel { Dock = DockStyle.Fill, BackColor = Color.Transparent, Padding = new Padding(0, 0, 8, 0) };
        var lbl = new Label
        {
            Text = text,
            Dock = DockStyle.Top,
            Height = 20,
            ForeColor = Theme.TextDim,
            Font = Theme.FontSmall,
        };
        control.Dock = DockStyle.Fill;
        panel.Controls.Add(control);
        panel.Controls.Add(lbl);
        return panel;
    }

    private Control WithHint(Control control, string hint)
    {
        var panel = new Panel { Dock = DockStyle.Fill, BackColor = Color.Transparent, Padding = new Padding(0, 0, 8, 0) };
        var lbl = new Label
        {
            Text = hint,
            Dock = DockStyle.Top,
            Height = 22,
            ForeColor = Theme.TextDim,
            Font = Theme.FontSmall,
        };
        control.Dock = DockStyle.Top;
        control.Height = 34;
        panel.Controls.Add(lbl);
        panel.Controls.Add(control);
        panel.Controls.SetChildIndex(control, 0);
        return panel;
    }

    private Control WithProgressPair()
    {
        var panel = new Panel { Dock = DockStyle.Fill, BackColor = Color.Transparent };
        _lblStatus.Dock = DockStyle.Fill;
        _lblProgress.Dock = DockStyle.Right;
        panel.Controls.Add(_lblProgress);
        panel.Controls.Add(_lblStatus);
        return panel;
    }

    private void DrawBackgroundGlow(Graphics g)
    {
        g.SmoothingMode = SmoothingMode.AntiAlias;
        var glow1 = new GraphicsPath();
        var grad = new LinearGradientBrush(ClientRectangle, Theme.BackgroundTop, Theme.Background, 90f);
        g.FillRectangle(grad, ClientRectangle);
        grad.Dispose();

        using var radial = new SolidBrush(Theme.HeaderGlow);
        var radius = 340;
        g.FillEllipse(radial, Width - radius, -radius / 2, radius, radius);
        using var radial2 = new SolidBrush(Color.FromArgb(24, 76, 175, 140));
        g.FillEllipse(radial2, -140, Height - 220, 380, 380);
    }

    protected override void OnResize(EventArgs e)
    {
        base.OnResize(e);
        if (_btnMinimize != null)
        {
            _btnMinimize.Location = new Point(Width - 92, 10);
            _btnClose.Location = new Point(Width - 46, 10);
        }
    }

    private void TitleBar_MouseDown(object? sender, MouseEventArgs e)
    {
        if (e.Button != MouseButtons.Left) return;
        ReleaseCapture();
        SendMessage(Handle, WM_NCLBUTTONDOWN, HT_CAPTION, IntPtr.Zero);
    }

    private void BrowseJava()
    {
        using var dlg = new OpenFileDialog
        {
            Filter = "Java|javaw.exe;java.exe|Tüm dosyalar|*.*",
            Title = "javaw.exe seç",
        };
        if (dlg.ShowDialog(this) == DialogResult.OK)
            _txtJava.Text = dlg.FileName;
    }

    private async Task OnShownAsync()
    {
        Log($"[CML] Başlatıcı hazır. Oyun klasörü: {_minecraftDir}");
        try
        {
            var releases = await _api.GetReleasesAsync(false, _cts.Token);
            var ordered = releases
                .OrderByDescending(r => r.ReleaseTime)
                .ToList();

            foreach (var r in ordered)
            {
                if (r.Type is "release" or "snapshot" or "old_beta" or "old_alpha")
                    _cmbVersion.Items.Add(r.Id);
            }

            var latestRelease = ordered.FirstOrDefault(r => r.Type == "release");
            if (latestRelease != null)
                _cmbVersion.SelectedItem = latestRelease.Id;

            _cmbLoader.Enabled = true;
            Log($"[CML] {_cmbVersion.Items.Count} sürüm listelendi.");
            _lblStatus.Text = "Sürümler yüklendi — oynamaya hazır.";
        }
        catch (Exception ex)
        {
            _lblStatus.Text = "Sürüm listesi alınamadı — internet bağlantısını kontrol et.";
            Log($"[HATA] Manifest yüklenemedi: {ex.Message}");
        }

        var java = JavaService.FindJava();
        if (java != null)
        {
            _txtJava.Text = java;
            Log($"[CML] Java otomatik bulundu: {java}");
        }
        else
        {
            Log("[CML] Java bulunamadı — javaw.exe yolunu elle seç.");
        }
    }

    private async Task LoadLoaderVersionsAsync()
    {
        var loader = _cmbLoader.SelectedItem as string ?? ModLoaderService.Vanilla;
        var mc = _cmbVersion.SelectedItem as string;
        _cmbLoaderVersion.Items.Clear();
        _cmbLoaderVersion.Enabled = false;

        if (loader == ModLoaderService.Vanilla || string.IsNullOrEmpty(mc))
            return;

        try
        {
            var versions = await _loaders.GetLoaderVersionsAsync(loader, mc, _cts.Token);
            if (versions.Count == 0)
            {
                _lblStatus.Text = $"{loader}: bu sürüm için yükleyici bulunamadı.";
                return;
            }
            string Format(LoaderVersion v) => v.Version + (v.Recommended ? "  (önerilen)" : "");
            _cmbLoaderVersion.Items.AddRange(versions.Select(Format).ToArray());
            _cmbLoaderVersion.SelectedIndex = 0;
            _cmbLoaderVersion.Enabled = true;
            _lblStatus.Text = $"{loader} sürümleri yüklendi.";
        }
        catch (Exception ex)
        {
            _lblStatus.Text = $"{loader} sürümleri alınamadı: {ex.Message}";
        }
    }

    private async Task PlayAsync()
    {
        if (_busy) return;
        if (_launched) return;

        var username = _txtUsername.Text.Trim();
        if (username.Length is 0 or > 16)
        {
            _lblStatus.Text = "Geçerli bir kullanıcı adı gir (1-16 karakter).";
            return;
        }

        var mc = _cmbVersion.SelectedItem as string;
        var loader = _cmbLoader.SelectedItem as string ?? ModLoaderService.Vanilla;
        var loaderVersion = (_cmbLoaderVersion.SelectedItem as string)?.Split(' ')[0];
        if (string.IsNullOrEmpty(mc))
        {
            _lblStatus.Text = "Önce bir Minecraft sürümü seç.";
            return;
        }
        if (loader != ModLoaderService.Vanilla && string.IsNullOrEmpty(loaderVersion))
        {
            _lblStatus.Text = "Önce bir yükleyici sürümü seç.";
            return;
        }

        var javaPath = _txtJava.Text.Trim();
        if (!File.Exists(javaPath))
        {
            _lblStatus.Text = "javaw.exe bulunamadı — Gözat ile seç.";
            return;
        }

        var ram = (int)(_cmbRam.SelectedItem ?? 4096);
        var versionId = ModLoaderService.BuildVersionId(loader, mc, loaderVersion ?? "");

        SetBusy(true);
        _log.Clear();
        try
        {
            var options = new LaunchOptions
            {
                Username = username,
                VersionId = versionId,
                JavaPath = javaPath,
                MinecraftDir = _minecraftDir,
                RamMb = ram,
            };

            var javaMajor = JavaService.GetJavaMajor(javaPath);
            if (javaMajor < 17)
                Log($"[UYARI] Java {javaMajor} bulundu — 1.18+ sürümler Java 17+ ister.");

            if (loader != ModLoaderService.Vanilla)
            {
                var profileJson = Path.Combine(_minecraftDir, "versions", versionId, $"{versionId}.json");
                if (!File.Exists(profileJson))
                {
                    _lblStatus.Text = $"{loader} {loaderVersion} kuruluyor...";
                    await _loaders.InstallAsync(loader, mc, loaderVersion!, _minecraftDir, _cts.Token);
                    _api.ClearCache();
                    Log($"[CML] {loader} {loaderVersion} kuruldu.");
                }
                else
                {
                    Log($"[CML] {loader} zaten kurulu.");
                }
            }

            var overall = new Progress<LaunchStatus>(OnLaunchStatus);
            await _minecraft.EnsureInstalledAsync(options, overall, _cts.Token);

            var proc = await _minecraft.LaunchAsync(options, Log, overall, _cts.Token);
            _launched = true;
            _lblStatus.Text = "Oyun çalışıyor — kapatılınca loglar burada görünür.";
            await proc.WaitForExitAsync(_cts.Token);
            Log($"[CML] Oyun kapandı (çıkış kodu: {proc.ExitCode}).");
        }
        catch (OperationCanceledException)
        {
            Log("[CML] İşlem iptal edildi.");
        }
        catch (Exception ex)
        {
            _lblStatus.Text = "Hata oluştu — logu incele.";
            Log($"[HATA] {ex}");
        }
        finally
        {
            _launched = false;
            SetBusy(false);
        }
    }

    private void OnLaunchStatus(LaunchStatus status)
    {
        _lblStatus.Text = status.Message;
        _lblProgress.Text = $"%{status.Fraction * 100:0.0}";
        _progress.Fraction = status.Fraction;
    }

    private void SetBusy(bool busy)
    {
        _busy = busy;
        _btnPlay.Enabled = !busy;
        _btnPlay.Text = busy ? "ÇALIŞIYOR..." : "OYUNU BAŞLAT";
        _cmbVersion.Enabled = !busy;
        _cmbLoader.Enabled = !busy && _cmbVersion.Items.Count > 0;
        _cmbLoaderVersion.Enabled = !busy && _cmbLoaderVersion.Items.Count > 0;
        _txtJava.Enabled = !busy;
        _cmbRam.Enabled = !busy;
        _txtUsername.Enabled = !busy;
        _progress.Fraction = 0;
        _lblProgress.Text = "0%";
    }

    public void Log(string message)
    {
        if (IsDisposed || _log == null || !_log.IsHandleCreated) return;
        try
        {
            _log.BeginInvoke(new Action(() =>
            {
                _log.AppendText(message + Environment.NewLine);
                _log.SelectionStart = _log.TextLength;
                _log.ScrollToCaret();
            }));
        }
        catch { }
    }

    private const int WM_NCLBUTTONDOWN = 0xA1;
    private const int HT_CAPTION = 0x2;

    [DllImport("user32.dll")]
    private static extern bool ReleaseCapture();

    [DllImport("user32.dll")]
    private static extern IntPtr SendMessage(IntPtr hWnd, int msg, IntPtr wParam, IntPtr lParam);
}
