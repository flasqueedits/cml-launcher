namespace McLauncher.Models;

public sealed record MinecraftRelease(string Id, string Url, string Type, DateTime ReleaseTime);

public sealed class MinecraftLibrary
{
    public string Name = "";
    public string ArtifactPath = "";
    public string Url = "";
    public string? Sha1;
    public long Size;
    public string? NativesPath;
    public string? NativesUrl;
    public bool ExtractToNatives;
    public string[]? ExtractExclude;
}

public sealed class ResolvedVersion
{
    public string Id = "";
    public string MainClass = "";
    public List<string> JvmArgs = new();
    public List<string> GameArgs = new();
    public string? MinecraftArguments;
    public List<MinecraftLibrary> Libraries = new();
    public string AssetIndexId = "";
    public string AssetIndexUrl = "";
    public string? AssetIndexSha1;
    public long? AssetIndexSize;
    public string ClientUrl = "";
    public string? ClientSha1;
    public long? ClientSize;
    public int JavaMajor = 8;
}

public sealed record LaunchOptions
{
    public required string Username { get; init; }
    public required string VersionId { get; init; }
    public required string JavaPath { get; init; }
    public required string MinecraftDir { get; init; }
    public int RamMb { get; init; } = 2048;
    public int Width { get; init; } = 854;
    public int Height { get; init; } = 480;
}

public sealed record LoaderVersion(string Version, bool Recommended);
