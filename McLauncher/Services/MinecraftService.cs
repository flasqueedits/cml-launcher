using System.Diagnostics;
using System.IO.Compression;
using System.Security.Cryptography;
using System.Text;
using McLauncher.Models;

namespace McLauncher.Services;

public sealed class MinecraftService
{
    public static readonly string[] NetworkJvmArgs =
    {
        "-Djava.net.preferIPv4Stack=true",
        "-Djava.net.preferIPv6Addresses=false",
        "-Dsun.net.client.defaultConnectTimeout=20000",
        "-Dsun.net.client.defaultReadTimeout=60000",
        "-Dhttp.connectTimeout=20000",
        "-Dhttp.readTimeout=60000",
        "-Dhttps.connectTimeout=20000",
        "-Dhttps.readTimeout=60000",
        "-Djdk.httpclient.connectTimeout=20000",
        "-Djdk.httpclient.readTimeout=60000",
        "-Djava.net.useSystemProxies=false",
        "-Dfile.encoding=UTF-8",
        "-Dstdout.encoding=UTF-8",
        "-Dstderr.encoding=UTF-8",
        "-Djna.nosys=true",
        "-Dlog4j2.formatMsgNoLookups=true",
        "-Dsun.security.ssl.allowUnsafeRenegotiation=false",
    };

    private readonly DownloadService _dl;
    private readonly MojangApiService _api;
    private static readonly string ClientId = Guid.NewGuid().ToString();

    public MinecraftService(DownloadService dl, MojangApiService api)
    {
        _dl = dl;
        _api = api;
    }

    public async Task EnsureInstalledAsync(LaunchOptions options, IProgress<LaunchStatus>? progress = null, CancellationToken ct = default)
    {
        var mcDir = options.MinecraftDir;
        var version = await _api.ResolveAsync(mcDir, options.VersionId, ct).ConfigureAwait(false);

        if (string.IsNullOrEmpty(version.ClientUrl))
            throw new InvalidOperationException($"'{options.VersionId}' için istemci indirme adresi yok.");

        var clientJar = Path.Combine(mcDir, "versions", version.Id, $"{version.Id}.jar");
        var tasks = new List<DownloadTask>
        {
            new(version.ClientUrl, clientJar, version.ClientSize, version.ClientSha1),
        };

        foreach (var lib in version.Libraries)
        {
            tasks.Add(new DownloadTask(lib.Url, Path.Combine(mcDir, "libraries", lib.ArtifactPath), lib.Size, lib.Sha1));
            if (lib.ExtractToNatives && !string.IsNullOrEmpty(lib.NativesUrl) && !string.IsNullOrEmpty(lib.NativesPath))
                tasks.Add(new DownloadTask(lib.NativesUrl, Path.Combine(mcDir, "libraries", lib.NativesPath)));
        }

        if (string.IsNullOrEmpty(version.AssetIndexUrl))
            throw new InvalidOperationException($"'{version.Id}' için asset index adresi yok.");

        var indexFile = Path.Combine(mcDir, "assets", "indexes", $"{version.AssetIndexId}.json");
        tasks.Add(new DownloadTask(version.AssetIndexUrl, indexFile, version.AssetIndexSize, version.AssetIndexSha1));

        progress?.Report(new LaunchStatus("Sürüm dosyaları indiriliyor...", 0, 0.6));
        await _dl.DownloadAllAsync(tasks, new Progress<double>(p => progress?.Report(new LaunchStatus("Sürüm dosyaları indiriliyor...", p, 0.6))), ct).ConfigureAwait(false);

        var nativesDir = Path.Combine(mcDir, "versions", version.Id, "natives");
        Directory.CreateDirectory(nativesDir);
        foreach (var old in Directory.EnumerateFiles(nativesDir)) File.Delete(old);
        ExtractNatives(mcDir, version, nativesDir);

        var assetsRoot = Path.Combine(mcDir, "assets");
        progress?.Report(new LaunchStatus("Asset index okunuyor...", 0, 0.75));
        var assetTasks = await BuildAssetTasksAsync(assetsRoot, indexFile, ct).ConfigureAwait(false);

        progress?.Report(new LaunchStatus("Oyun dosyaları (assets) indiriliyor...", 0, 0.75));
        await _dl.DownloadAllAsync(assetTasks, new Progress<double>(p => progress?.Report(new LaunchStatus("Oyun dosyaları (assets) indiriliyor...", p, 0.75))), ct).ConfigureAwait(false);

        progress?.Report(new LaunchStatus("Hazır.", 1, 1));
    }

    private void ExtractNatives(string mcDir, ResolvedVersion version, string nativesDir)
    {
        foreach (var lib in version.Libraries.Where(l => l.ExtractToNatives))
        {
            var zipPath = lib.NativesPath != null
                ? Path.Combine(mcDir, "libraries", lib.NativesPath)
                : Path.Combine(mcDir, "libraries", lib.ArtifactPath);
            if (!File.Exists(zipPath)) continue;
            try
            {
                using var zip = ZipFile.OpenRead(zipPath);
                foreach (var entry in zip.Entries)
                {
                    var name = entry.FullName.Replace('/', Path.DirectorySeparatorChar);
                    if (name.EndsWith(Path.DirectorySeparatorChar)) continue;
                    if (name.StartsWith("META-INF", StringComparison.OrdinalIgnoreCase)) continue;
                    if (lib.ExtractExclude != null && lib.ExtractExclude.Any(e => entry.FullName.StartsWith(e, StringComparison.OrdinalIgnoreCase))) continue;
                    var dest = Path.Combine(nativesDir, name);
                    Directory.CreateDirectory(Path.GetDirectoryName(dest)!);
                    entry.ExtractToFile(dest, true);
                }
            }
            catch { }
        }
    }

    private async Task<List<DownloadTask>> BuildAssetTasksAsync(string assetsRoot, string indexFile, CancellationToken ct)
    {
        var tasks = new List<DownloadTask>();
        if (!File.Exists(indexFile)) return tasks;

        var text = await File.ReadAllTextAsync(indexFile, ct).ConfigureAwait(false);
        var root = System.Text.Json.Nodes.JsonNode.Parse(text);
        var objects = root?["objects"]?.AsObject();
        if (objects == null) return tasks;

        foreach (var (name, node) in objects)
        {
            var hash = node?["hash"]?.GetValue<string>();
            var size = node?["size"]?.GetValue<long>();
            if (string.IsNullOrEmpty(hash) || hash.Length < 2) continue;
            var dest = Path.Combine(assetsRoot, "objects", hash[..2], hash);
            tasks.Add(new DownloadTask(DownloadService.ResourcesBase + $"{hash[..2]}/{hash}", dest, size));
        }
        return tasks;
    }

    public async Task<Process> LaunchAsync(LaunchOptions options, Action<string>? log = null, IProgress<LaunchStatus>? progress = null, CancellationToken ct = default)
    {
        var mcDir = options.MinecraftDir;
        var version = await _api.ResolveAsync(mcDir, options.VersionId, ct).ConfigureAwait(false);
        if (string.IsNullOrEmpty(version.MainClass))
            version.MainClass = "net.minecraft.client.main.Main";

        var nativesDir = Path.Combine(mcDir, "versions", version.Id, "natives");
        var classPath = BuildClassPath(mcDir, version);

        var jvmArgs = BuildJvmArgs(options, version, classPath, nativesDir);
        var gameArgs = BuildGameArgs(options, version, mcDir);

        log?.Invoke($"[Launcher] Sürüm: {version.Id} | Ana sınıf: {version.MainClass}");
        log?.Invoke($"[Launcher] Java: {options.JavaPath} | RAM: {options.RamMb} MB");

        var psi = new ProcessStartInfo
        {
            FileName = options.JavaPath,
            UseShellExecute = false,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            CreateNoWindow = true,
            WorkingDirectory = mcDir,
        };
        var javaHome = Path.GetDirectoryName(Path.GetDirectoryName(options.JavaPath));
        if (javaHome != null) psi.EnvironmentVariables["JAVA_HOME"] = javaHome;

        foreach (var arg in jvmArgs) psi.ArgumentList.Add(arg);
        psi.ArgumentList.Add(version.MainClass);
        foreach (var arg in gameArgs) psi.ArgumentList.Add(arg);

        var process = Process.Start(psi) ?? throw new InvalidOperationException("javaw.exe başlatılamadı.");
        process.OutputDataReceived += (_, e) => { if (!string.IsNullOrEmpty(e.Data)) log?.Invoke(e.Data); };
        process.ErrorDataReceived += (_, e) => { if (!string.IsNullOrEmpty(e.Data)) log?.Invoke(e.Data); };
        process.BeginOutputReadLine();
        process.BeginErrorReadLine();

        progress?.Report(new LaunchStatus("Oyun çalışıyor...", 1, 1));
        return process;
    }

    private static string BuildClassPath(string mcDir, ResolvedVersion version)
    {
        var entries = version.Libraries
            .Where(l => !l.ExtractToNatives || l.NativesPath == null)
            .Select(l => Path.Combine(mcDir, "libraries", l.ArtifactPath))
            .ToList();
        entries.Add(Path.Combine(mcDir, "versions", version.Id, $"{version.Id}.jar"));
        return string.Join(Path.PathSeparator, entries);
    }

    private static List<string> BuildJvmArgs(LaunchOptions options, ResolvedVersion version, string classPath, string nativesDir)
    {
        var mcDir = options.MinecraftDir;
        var args = new List<string>
        {
            $"-Xms{options.RamMb}M",
            $"-Xmx{options.RamMb}M",
        };
        args.AddRange(NetworkJvmArgs);
        args.Add($"-Djava.library.path={nativesDir}");
        args.AddRange(version.JvmArgs.Select(a => ReplacePlaceholders(a, options, version, mcDir, nativesDir, classPath)));
        args.Add("-cp");
        args.Add(classPath);
        return args;
    }

    private static List<string> BuildGameArgs(LaunchOptions options, ResolvedVersion version, string mcDir)
    {
        List<string> tokens;
        if (version.GameArgs.Count > 0)
        {
            tokens = version.GameArgs.Select(a => ReplacePlaceholders(a, options, version, mcDir, "", "")).ToList();
        }
        else if (!string.IsNullOrEmpty(version.MinecraftArguments))
        {
            tokens = Tokenize(version.MinecraftArguments)
                .Select(a => ReplacePlaceholders(a, options, version, mcDir, "", ""))
                .ToList();
        }
        else
        {
            tokens = new List<string>();
        }

        if (!tokens.Contains("--username"))
        {
            tokens.AddRange(new[]
            {
                "--username", options.Username,
                "--version", version.Id,
                "--gameDir", mcDir,
                "--assetsDir", Path.Combine(mcDir, "assets"),
                "--assetIndex", version.AssetIndexId,
                "--uuid", OfflineUuid(options.Username),
                "--accessToken", "0",
                "--userType", "legacy",
                "--versionType", "release",
                "--width", options.Width.ToString(),
                "--height", options.Height.ToString(),
            });
        }
        return tokens;
    }

    private static string ReplacePlaceholders(string arg, LaunchOptions options, ResolvedVersion version, string mcDir, string nativesDir, string classPath)
    {
        var assets = Path.Combine(mcDir, "assets");
        return arg
            .Replace("${auth_player_name}", options.Username)
            .Replace("${profile_name}", options.Username)
            .Replace("${version_name}", version.Id)
            .Replace("${version}", version.Id)
            .Replace("${game_directory}", mcDir)
            .Replace("${base_path}", mcDir)
            .Replace("${assets_root}", assets)
            .Replace("${game_assets}", assets)
            .Replace("${assets_index_name}", version.AssetIndexId)
            .Replace("${auth_uuid}", OfflineUuid(options.Username))
            .Replace("${auth_access_token}", "0")
            .Replace("${auth_session}", "0")
            .Replace("${auth_xuid}", "0")
            .Replace("${auth_client_id}", "0")
            .Replace("${user_type}", "legacy")
            .Replace("${version_type}", "release")
            .Replace("${natives_directory}", nativesDir)
            .Replace("${launcher_name}", "McLauncher")
            .Replace("${launcher_version}", "1.0")
            .Replace("${classpath}", classPath)
            .Replace("${library_directory}", Path.Combine(mcDir, "libraries"))
            .Replace("${resolution_width}", options.Width.ToString())
            .Replace("${resolution_height}", options.Height.ToString())
            .Replace("${quickPlayPath}", "")
            .Replace("${user_properties}", "{}")
            .Replace("${clientid}", ClientId)
            .Replace("${client_id}", ClientId);
    }

    private static List<string> Tokenize(string input)
    {
        var tokens = new List<string>();
        var current = new StringBuilder();
        var inQuote = false;
        foreach (var c in input)
        {
            if (c == '"')
            {
                inQuote = !inQuote;
            }
            else if (char.IsWhiteSpace(c) && !inQuote)
            {
                if (current.Length > 0)
                {
                    tokens.Add(current.ToString());
                    current.Clear();
                }
            }
            else
            {
                current.Append(c);
            }
        }
        if (current.Length > 0) tokens.Add(current.ToString());
        return tokens;
    }

    public static string OfflineUuid(string username)
    {
        var hash = MD5.HashData(Encoding.UTF8.GetBytes("OfflinePlayer:" + username));
        hash[6] = (byte)((hash[6] & 0x0F) | 0x30);
        hash[8] = (byte)((hash[8] & 0x3F) | 0x80);
        var hex = Convert.ToHexString(hash).ToLowerInvariant();
        return $"{hex[..8]}-{hex[8..12]}-{hex[12..16]}-{hex[16..20]}-{hex[20..]}";
    }
}

public sealed record LaunchStatus(string Message, double Fraction, double Weight);
