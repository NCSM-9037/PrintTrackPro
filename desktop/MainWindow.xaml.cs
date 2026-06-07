using System;
using System.Management;
using System.Windows;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;

namespace PrintTrackPro.Desktop
{
    public partial class MainWindow : Window
    {
        private const string LocalVersion = "1.0.6";
        private ManagementEventWatcher watcher;

        public MainWindow()
        {
            InitializeComponent();
            
            // Hide the main window so it runs silently in the background
            this.Hide();
            this.ShowInTaskbar = false;
            
            // Start pulling student data quietly in the background so it's instant!
            DataCache.StartAutoRefresh();
            
            // Check for updates quietly on startup
            _ = CheckForUpdatesAsync();
            
            StartPrintWatcher();
        }

        private void StartPrintWatcher()
        {
            try
            {
                string query = "SELECT * FROM __InstanceCreationEvent WITHIN 1 WHERE TargetInstance ISA 'Win32_PrintJob'";
                watcher = new ManagementEventWatcher(new WqlEventQuery(query));
                watcher.EventArrived += PrintJobArrived;
                watcher.Start();
            }
            catch (Exception ex)
            {
                MessageBox.Show("Error starting Print Monitor: " + ex.Message);
            }
        }

        private void PrintJobArrived(object sender, EventArrivedEventArgs e)
        {
            try
            {
                ManagementBaseObject baseObject = (ManagementBaseObject)e.NewEvent["TargetInstance"];
                string path = baseObject.SystemProperties["__PATH"]?.Value?.ToString() ?? baseObject.SystemProperties["__RELPATH"]?.Value?.ToString();
                ManagementObject targetInstance = new ManagementObject(path);
                string document = targetInstance["Document"]?.ToString() ?? "Unknown Document";

                int pages = 0;
                if (targetInstance["TotalPages"] != null)
                {
                    int.TryParse(targetInstance["TotalPages"].ToString(), out pages);
                }

                string jobName = targetInstance["Name"]?.ToString() ?? "";
                string printerName = jobName.Contains(",") ? jobName.Split(',')[0] : jobName;
                
                // Read TargetPrinter.txt to see if we should filter
                string configPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "TargetPrinter.txt");
                if (System.IO.File.Exists(configPath))
                {
                    string targetPrinter = System.IO.File.ReadAllText(configPath).Trim();
                    if (!string.IsNullOrEmpty(targetPrinter) && !printerName.Contains(targetPrinter, StringComparison.OrdinalIgnoreCase))
                    {
                        return; // Ignore this print job since it doesn't match the target printer
                    }
                }

                // IMPORTANT: Physically PAUSE the print job in the spooler so it doesn't print!
                try
                {
                    targetInstance.InvokeMethod("Pause", null);
                }
                catch
                {
                    // If pausing fails, we still show the popup
                }

                // Since this runs on a background thread, we must invoke the UI thread to show the popup
                Application.Current.Dispatcher.Invoke(() =>
                {
                    var dialog = new PrintDialogWindow(document, pages, targetInstance);
                    dialog.ShowDialog();
                });
            }
            catch
            {
                // Ignore silent errors from spooler
            }
        }

        protected override void OnClosed(EventArgs e)
        {
            watcher?.Stop();
            watcher?.Dispose();
            base.OnClosed(e);
        }

        private async Task CheckForUpdatesAsync()
        {
            try
            {
                using var client = new HttpClient();
                var response = await client.GetFromJsonAsync<UpdateInfo>("https://printtrack-pro-api.onrender.com/api/updates/latest");
                if (response != null && IsNewerVersion(response.Version, LocalVersion))
                {
                    var result = MessageBox.Show(
                        $"A new version of PrintTrack Pro (v{response.Version}) is available. Would you like to download and install it automatically now?",
                        "Update Available",
                        MessageBoxButton.YesNo,
                        MessageBoxImage.Information);

                    if (result == MessageBoxResult.Yes)
                    {
                        await PerformUpdateAsync(response.DownloadUrl);
                    }
                }
            }
            catch
            {
                // Fail silently so it doesn't crash if offline
            }
        }

        private bool IsNewerVersion(string serverVersion, string localVersion)
        {
            try
            {
                return new Version(serverVersion) > new Version(localVersion);
            }
            catch
            {
                return false;
            }
        }

        private async Task PerformUpdateAsync(string downloadUrl)
        {
            try
            {
                string currentExePath = System.Diagnostics.Process.GetCurrentProcess().MainModule.FileName;
                string currentDir = System.IO.Path.GetDirectoryName(currentExePath);
                string zipPath = System.IO.Path.Combine(currentDir, "update.zip");

                // Download the update zip
                using (var client = new HttpClient())
                {
                    var bytes = await client.GetByteArrayAsync(downloadUrl);
                    await System.IO.File.WriteAllBytesAsync(zipPath, bytes);
                }

                // PowerShell command to wait, extract, delete zip, and restart
                string arguments = $"-Command \"Start-Sleep -Seconds 2; Expand-Archive -Path '{zipPath}' -DestinationPath '{currentDir}' -Force; Remove-Item '{zipPath}'; Start-Process '{currentExePath}'\"";

                System.Diagnostics.ProcessStartInfo psi = new System.Diagnostics.ProcessStartInfo
                {
                    FileName = "powershell.exe",
                    Arguments = arguments,
                    CreateNoWindow = true,
                    UseShellExecute = false
                };

                System.Diagnostics.Process.Start(psi);

                // Exit immediately so file locks are released
                Application.Current.Shutdown();
            }
            catch (Exception ex)
            {
                MessageBox.Show("Failed to download or install update: " + ex.Message, "Update Error", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        private class UpdateInfo
        {
            public string Version { get; set; } = string.Empty;
            public string DownloadUrl { get; set; } = string.Empty;
        }
    }
}