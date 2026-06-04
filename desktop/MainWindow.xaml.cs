using System;
using System.Management;
using System.Windows;

namespace PrintTrackPro.Desktop
{
    public partial class MainWindow : Window
    {
        private ManagementEventWatcher watcher;

        public MainWindow()
        {
            InitializeComponent();
            
            // Hide the main window so it runs silently in the background
            this.Hide();
            this.ShowInTaskbar = false;
            
            // Start pulling student data quietly in the background so it's instant!
            DataCache.StartAutoRefresh();
            
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
                ManagementBaseObject targetInstance = (ManagementBaseObject)e.NewEvent["TargetInstance"];
                
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

                // Since this runs on a background thread, we must invoke the UI thread to show the popup
                Application.Current.Dispatcher.Invoke(() =>
                {
                    var dialog = new PrintDialogWindow(document, pages);
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
    }
}