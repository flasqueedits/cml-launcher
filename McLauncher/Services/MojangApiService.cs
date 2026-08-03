using System.Text.Json.Nodes;
using McLauncher.Models;

namespace McLauncher.Services;

public sealed class MojangApiService
{
    private readonly DownloadService _dl;
    private List<MinecraftRelease>? _manifest;
    private readonly Dictionary<string, ResolvedVersion> _resolvedCache = new();

    public MojangApiService(DownloadService dl) => _dl = dl;

    public void ClearCache() => _resolvedCache.Clear();

    public async Task<List<MinecraftRelease>> GetReleasesAsync(bool forceRefresh = false, CancellationToken ct = default)
    {
        if (_manifest != null && !forceRefresh) return _manifest;

        const string manifestUrl = "https://piston-meta.mojang.com/mc/game/version_manifest_v2.json";
        var root = JsonNode.Parse(await _dl.GetStringAsync(manifestUrl, ct).ConfigureAwait(false))!.AsObject();
        var versions = root["versions"]!.AsArray();
        _manifest = versions
            .Select(n => new MinecraftRelease(
                Id: n!["id"]!.GetValue<string>(),
                Url: n["url"]!.GetValue<string>(),
                Type: n["type"]?.GetValue<string>() ?? "release",
                ReleaseTime: n["releaseTime"]?.GetValue<DateTime>() ?? DateTime.MinValue))
            .ToList();
        return _manifest;
    }

    public async Task<ResolvedVersion> ResolveAsync(string mcDir, string versionId, CancellationToken ct = default)
    {
        if (_resolvedCache.TryGetValue(versionId, out var cached)) return cached;

        var (root, id) = await LoadVersionRootAsync(mcDir, versionId, ct).ConfigureAwait(false);
        var version = ParseVersion(root, id);

        var visited = new HashSet<string> { id };
        var parentId = root["inheritsFrom"]?.GetValue<string>();
        while (!string.IsNullOrEmpty(parentId) && visited.Add(parentId))
        {
            var (parentRoot, pid) = await LoadVersionRootAsync(mcDir, parentId, ct).ConfigureAwait(false);
            var parent = ParseVersion(parentRoot, pid);
            version = MergeVersions(parent, version);
            parentId = parentRoot["inheritsFrom"]?.GetValue<string>();
        }

        _resolvedCache[versionId] = version;
        return version;
    }

    private async Task<(JsonObject Root, string Id)> LoadVersionRootAsync(string mcDir, string versionId, CancellationToken ct)
    {
        var localPath = Path.Combine(mcDir, "versions", versionId, $"{versionId}.json");
        if (File.Exists(localPath))
        {
            var text = await File.ReadAllTextAsync(localPath, ct).ConfigureAwait(false);
            return (JsonNode.Parse(text)!.AsObject(), versionId);
        }

        var releases = await GetReleasesAsync(false, ct).ConfigureAwait(false);
        var release = releases.FirstOrDefault(r => r.Id == versionId)
            ?? throw new InvalidOperationException($"'{versionId}' sürümü manifest'te bulunamadı.");

        var json = await _dl.GetStringAsync(release.Url, ct).ConfigureAwait(false);
        Directory.CreateDirectory(Path.GetDirectoryName(localPath)!);
        await File.WriteAllTextAsync(localPath, json, ct).ConfigureAwait(false);
        return (JsonNode.Parse(json)!.AsObject(), versionId);
    }

    private static ResolvedVersion ParseVersion(JsonObject root, string id)
    {
        var version = new ResolvedVersion { Id = id };

        version.MainClass = root["mainClass"]?.GetValue<string>() ?? "";
        version.MinecraftArguments = root["minecraftArguments"]?.GetValue<string>();

        var assetIndex = root["assetIndex"]?.AsObject();
        if (assetIndex != null)
        {
            version.AssetIndexId = assetIndex["id"]?.GetValue<string>() ?? id;
            version.AssetIndexUrl = assetIndex["url"]?.GetValue<string>() ?? "";
            version.AssetIndexSha1 = assetIndex["sha1"]?.GetValue<string>();
            version.AssetIndexSize = assetIndex["size"]?.GetValue<long>();
        }

        var client = root["downloads"]?["client"]?.AsObject();
        if (client != null)
        {
            version.ClientUrl = client["url"]?.GetValue<string>() ?? "";
            version.ClientSha1 = client["sha1"]?.GetValue<string>();
            version.ClientSize = client["size"]?.GetValue<long>();
        }

        var javaVersion = root["javaVersion"]?.AsObject();
        version.JavaMajor = javaVersion?["majorVersion"]?.GetValue<int>() ?? 8;

        if (root["libraries"] is JsonArray libs)
        {
            foreach (var node in libs)
            {
                if (node is not JsonObject lib || !AcceptedByRules(lib["rules"])) continue;
                var parsed = ParseLibrary(lib);
                if (parsed != null) version.Libraries.Add(parsed);
            }
        }

        if (root["arguments"] is JsonObject arguments)
        {
            version.JvmArgs = FlattenArgs(arguments["jvm"]).ToList();
            version.GameArgs = FlattenArgs(arguments["game"]).ToList();
        }

        return version;
    }

    private static MinecraftLibrary? ParseLibrary(JsonObject lib)
    {
        var name = lib["name"]?.GetValue<string>();
        if (string.IsNullOrEmpty(name)) return null;

        var downloads = lib["downloads"]?.AsObject();
        var artifact = downloads?["artifact"]?.AsObject();
        var library = new MinecraftLibrary { Name = name };

        string artifactPath;
        if (artifact != null)
        {
            artifactPath = artifact["path"]?.GetValue<string>() ?? NameToPath(name);
            library.Sha1 = artifact["sha1"]?.GetValue<string>();
            library.Size = artifact["size"]?.GetValue<long>() ?? 0;
        }
        else
        {
            artifactPath = NameToPath(name);
        }

        library.ArtifactPath = artifactPath;
        library.Url = artifact?["url"]?.GetValue<string>() ?? DownloadService.LibrariesBase + artifactPath;

        var classifier = downloads?["classifiers"]?["natives-windows"]?.AsObject();
        if (classifier != null)
        {
            var nativesPath = classifier["path"]?.GetValue<string>() ?? NameToPath(name.Replace("$", "x") + ":natives-windows");
            library.NativesPath = nativesPath;
            library.NativesUrl = classifier["url"]?.GetValue<string>() ?? DownloadService.LibrariesBase + nativesPath;
            library.ExtractToNatives = true;
        }
        else if (lib["natives"] is JsonObject natives && natives["windows"] != null)
        {
            library.ExtractToNatives = true;
            library.ExtractExclude = (lib["extract"]?["exclude"] as JsonArray)
                ?.Select(n => n?.GetValue<string>())
                .Where(s => !string.IsNullOrEmpty(s))
                .Cast<string>()
                .ToArray();
        }

        return library;
    }

    private static string NameToPath(string name)
    {
        var parts = name.Split(':');
        if (parts.Length < 3) return name.Replace('.', '/') + ".jar";
        var group = parts[0].Replace('.', '/');
        var artifact = parts[1];
        var version = parts[2];
        return $"{group}/{artifact}/{version}/{artifact}-{version}.jar";
    }

    private static IEnumerable<string> FlattenArgs(JsonNode? node)
    {
        if (node is JsonArray array)
        {
            foreach (var item in array)
            {
                if (item is JsonValue value)
                {
                    yield return value.ToString();
                }
                else if (item is JsonObject obj)
                {
                    if (!AcceptedByRules(obj["rules"])) continue;
                    var inner = obj["value"];
                    if (inner is JsonArray innerArray)
                    {
                        foreach (var v in innerArray.Where(n => n is JsonValue).Select(n => n!.ToString()))
                            yield return v;
                    }
                    else if (inner is JsonValue single)
                    {
                        yield return single.ToString();
                    }
                }
            }
        }
        else if (node is JsonValue single)
        {
            yield return single.ToString();
        }
    }

    private static bool AcceptedByRules(JsonNode? rules)
    {
        if (rules is not JsonArray list || list.Count == 0) return true;

        foreach (var rule in list)
        {
            if (rule is not JsonObject r) continue;
            var action = r["action"]?.GetValue<string>();
            var matches = MatchesOsCondition(r["os"]?.AsObject()) && !MatchesFeature(r["features"]?.AsObject());
            if (action == "disallow" && matches) return false;
            if (action == "allow" && matches) return true;
        }
        return true;
    }

    private static bool MatchesOsCondition(JsonObject? os)
    {
        if (os == null) return true;
        var name = os["name"]?.GetValue<string>();
        if (name != null && !string.Equals(name, "windows", StringComparison.OrdinalIgnoreCase)) return false;
        var arch = os["arch"]?.GetValue<string>();
        if (arch != null)
        {
            var is64 = Environment.Is64BitOperatingSystem;
            if (arch == "x86" && is64) return false;
            if (arch == "x86_64" && !is64) return false;
        }
        return true;
    }

    private static bool MatchesFeature(JsonObject? features)
    {
        if (features == null) return false;
        foreach (var (key, value) in features)
        {
            if (value?.GetValue<bool>() == true) return true;
        }
        return false;
    }

    private static ResolvedVersion MergeVersions(ResolvedVersion parent, ResolvedVersion child)
    {
        var merged = new ResolvedVersion
        {
            Id = child.Id,
            MainClass = !string.IsNullOrEmpty(child.MainClass) ? child.MainClass : parent.MainClass,
            AssetIndexId = !string.IsNullOrEmpty(child.AssetIndexId) ? child.AssetIndexId : parent.AssetIndexId,
            AssetIndexUrl = !string.IsNullOrEmpty(child.AssetIndexUrl) ? child.AssetIndexUrl : parent.AssetIndexUrl,
            AssetIndexSha1 = child.AssetIndexSha1 ?? parent.AssetIndexSha1,
            AssetIndexSize = child.AssetIndexSize ?? parent.AssetIndexSize,
            ClientUrl = !string.IsNullOrEmpty(child.ClientUrl) ? child.ClientUrl : parent.ClientUrl,
            ClientSha1 = child.ClientSha1 ?? parent.ClientSha1,
            ClientSize = child.ClientSize ?? parent.ClientSize,
            JavaMajor = child.JavaMajor != 8 ? child.JavaMajor : parent.JavaMajor,
        };

        merged.Libraries.AddRange(parent.Libraries);
        foreach (var lib in child.Libraries)
        {
            if (merged.Libraries.All(x => x.Name != lib.Name))
                merged.Libraries.Add(lib);
        }

        merged.JvmArgs = parent.JvmArgs.Concat(child.JvmArgs).Distinct().ToList();

        var childHasArgs = child.GameArgs.Count > 0 || !string.IsNullOrEmpty(child.MinecraftArguments);
        if (childHasArgs)
        {
            merged.GameArgs = child.GameArgs;
            merged.MinecraftArguments = child.MinecraftArguments;
        }
        else
        {
            merged.GameArgs = parent.GameArgs;
            merged.MinecraftArguments = parent.MinecraftArguments;
        }

        return merged;
    }
}
