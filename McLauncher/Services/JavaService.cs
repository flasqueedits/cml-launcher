using System.Diagnostics;
using System.Text.RegularExpressions;

namespace McLauncher.Services;

public static class JavaService
{
    private static readonly Regex VersionRegex = new(@"version\s+""(?<v>\d+(?:\.\d+)?)", RegexOptions.Compiled);

    public static string? FindJava()
    {
        var candidates = new List<string>();

        var appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
        var mojangRuntime = Path.Combine(appData, ".minecraft", "runtime");
        if (Directory.Exists(mojangRuntime))
            candidates.AddRange(Directory.EnumerateFiles(mojangRuntime, "javaw.exe", SearchOption.AllDirectories));

        var pf = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles);
        var pf86 = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86);
        AddJavaHomes(candidates, pf);
        AddJavaHomes(candidates, pf86);

        var javaHome = Environment.GetEnvironmentVariable("JAVA_HOME");
        if (!string.IsNullOrEmpty(javaHome))
            candidates.Add(Path.Combine(javaHome, "bin", "javaw.exe"));

        return candidates
            .Where(File.Exists)
            .OrderByDescending(GetJavaMajor)
            .FirstOrDefault();
    }

    private static void AddJavaHomes(List<string> list, string? root)
    {
        if (string.IsNullOrEmpty(root)) return;
        foreach (var vendor in new[] { "Java", "Microsoft", "Eclipse Adoptium", "Zulu", "Temurin" })
        {
            var dir = Path.Combine(root, vendor);
            if (Directory.Exists(dir))
                list.AddRange(Directory.EnumerateFiles(dir, "javaw.exe", SearchOption.AllDirectories));
        }
    }

    public static int GetJavaMajor(string javaPath)
    {
        try
        {
            var psi = new ProcessStartInfo
            {
                FileName = javaPath,
                Arguments = "-version",
                UseShellExecute = false,
                RedirectStandardError = true,
                CreateNoWindow = true,
            };
            using var p = Process.Start(psi);
            if (p == null) return 0;
            var text = p.StandardError.ReadToEnd();
            p.WaitForExit(3000);
            var match = VersionRegex.Match(text);
            if (!match.Success) return 0;
            var first = int.Parse(match.Groups["v"].Value.Split('.')[0]);
            return first == 1 ? 8 : first;
        }
        catch
        {
            return 0;
        }
    }
}
