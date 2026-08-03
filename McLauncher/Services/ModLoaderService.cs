using System.Diagnostics;
using System.Text.Json.Nodes;
using System.Xml.Linq;
using McLauncher.Models;

namespace McLauncher.Services;

public sealed class ModLoaderService
{
    public const string Vanilla = "Vanilla";
    public const string Fabric = "Fabric";
    public const string Quilt = "Quilt";
    public const string Forge = "Forge";

    private readonly DownloadService _dl;

    public ModLoaderService(DownloadService dl) => _dl = dl;

    public static string BuildVersionId(string loader, string mcVersion, string loaderVersion)
    {
        return loader switch
        {
            Fabric => $"fabric-{mcVersion}-{loaderVersion}",
            Quilt => $"quilt-{mcVersion}-{loaderVersion}",
            Forge => $"{mcVersion}-forge-{loaderVersion}",
            _ => mcVersion,
        };
    }

    public async Task<List<LoaderVersion>> GetLoaderVersionsAsync(string loader, string mcVersion, CancellationToken ct = default)
    {
        return loader switch
        {
            Fabric => await GetFabricVersionsAsync(mcVersion, ct).ConfigureAwait(false),
            Quilt => await GetQuiltVersionsAsync(mcVersion, ct).ConfigureAwait(false),
            Forge => await GetForgeVersionsAsync(mcVersion, ct).ConfigureAwait(false),
            _ => new List<LoaderVersion>(),
        };
    }

    public async Task InstallAsync(string loader, string mcVersion, string loaderVersion, string mcDir, CancellationToken ct = default)
    {
        switch (loader)
        {
            case Fabric:
                await InstallFabricAsync(mcVersion, loaderVersion, mcDir, ct).ConfigureAwait(false);
                break;
            case Quilt:
                await InstallQuiltAsync(mcVersion, loaderVersion, mcDir, ct).ConfigureAwait(false);
                break;
            case Forge:
                await InstallForgeAsync(mcVersion, loaderVersion, mcDir, ct).ConfigureAwait(false);
                break;
        }
    }

    private async Task<List<LoaderVersion>> GetFabricVersionsAsync(string mcVersion, CancellationToken ct)
    {
        var url = $"https://meta.fabricmc.net/v2/versions/loader/{mcVersion}";
        var root = JsonNode.Parse(await _dl.GetStringAsync(url, ct).ConfigureAwait(false))!.AsArray();
        return root
            .Select(n => n?["loader"]?["version"]?.GetValue<string>())
            .Where(v => !string.IsNullOrEmpty(v))
            .Distinct()
            .Select((v, i) => new LoaderVersion(v!, Recommended: i == 0))
            .ToList();
    }

    private async Task InstallFabricAsync(string mcVersion, string loaderVersion, string mcDir, CancellationToken ct)
    {
        var url = $"https://meta.fabricmc.net/v2/versions/loader/{mcVersion}/{loaderVersion}/profile/json";
        var json = await _dl.GetStringAsync(url, ct).ConfigureAwait(false);
        var versionId = BuildVersionId(Fabric, mcVersion, loaderVersion);
        await SaveProfileAsync(json, mcDir, versionId, ct).ConfigureAwait(false);
    }

    private async Task<List<LoaderVersion>> GetQuiltVersionsAsync(string mcVersion, CancellationToken ct)
    {
        var url = $"https://meta.quiltmc.org/v3/versions/loader/{mcVersion}";
        var root = JsonNode.Parse(await _dl.GetStringAsync(url, ct).ConfigureAwait(false))!.AsArray();
        return root
            .Select(n => n?["loader"]?["version"]?.GetValue<string>())
            .Where(v => !string.IsNullOrEmpty(v))
            .Distinct()
            .Select((v, i) => new LoaderVersion(v!, Recommended: i == 0))
            .ToList();
    }

    private async Task InstallQuiltAsync(string mcVersion, string loaderVersion, string mcDir, CancellationToken ct)
    {
        var url = $"https://meta.quiltmc.org/v3/versions/loader/{mcVersion}/{loaderVersion}/profile/json";
        var json = await _dl.GetStringAsync(url, ct).ConfigureAwait(false);
        var versionId = BuildVersionId(Quilt, mcVersion, loaderVersion);
        await SaveProfileAsync(json, mcDir, versionId, ct).ConfigureAwait(false);
    }

    private async Task<List<LoaderVersion>> GetForgeVersionsAsync(string mcVersion, CancellationToken ct)
    {
        var list = new List<LoaderVersion>();

        var metaUrl = "https://maven.minecraftforge.net/net/minecraftforge/forge/maven-metadata.xml";
        var xml = await _dl.GetStringAsync(metaUrl, ct).ConfigureAwait(false);
        var doc = XDocument.Parse(xml);
        var versions = doc.Descendants("version")
            .Select(e => e.Value.Trim())
            .Where(v => v.StartsWith(mcVersion + "-", StringComparison.Ordinal))
            .Select(v => v[(mcVersion.Length + 1)..])
            .Distinct()
            .ToList();

        var recommended = new HashSet<string>();
        try
        {
            var promosUrl = "https://files.minecraftforge.net/net/minecraftforge/forge/promotions_slim.json";
            var promos = JsonNode.Parse(await _dl.GetStringAsync(promosUrl, ct).ConfigureAwait(false));
            var rec = promos?["promos"]?[$"{mcVersion}-recommended"]?.GetValue<string>();
            var latest = promos?["promos"]?[$"{mcVersion}-latest"]?.GetValue<string>();
            if (!string.IsNullOrEmpty(rec)) recommended.Add(rec);
            if (!string.IsNullOrEmpty(latest)) recommended.Add(latest);
        }
        catch { }

        foreach (var v in versions)
            list.Add(new LoaderVersion(v, recommended.Contains(v)));

        return list
            .OrderByDescending(v => v.Recommended)
            .ThenByDescending(v => v.Version, StringComparer.Ordinal)
            .ToList();
    }

    private async Task InstallForgeAsync(string mcVersion, string forgeVersion, string mcDir, CancellationToken ct)
    {
        var full = $"{mcVersion}-{forgeVersion}";
        var installerUrl = $"https://maven.minecraftforge.net/net/minecraftforge/forge/{full}/forge-{full}-installer.jar";
        var tempJar = Path.Combine(Path.GetTempPath(), $"forge-{full}-installer.jar");

        await _dl.DownloadToFileAsync(installerUrl, tempJar, ct: ct).ConfigureAwait(false);

        var javaPath = JavaService.FindJava() ?? throw new InvalidOperationException("Forge kurulumu için Java gerekli.");
        var psi = new ProcessStartInfo
        {
            FileName = javaPath,
            UseShellExecute = false,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            CreateNoWindow = true,
            WorkingDirectory = mcDir,
        };
        psi.ArgumentList.Add("-jar");
        psi.ArgumentList.Add(tempJar);
        psi.ArgumentList.Add("--installClient");
        psi.ArgumentList.Add("--installDir");
        psi.ArgumentList.Add(mcDir);
        psi.ArgumentList.Add("--noprofile");

        using var process = Process.Start(psi) ?? throw new InvalidOperationException("Forge yükleyici başlatılamadı.");
        var output = new System.Text.StringBuilder();
        process.OutputDataReceived += (_, e) => { if (e.Data != null) output.AppendLine(e.Data); };
        process.ErrorDataReceived += (_, e) => { if (e.Data != null) output.AppendLine(e.Data); };
        process.BeginOutputReadLine();
        process.BeginErrorReadLine();
        await process.WaitForExitAsync(ct).ConfigureAwait(false);

        if (process.ExitCode != 0)
            throw new InvalidOperationException($"Forge kurulumu başarısız (kod {process.ExitCode}):{Environment.NewLine}{output}");
    }

    private async Task SaveProfileAsync(string json, string mcDir, string versionId, CancellationToken ct)
    {
        var dir = Path.Combine(mcDir, "versions", versionId);
        Directory.CreateDirectory(dir);
        await File.WriteAllTextAsync(Path.Combine(dir, $"{versionId}.json"), json, ct).ConfigureAwait(false);
    }
}
