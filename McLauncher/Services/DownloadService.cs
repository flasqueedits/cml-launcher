using System.Net;
using System.Security.Cryptography;

namespace McLauncher.Services;

public sealed record DownloadTask(string Url, string Destination, long? Size = null, string? Sha1 = null, bool Extract = false, string[]? Exclude = null);

public sealed class DownloadService : IDisposable
{
    public const string LibrariesBase = "https://libraries.minecraft.net/";
    public const string ResourcesBase = "https://resources.download.minecraft.net/";

    private readonly HttpClient _http;

    public DownloadService()
    {
        var handler = new SocketsHttpHandler
        {
            ConnectTimeout = TimeSpan.FromSeconds(20),
            PooledConnectionLifetime = TimeSpan.FromMinutes(5),
            MaxConnectionsPerServer = 16,
            AutomaticDecompression = DecompressionMethods.GZip | DecompressionMethods.Deflate,
        };
        _http = new HttpClient(handler) { Timeout = TimeSpan.FromMinutes(20) };
        _http.DefaultRequestHeaders.UserAgent.ParseAdd("Mozilla/5.0 (Windows NT 10.0; Win64; x64) McLauncher/1.0");
    }

    public async Task<string> GetStringAsync(string url, CancellationToken ct = default)
    {
        using var response = await _http.GetAsync(url, HttpCompletionOption.ResponseHeadersRead, ct).ConfigureAwait(false);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadAsStringAsync(ct).ConfigureAwait(false);
    }

    public async Task DownloadToFileAsync(string url, string destination, IProgress<double>? progress = null, CancellationToken ct = default)
    {
        Directory.CreateDirectory(Path.GetDirectoryName(destination)!);
        using var response = await _http.GetAsync(url, HttpCompletionOption.ResponseHeadersRead, ct).ConfigureAwait(false);
        response.EnsureSuccessStatusCode();
        var total = response.Content.Headers.ContentLength;
        await using var input = await response.Content.ReadAsStreamAsync(ct).ConfigureAwait(false);
        await using var output = new FileStream(destination + ".part", FileMode.Create, FileAccess.Write, FileShare.None);
        var buffer = new byte[128 * 1024];
        long done = 0;
        int read;
        while ((read = await input.ReadAsync(buffer, ct).ConfigureAwait(false)) > 0)
        {
            await output.WriteAsync(buffer, 0, read, ct).ConfigureAwait(false);
            done += read;
            if (total is > 0)
                progress?.Report((double)done / total.Value);
        }
        output.Flush();
        File.Move(destination + ".part", destination, overwrite: true);
    }

    public async Task DownloadAllAsync(IReadOnlyList<DownloadTask> tasks, IProgress<double>? progress = null, CancellationToken ct = default)
    {
        var pending = tasks.Where(NeedsDownload).ToList();
        if (pending.Count == 0)
        {
            progress?.Report(1);
            return;
        }

        var totalBytes = pending.Sum(t => t.Size ?? 0);
        var doneBytes = 0L;
        using var semaphore = new SemaphoreSlim(6);
        var jobs = pending.Select(async t =>
        {
            await semaphore.WaitAsync(ct).ConfigureAwait(false);
            try
            {
                await DownloadToFileAsync(t.Url, t.Destination, ct: ct).ConfigureAwait(false);
            }
            finally
            {
                semaphore.Release();
            }
            long len = new FileInfo(t.Destination).Length;
            Interlocked.Add(ref doneBytes, len);
            if (totalBytes > 0)
                progress?.Report(Math.Min(1, doneBytes / (double)totalBytes));
        }).ToList();

        await Task.WhenAll(jobs).ConfigureAwait(false);
        progress?.Report(1);
    }

    public static bool NeedsDownload(DownloadTask task)
    {
        if (!File.Exists(task.Destination)) return true;
        if (task.Size is > 0)
        {
            try
            {
                if (new FileInfo(task.Destination).Length != task.Size) return true;
            }
            catch { return true; }
        }
        if (!string.IsNullOrEmpty(task.Sha1) && task.Size is null or 0)
        {
            try
            {
                var hash = Convert.ToHexString(SHA1.HashData(File.ReadAllBytes(task.Destination))).ToLowerInvariant();
                if (!string.Equals(hash, task.Sha1, StringComparison.OrdinalIgnoreCase)) return true;
            }
            catch { return true; }
        }
        return false;
    }

    public void Dispose() => _http.Dispose();
}
